// Local headless TI2 test. Configure the native CMake target with this file
// as OSTIRUS_NATIVE_HOST_SOURCE, then run it with the path to a local ROM.
#define main ostirus_application_main
#include "../native/ostirus_native_host.cpp"
#undef main

#include <stdexcept>

int main(int argc, char** argv) {
  if (argc != 2) {
    std::cerr << "Usage: ostirus_native_host /path/to/local-firmware.bin\n";
    return 2;
  }
  try {
    std::ifstream file(argv[1], std::ios::binary);
    if (!file) throw std::runtime_error("local firmware could not be opened");
    synthLib::DeviceCreateParams params;
    params.preferredSamplerate = kSampleRate;
    params.hostSamplerate = kSampleRate;
    params.customData = static_cast<uint32_t>(virusLib::DeviceModel::TI2);
    params.romData.assign(std::istreambuf_iterator<char>(file), {});
    State state;
    state.synth = std::make_unique<virusLib::Device>(params);
    if (!state.synth->isValid()) throw std::runtime_error("invalid firmware");
    auto render = [&](int count) {
      double energy = 0;
      for (int i = 0; i < count; ++i) {
        std::array<float, kFrames * 2> stereo{};
        renderBlock(state, stereo);
        for (const float s : stereo) {
          if (!std::isfinite(s)) throw std::runtime_error("nonfinite audio sample");
          energy += s * s;
        }
      }
      return std::sqrt(energy / (count * kFrames * 2));
    };
    auto dump = [&]() {
      state.presetAvailable = false;
      midiCommand(state, "READ_PRESET");
      render(16);
      if (!state.presetAvailable) throw std::runtime_error("no accepted native preset dump");
      return state.preset;
    };
    render(150);
    midiCommand(state, "PROG 0");
    render(50);
    const auto first = dump();
    midiCommand(state, "PROG 1");
    render(50);
    const auto second = dump();
    if (first.name == second.name) throw std::runtime_error("preset name did not change");
    midiCommand(state, "CC 67 23");
    midiCommand(state, "CC 79 41");
    midiCommand(state, "LFO3_RATE 89");
    render(48);
    const auto after = dump();
    const std::array<uint8_t, 3> expected{23, 41, 89};
    if (after.lfoRates != expected) {
      std::cerr << "Actual rates: " << +after.lfoRates[0] << ' ' << +after.lfoRates[1]
                << ' ' << +after.lfoRates[2] << '\n';
      throw std::runtime_error("LFO RATE edit/readback mismatch");
    }
    auto setParameter = [&](uint8_t page, uint8_t index, uint8_t value) {
      synthLib::SMidiEvent event(synthLib::MidiEventSource::Host, 0, 0, 0);
      event.sysex = {0xf0, 0, 0x20, 0x33, 1, 0x10, page, 0, index, value, 0xf7};
      state.pendingMidi.emplace_back(std::move(event));
    };
    auto readOscillatorParameters = [&]() {
      midiCommand(state, "READ_PRESET");
      for (int i = 0; i < 32; ++i) {
        render(1);
        for (const auto& event : state.midiOut) {
          const auto& bytes = event.sysex;
          if (bytes.size() >= 267 && bytes[6] == 0x10 &&
              bytes[7] == 0 && bytes[8] == 0x40)
            return std::array<uint8_t, 3>{bytes[9 + 128 + 41],
              bytes[9 + 28], bytes[9 + 94]};
        }
      }
      throw std::runtime_error("no oscillator readback");
    };
    for (const auto value : {0, 1}) {
      setParameter(0x71, 41, value);
      setParameter(0x70, 28, value);
      setParameter(0x70, 94, value);
      render(48);
      const std::array<uint8_t, 3> expectedOsc{
        static_cast<uint8_t>(value), static_cast<uint8_t>(value),
        static_cast<uint8_t>(value)};
      if (readOscillatorParameters() != expectedOsc)
        throw std::runtime_error("OSC 3/SYNC/MONO edit/readback mismatch");
    }
    std::cout << "PASS: OSC 3, SYNC, and MONO protocol round-trip (off/on)\n";
    midiCommand(state, "NOTE 60 110");
    const auto rms = render(400);
    midiCommand(state, "OFF 60");
    render(100);
    if (rms < 0.00001) throw std::runtime_error("no audible PCM");
    if (!state.frontpanelRevision.load()) throw std::runtime_error("no DSP frontpanel event");
    std::cout << "PASS: program name, three LFO rates, frontpanel, and real PCM (RMS "
              << rms << ")\n";
  } catch (const std::exception& e) {
    std::cerr << "FAIL: " << e.what() << '\n';
    return 1;
  }
}
