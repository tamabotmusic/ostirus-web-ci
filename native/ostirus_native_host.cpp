// SPDX-License-Identifier: GPL-3.0-or-later
// OsTIrus Web local audio helper; requires user's own firmware on local disk.
// Engine: GPL Gearmulator / virusLib. No firmware or presets are embedded.
#include "virusLib/device.h"
#include "virusLib/deviceModel.h"
#include "synthLib/audioTypes.h"
#include "synthLib/midiTypes.h"

#include <algorithm>
#include <array>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <cstdlib>
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
  std::array<std::array<float,kFrames>,12> audio{};
  std::array<float,kFrames> silence{};
};

void runBlock(State& state, std::array<float,kFrames*2>& stereo) {
  synthLib::TAudioInputs in{};
  in[0]=state.silence.data(); in[1]=state.silence.data();
  synthLib::TAudioOutputs out{};
  for(size_t ch=0;ch<12;ch++){
    std::fill(state.audio[ch].begin(),state.audio[ch].end(),0.f);
    out[ch]=state.audio[ch].data();
  }
  std::vector<synthLib::SMidiEvent> midi;
  {
    std::lock_guard<std::mutex> lock(state.midiMutex);
    midi.swap(state.pendingMidi);
  }
  state.synth->process(in,out,kFrames,midi,state.midiOut);
  for(size_t i=0;i<kFrames;i++){
    stereo[i*2] = state.audio[0][i];
    stereo[i*2+1] = state.audio[1][i];
  }
}

bool appendMidi(State& state, const std::string& cmd) {
  std::istringstream tokens(cmd);
  std::string action;
  int a=0,b=0;
  if(!(tokens>>action)) return false;
  if(action=="STOP") return false;
  uint8_t status=0,data1=0,data2=0;
  if(action=="NOTE" && tokens>>a>>b && a>=0 && a<=127 && b>=1 && b<=127) {
    status=0x90; data1=static_cast<uint8_t>(a); data2=static_cast<uint8_t>(b);
  } else if(action=="OFF" && tokens>>a && a>=0 && a<=127) {
    status=0x80;data1=static_cast<uint8_t>(a);
  } else if(action=="PROG" && tokens>>a && a>=0 && a<=127) {
    status=0xC0;data1=static_cast<uint8_t>(a);
  } else if(action=="CC" && tokens>>a>>b && a>=0 && a<=127 && b>=0 && b<=127) {
    status=0xB0;data1=static_cast<uint8_t>(a);data2=static_cast<uint8_t>(b);
  } else return false;
  std::lock_guard<std::mutex> lock(state.midiMutex);
  if(state.pendingMidi.size()<1024)
    state.pendingMidi.emplace_back(synthLib::MidiEventSource::Host,status,data1,data2);
  return true;
}

#ifdef __APPLE__
void audioCallback(void* context,AudioQueueRef queue,AudioQueueBufferRef buffer) {
  auto& state=*static_cast<State*>(context);
  std::array<float,kFrames*2> stereo{};
  try { runBlock(state,stereo); }
  catch(...) { stereo.fill(0.f); }
  std::memcpy(buffer->mAudioData,stereo.data(),sizeof(stereo));
  buffer->mAudioDataByteSize=static_cast<UInt32>(sizeof(stereo));
  AudioQueueEnqueueBuffer(queue,buffer,0,nullptr);
}
int runMacAudio(State& state){
  AudioStreamBasicDescription fmt{};
  fmt.mSampleRate=kSampleRate;
  fmt.mFormatID=kAudioFormatLinearPCM;
  fmt.mFormatFlags=kAudioFormatFlagIsFloat|kAudioFormatFlagIsPacked;
  fmt.mBytesPerPacket=2*sizeof(float);
  fmt.mFramesPerPacket=1;
  fmt.mBytesPerFrame=2*sizeof(float);
  fmt.mChannelsPerFrame=2;
  fmt.mBitsPerChannel=32;
  AudioQueueRef queue=nullptr;
  const auto result=AudioQueueNewOutput(&fmt,audioCallback,&state,nullptr,nullptr,0,&queue);
  if(result!=noErr || !queue){std::cerr<<"[OSTIRUS_ERROR] AudioQueueNewOutput "<<result<<"\n";return 4;}
  std::array<AudioQueueBufferRef,4> buffers{};
  for(auto& buffer:buffers){
    if(AudioQueueAllocateBuffer(queue,sizeof(float)*kFrames*2,&buffer)!=noErr){AudioQueueDispose(queue,true);return 4;}
    std::memset(buffer->mAudioData,0,sizeof(float)*kFrames*2);
    buffer->mAudioDataByteSize=sizeof(float)*kFrames*2;
    AudioQueueEnqueueBuffer(queue,buffer,0,nullptr);
  }
  if(AudioQueueStart(queue,nullptr)!=noErr){AudioQueueDispose(queue,true);return 4;}
  std::cerr<<"[OSTIRUS_READY] audio=CoreAudio rate=44100\n";
  std::string line;
  while(std::getline(std::cin,line)){
    if(line=="STOP")break;
    appendMidi(state,line);
  }
  AudioQueueStop(queue,true);
  AudioQueueDispose(queue,true);
  return 0;
}
#else
// Linux diagnostic only: write raw stereo float samples for an offline test.
int runOffline(State& state,const std::string& output){
  std::ofstream f(output,std::ios::binary);
  if(!f) return 5;
  std::cerr<<"[OSTIRUS_READY] audio=offline-f32 rate=44100\n";
  for(size_t i=0;i<700;i++){
    if(i==150)appendMidi(state,"PROG 0");
    if(i==200)appendMidi(state,"NOTE 60 110");
    if(i==600)appendMidi(state,"OFF 60");
    std::array<float,kFrames*2> stereo{};
    runBlock(state,stereo);
    f.write(reinterpret_cast<const char*>(stereo.data()),sizeof(stereo));
  }
  return 0;
}
#endif
} // namespace

int main(int argc,char** argv){
  std::string romPath,outputPath;
  for(int i=1;i<argc;i++){
    if(std::string(argv[i])=="--rom" && i+1<argc)romPath=argv[++i];
    else if(std::string(argv[i])=="--output" && i+1<argc)outputPath=argv[++i];
  }
  if(romPath.empty()){std::cerr<<"Uso: ostirus_native_host --rom ruta-firmware [--output salida.f32]\n";return 2;}
  std::ifstream file(romPath,std::ios::binary);
  if(!file){std::cerr<<"[OSTIRUS_ERROR] ROM no disponible\n";return 2;}
  synthLib::DeviceCreateParams p;
  p.preferredSamplerate=kSampleRate;
  p.hostSamplerate=kSampleRate;
  p.customData=static_cast<uint32_t>(virusLib::DeviceModel::TI2);
  p.romData.assign(std::istreambuf_iterator<char>(file),{});
  State state;
  try {state.synth=std::make_unique<virusLib::Device>(p);}
  catch(const std::exception& e){std::cerr<<"[OSTIRUS_ERROR] "<<e.what()<<"\n";return 3;}
  if(!state.synth || !state.synth->isValid()){std::cerr<<"[OSTIRUS_ERROR] firmware invalido\n";return 3;}
#ifdef __APPLE__
  return runMacAudio(state);
#else
  if(outputPath.empty()){std::cerr<<"En Linux usar --output para prueba offline\n";return 2;}
  return runOffline(state,outputPath);
#endif
}
