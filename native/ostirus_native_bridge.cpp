// OsTIrus Web - native DSP audio bridge (GPL-3.0-or-later).
// This application never uploads a ROM. Firmware stays on the local machine.
#include "virusLib/device.h"
#include "virusLib/deviceModel.h"
#include "synthLib/audioTypes.h"
#include "synthLib/midiTypes.h"
#ifdef OSTIRUS_USE_PORTAUDIO
#include "portaudio.h"
#endif
#include <algorithm>
#include <array>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <iterator>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

namespace {
constexpr size_t kFrames = 128;
constexpr int kChannels = 12;
std::vector<uint8_t> readRom(const std::string& filename) {
    std::ifstream file(filename, std::ios::binary);
    if (!file) throw std::runtime_error("Cannot read ROM file");
    file.seekg(0, std::ios::end);
    const auto len = file.tellg();
    if (len < 0 || len > 32 * 1024 * 1024) throw std::runtime_error("ROM size is invalid");
    file.seekg(0);
    return std::vector<uint8_t>(std::istreambuf_iterator<char>(file), {});
}
struct AudioEngine {
    explicit AudioEngine(std::vector<uint8_t> rom, float sampleRate) {
        synthLib::DeviceCreateParams p;
        p.preferredSamplerate = sampleRate;
        p.hostSamplerate = sampleRate;
        p.romData = std::move(rom);
        p.customData = static_cast<uint32_t>(virusLib::DeviceModel::TI2);
        dev = std::make_unique<virusLib::Device>(p);
        if (!dev->isValid()) throw std::runtime_error("TI2 initialization did not complete");
        for (size_t c = 0; c < outputs.size(); ++c) {
            outputs[c].fill(0.0f);
            outPtrs[c] = outputs[c].data();
        }
        inputs[0] = silence.data();
        inputs[1] = silence.data();
    }
    std::unique_ptr<virusLib::Device> dev;
    std::array<std::array<float, kFrames>, kChannels> outputs{};
    std::array<float, kFrames> silence{};
    synthLib::TAudioInputs inputs{};
    synthLib::TAudioOutputs outPtrs{};
    std::vector<synthLib::SMidiEvent> midiOut;
    void process(const std::vector<synthLib::SMidiEvent>& midi, float* stereo) {
        for (auto& a : outputs) a.fill(0.0f);
        midiOut.clear();
        dev->process(inputs, outPtrs, kFrames, midi, midiOut);
        // The TI2 main stereo output is ch 0/1; preserve others for later routing.
        for (size_t i = 0; i < kFrames; ++i) {
            const float left = outputs[0][i], right = outputs[1][i];
            stereo[2 * i]     = std::isfinite(left) ? std::clamp(left, -1.f, 1.f) : 0.0f;
            stereo[2 * i + 1] = std::isfinite(right) ? std::clamp(right, -1.f, 1.f) : 0.0f;
        }
    }
};
struct MidiInput {
    std::mutex mutex;
    std::vector<synthLib::SMidiEvent> queue;
    std::atomic<bool> quit{false};
    void add(uint8_t a, uint8_t b, uint8_t c) {
        std::lock_guard<std::mutex> lock(mutex);
        if (queue.size() < 1024)
            queue.emplace_back(synthLib::MidiEventSource::Host, a, b, c);
    }
    std::vector<synthLib::SMidiEvent> drain() {
        std::lock_guard<std::mutex> lock(mutex);
        std::vector<synthLib::SMidiEvent> out;
        out.swap(queue);
        return out;
    }
    void readCommands() {
        std::string line;
        while (std::getline(std::cin, line)) {
            std::istringstream in(line);
            std::string verb;
            int a = 0, b = 0, c = 0;
            in >> verb;
            if (verb == "quit") { quit.store(true); return; }
            if (verb == "panic") {
                for (int channel = 0; channel < 16; ++channel) {
                    add(static_cast<uint8_t>(0xB0 | channel), 123, 0);
                    add(static_cast<uint8_t>(0xB0 | channel), 120, 0);
                }
            } else if (verb == "note" && in >> a >> b && a >= 0 && a <= 127 && b >= 0 && b <= 127) {
                add(b ? 0x90 : 0x80, static_cast<uint8_t>(a), static_cast<uint8_t>(b));
            } else if (verb == "off" && in >> a && a >= 0 && a <= 127) {
                add(0x80, static_cast<uint8_t>(a), 0);
            } else if (verb == "program" && in >> a && a >= 0 && a <= 127) {
                add(0xC0, static_cast<uint8_t>(a), 0);
            } else if (verb == "bank" && in >> a && a >= 0 && a <= 127) {
                add(0xB0, 0, static_cast<uint8_t>(a));
            } else if (verb == "cc" && in >> a >> b && a >= 0 && a <= 127 && b >= 0 && b <= 127) {
                add(0xB0, static_cast<uint8_t>(a), static_cast<uint8_t>(b));
            } else if (verb == "midi" && in >> a >> b >> c && (a & 0x80) && a < 256 && b >= 0 && b < 128 && c >= 0 && c < 128) {
                add(static_cast<uint8_t>(a), static_cast<uint8_t>(b), static_cast<uint8_t>(c));
            }
        }
        quit.store(true);
    }
};
void nativeProbe(AudioEngine& engine) {
    constexpr size_t kBlocks = 1200;
    MidiInput events;
    std::array<float, kFrames * 2> pcm{};
    long samples = 0, active = 0;
    double sum = 0, peak = 0;
    const auto start = std::chrono::steady_clock::now();
    for (size_t block = 0; block < kBlocks; ++block) {
        if (block == 180) { events.add(0xB0, 0, 0); events.add(0xC0, 0, 0); }
        if (block == 250) events.add(0x90, 60, 110);
        if (block == 1050) events.add(0x80, 60, 0);
        engine.process(events.drain(), pcm.data());
        for (const auto s : pcm) { peak = std::max(peak, static_cast<double>(std::abs(s))); sum += static_cast<double>(s) * s; ++samples; if (std::abs(s)>0.0001f) ++active; }
    }
    const auto elapsed = std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count();
    std::cout << "OSTIRUS_PROBE {\"frames\":" << kFrames*kBlocks
              << ",\"rate\":44100,\"peak\":" << peak
              << ",\"rms\":" << std::sqrt(sum / samples)
              << ",\"active_samples\":" << active
              << ",\"render_seconds\":" << elapsed << "}\n";
    if (peak < 0.01 || active < 8000) throw std::runtime_error("No meaningful audio from native TI2");
}
#ifdef OSTIRUS_USE_PORTAUDIO
struct PortAudioGuard {
    PortAudioGuard() { auto error=Pa_Initialize(); if(error!=paNoError) throw std::runtime_error(Pa_GetErrorText(error)); }
    ~PortAudioGuard() { Pa_Terminate(); }
};
#endif
}
int main(int argc, char** argv) {
    try {
        std::string romPath;
        bool probe=false;
        for(int i=1;i<argc;i++) {
            const std::string a=argv[i];
            if(a=="--rom" && i+1<argc) romPath=argv[++i];
            else if(a=="--probe") probe=true;
            else { std::cerr<<"Usage: ostirus_native_bridge --rom PATH [--probe]\n"; return 2; }
        }
        if (romPath.empty()) { std::cerr<<"Missing --rom PATH\n"; return 2; }
#ifdef OSTIRUS_USE_PORTAUDIO
        std::unique_ptr<PortAudioGuard> pa;
        double rate = 44100.0;
        if (!probe) {
            pa = std::make_unique<PortAudioGuard>();
            auto id=Pa_GetDefaultOutputDevice();
            if(id==paNoDevice) throw std::runtime_error("No default audio output device");
            const auto* info=Pa_GetDeviceInfo(id);
            const auto sampleRate=info->defaultSampleRate;
            if (sampleRate==48000.0 || sampleRate==44100.0 || sampleRate==96000.0 || sampleRate==88200.0)
                rate = sampleRate;
        }
#else
        if (!probe) throw std::runtime_error("This build supports --probe only (PortAudio unavailable)");
        double rate = 44100;
#endif
        std::cerr<<"Initializing native Virus TI2...\n";
        AudioEngine engine(readRom(romPath), static_cast<float>(rate));
        std::cerr<<"Native TI2 booted, audio channels="<<engine.dev->getChannelCountOut()<<"\n";
        if (probe) { nativeProbe(engine); return 0; }
#ifdef OSTIRUS_USE_PORTAUDIO
        PaStream* stream=nullptr;
        const auto err=Pa_OpenDefaultStream(&stream,0,2,paFloat32,rate,kFrames,nullptr,nullptr);
        if(err!=paNoError) throw std::runtime_error(Pa_GetErrorText(err));
        if(Pa_StartStream(stream)!=paNoError) throw std::runtime_error("Cannot start PortAudio stream");
        MidiInput events;
        std::thread reader([&events]{events.readCommands();});
        reader.detach();
        std::cout<<"OSTIRUS_READY {\"rate\":"<<rate<<",\"outputs\":12,\"engine\":\"TI2-native\"}"<<std::endl;
        std::array<float,kFrames*2> pcm{};
        while(!events.quit.load()) {
            engine.process(events.drain(), pcm.data());
            const auto result=Pa_WriteStream(stream,pcm.data(),kFrames);
            if(result!=paNoError && result!=paOutputUnderflowed) { std::cerr<<"Audio stream error: "<<Pa_GetErrorText(result)<<"\n"; break; }
        }
        Pa_StopStream(stream);
        Pa_CloseStream(stream);
#endif
        return 0;
    } catch(const std::exception& e) { std::cerr<<"OSTIRUS_ERROR: "<<e.what()<<"\n";return 1; }
}
