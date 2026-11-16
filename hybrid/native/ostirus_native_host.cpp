// SPDX-License-Identifier: GPL-3.0-or-later
// OsTIrus Web: native audio for a locally supplied, legally owned TI2 firmware.
// This executable neither includes nor uploads firmware.
#include "virusLib/device.h"
#include "virusLib/deviceModel.h"
#include "synthLib/audioTypes.h"
#include "synthLib/midiTypes.h"

#include <algorithm>
#include <array>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
#include <mutex>
#include <sstream>
#include <string>
#include <vector>

#ifdef __APPLE__
#include <AudioToolbox/AudioToolbox.h>
#endif

namespace {
constexpr uint32_t kSampleRate = 44100;
constexpr size_t kFrames = 256;

struct State {
  std::unique_ptr<virusLib::Device> synth;
  std::mutex midiMutex;
  std::vector<synthLib::SMidiEvent> pendingMidi;
  std::vector<synthLib::SMidiEvent> midiOut;
  std::array<std::array<float, kFrames>, 12> audio{};
  std::array<float, kFrames> silence{};
};

void renderBlock(State& state, std::array<float, kFrames * 2>& stereo) {
  synthLib::TAudioInputs inputs{};
  inputs[0] = state.silence.data();
  inputs[1] = state.silence.data();
  synthLib::TAudioOutputs outputs{};
  for (size_t ch = 0; ch < 12; ++ch) {
    std::fill(state.audio[ch].begin(), state.audio[ch].end(), 0.0f);
    outputs[ch] = state.audio[ch].data();
  }
  std::vector<synthLib::SMidiEvent> midi;
  {
    std::lock_guard<std::mutex> guard(state.midiMutex);
    midi.swap(state.pendingMidi);
  }
  state.synth->process(inputs, outputs, kFrames, midi, state.midiOut);
  for (size_t i = 0; i < kFrames; ++i) {
    stereo[i * 2] = state.audio[0][i];
    stereo[i * 2 + 1] = state.audio[1][i];
  }
}

bool midiCommand(State& state, const std::string& command) {
  std::istringstream in(command);
  std::string action;
  int a = 0, b = 0;
  if (!(in >> action)) return false;
  uint8_t status = 0, data1 = 0, data2 = 0;
  if (action == "NOTE" && in >> a >> b && a >= 0 && a <= 127 && b >= 1 && b <= 127) {
    status = 0x90; data1 = static_cast<uint8_t>(a); data2 = static_cast<uint8_t>(b);
  } else if (action == "OFF" && in >> a && a >= 0 && a <= 127) {
    status = 0x80; data1 = static_cast<uint8_t>(a);
  } else if (action == "PROG" && in >> a && a >= 0 && a <= 127) {
    status = 0xC0; data1 = static_cast<uint8_t>(a);
  } else if (action == "CC" && in >> a >> b && a >= 0 && a <= 127 && b >= 0 && b <= 127) {
    status = 0xB0; data1 = static_cast<uint8_t>(a); data2 = static_cast<uint8_t>(b);
  } else {
    return false;
  }
  std::lock_guard<std::mutex> guard(state.midiMutex);
  if (state.pendingMidi.size() < 1024)
    state.pendingMidi.emplace_back(synthLib::MidiEventSource::Host, status, data1, data2);
  return true;
}

#ifdef __APPLE__
void callback(void* opaque, AudioQueueRef queue, AudioQueueBufferRef buffer) {
  auto& state = *static_cast<State*>(opaque);
  std::array<float, kFrames * 2> stereo{};
  try { renderBlock(state, stereo); }
  catch (...) { stereo.fill(0.0f); }
  std::memcpy(buffer->mAudioData, stereo.data(), sizeof(stereo));
  buffer->mAudioDataByteSize = static_cast<UInt32>(sizeof(stereo));
  AudioQueueEnqueueBuffer(queue, buffer, 0, nullptr);
}

int runAudio(State& state) {
  AudioStreamBasicDescription format{};
  format.mSampleRate = kSampleRate;
  format.mFormatID = kAudioFormatLinearPCM;
  format.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
  format.mBytesPerPacket = 2 * sizeof(float);
  format.mFramesPerPacket = 1;
  format.mBytesPerFrame = 2 * sizeof(float);
  format.mChannelsPerFrame = 2;
  format.mBitsPerChannel = 32;
  AudioQueueRef queue = nullptr;
  auto err = AudioQueueNewOutput(&format, callback, &state, nullptr, nullptr, 0, &queue);
  if (err != noErr || !queue) { std::cerr << "[OSTIRUS_ERROR] AudioQueueNewOutput " << err << "\n"; return 4; }
  std::array<AudioQueueBufferRef, 4> buffers{};
  for (auto& buffer : buffers) {
    if (AudioQueueAllocateBuffer(queue, sizeof(float) * kFrames * 2, &buffer) != noErr) {
      AudioQueueDispose(queue, true); return 4;
    }
    std::memset(buffer->mAudioData, 0, sizeof(float) * kFrames * 2);
    buffer->mAudioDataByteSize = sizeof(float) * kFrames * 2;
    AudioQueueEnqueueBuffer(queue, buffer, 0, nullptr);
  }
  if (AudioQueueStart(queue, nullptr) != noErr) { AudioQueueDispose(queue, true); return 4; }
  std::cerr << "[OSTIRUS_READY] audio=CoreAudio rate=44100\n";
  std::string line;
  while (std::getline(std::cin, line)) {
    if (line == "STOP") break;
    midiCommand(state, line);
  }
  AudioQueueStop(queue, true);
  AudioQueueDispose(queue, true);
  return 0;
}
#else
int runOffline(State& state, const std::string& output) {
  std::ofstream file(output, std::ios::binary);
  if (!file) return 5;
  std::cerr << "[OSTIRUS_READY] audio=offline-f32 rate=44100\n";
  for (size_t block = 0; block < 700; ++block) {
    if (block == 150) midiCommand(state, "PROG 0");
    if (block == 200) midiCommand(state, "NOTE 60 110");
    if (block == 600) midiCommand(state, "OFF 60");
    std::array<float, kFrames * 2> stereo{};
    renderBlock(state, stereo);
    file.write(reinterpret_cast<const char*>(stereo.data()), sizeof(stereo));
  }
  return 0;
}
#endif
}  // namespace

int main(int argc, char** argv) {
  std::string romPath, outputPath;
  for (int i = 1; i < argc; ++i) {
    if (std::string(argv[i]) == "--rom" && i + 1 < argc) romPath = argv[++i];
    else if (std::string(argv[i]) == "--output" && i + 1 < argc) outputPath = argv[++i];
  }
  if (romPath.empty()) {
    std::cerr << "Usage: ostirus_native_host --rom local-firmware [--output audio.f32]\n";
    return 2;
  }
  std::ifstream file(romPath, std::ios::binary);
  if (!file) { std::cerr << "[OSTIRUS_ERROR] ROM unavailable\n"; return 2; }
  synthLib::DeviceCreateParams params;
  params.preferredSamplerate = kSampleRate;
  params.hostSamplerate = kSampleRate;
  params.customData = static_cast<uint32_t>(virusLib::DeviceModel::TI2);
  params.romData.assign(std::istreambuf_iterator<char>(file), {});
  State state;
  try { state.synth = std::make_unique<virusLib::Device>(params); }
  catch (const std::exception& e) { std::cerr << "[OSTIRUS_ERROR] " << e.what() << "\n"; return 3; }
  if (!state.synth || !state.synth->isValid()) {
    std::cerr << "[OSTIRUS_ERROR] invalid firmware\n"; return 3;
  }
#ifdef __APPLE__
  return runAudio(state);
#else
  if (outputPath.empty()) return 2;
  return runOffline(state, outputPath);
#endif
}
