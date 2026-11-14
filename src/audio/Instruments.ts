import * as Tone from 'tone';
import { DrumSound, InstrumentType } from '../types/daw';

export interface InstrumentChannel {
  type: InstrumentType;
  volumeNode: Tone.Volume;
  pannerNode: Tone.Panner;
  triggerNote: (note: string | number, duration: number | string, time?: number, velocity?: number) => void;
  attackNote?: (note: string | number, time?: number, velocity?: number) => void;
  releaseNote?: (note: string | number, time?: number) => void;
  triggerDrum?: (drum: DrumSound, time?: number, velocity?: number) => void;
  setMacro: (paramKey: 'param1' | 'param2', value: number) => void;
  silenceAll: () => void;
  dispose: () => void;
}

/**
 * High-quality synthesized Drum Machine (808 / Modern Pop / Lo-Fi)
 */
export function createDrumChannel(destination: Tone.ToneAudioNode): InstrumentChannel {
  const volumeNode = new Tone.Volume(0);
  const pannerNode = new Tone.Panner(0);

  // Drum Synthesizers with tight, punchy envelopes
  const kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 }
  });

  const snareNoise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
  });
  const snareTone = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
  });

  const clapNoise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0 }
  });

  const hatFilter = new Tone.Filter(8000, 'highpass');
  const hatSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.04, release: 0.04 },
    harmonicity: 5.1,
    modulationIndex: 28,
    resonance: 4000,
    octaves: 1.5
  });
  hatSynth.connect(hatFilter);

  const percSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.08, release: 0.08 },
    harmonicity: 3.1,
    modulationIndex: 14,
    resonance: 3000,
    octaves: 2
  });
  let lastHatTriggerTime = Number.NEGATIVE_INFINITY;
  let lastPercTriggerTime = Number.NEGATIVE_INFINITY;

  // Reverb send for drum room ambience
  const drumReverb = new Tone.Freeverb({ roomSize: 0.3, dampening: 4000, wet: 0.08 });

  // Connect synths through drum chain
  kickSynth.connect(pannerNode);
  snareNoise.connect(drumReverb);
  snareTone.connect(pannerNode);
  clapNoise.connect(drumReverb);
  hatFilter.connect(pannerNode);
  percSynth.connect(drumReverb);
  drumReverb.connect(pannerNode);

  pannerNode.connect(volumeNode);
  volumeNode.connect(destination);

  return {
    type: 'drums',
    volumeNode,
    pannerNode,
    triggerNote: () => {},
    triggerDrum: (drum: DrumSound, time?: number, velocity: number = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      const t = time !== undefined ? time : Tone.now();

      switch (drum) {
        case 'kick':
          kickSynth.triggerAttackRelease('C1', '8n', t, vel);
          break;
        case 'snare':
          snareTone.triggerAttackRelease('G2', '16n', t, vel * 0.9);
          snareNoise.triggerAttackRelease('16n', t, vel);
          break;
        case 'clap':
          clapNoise.triggerAttackRelease('16n', t, vel);
          break;
        case 'hat_closed':
          hatSynth.envelope.decay = 0.035;
          lastHatTriggerTime = Math.max(t, lastHatTriggerTime + 0.001);
          hatSynth.triggerAttackRelease('32n', lastHatTriggerTime, vel * 0.7);
          break;
        case 'hat_open':
          hatSynth.envelope.decay = 0.25;
          lastHatTriggerTime = Math.max(t, lastHatTriggerTime + 0.001);
          hatSynth.triggerAttackRelease('16n', lastHatTriggerTime, vel * 0.8);
          break;
        case 'perc':
          lastPercTriggerTime = Math.max(t, lastPercTriggerTime + 0.001);
          percSynth.triggerAttackRelease('16n', lastPercTriggerTime, vel * 0.8);
          break;
      }
    },
    setMacro: (paramKey, value) => {
      const normalized = value / 100;
      if (paramKey === 'param1') {
        // Param 1 = "Punch"
        kickSynth.pitchDecay = 0.025 + normalized * 0.075;
        kickSynth.envelope.decay = 0.16 + normalized * 0.28;
      } else if (paramKey === 'param2') {
        // Param 2 = "Room Ambience"
        drumReverb.wet.value = normalized * 0.35;
      }
    },
    silenceAll: () => {
      // Drums are one-shots with short decays
    },
    dispose: () => {
      kickSynth.dispose();
      snareNoise.dispose();
      snareTone.dispose();
      clapNoise.dispose();
      hatSynth.dispose();
      hatFilter.dispose();
      percSynth.dispose();
      drumReverb.dispose();
      pannerNode.dispose();
      volumeNode.dispose();
    }
  };
}

/**
 * Punchy Analog / Sub Bass Synth Channel
 */
export function createBassChannel(destination: Tone.ToneAudioNode): InstrumentChannel {
  const volumeNode = new Tone.Volume(0);
  const pannerNode = new Tone.Panner(0);
  const distortion = new Tone.Distortion(0.08);
  const filter = new Tone.Filter(1100, 'lowpass', -24);
  const mainGain = new Tone.Gain(0.72);
  const subGain = new Tone.Gain(0.8);

  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: {
      Q: 2,
      type: 'lowpass',
      rolloff: -24
    },
    envelope: {
      attack: 0.008,
      decay: 0.3,
      sustain: 0.42,
      release: 0.16
    },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.28,
      sustain: 0.12,
      release: 0.18,
      baseFrequency: 70,
      octaves: 3,
      exponent: 2
    }
  });
  const subSynth = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    filter: { Q: 0.5, type: 'lowpass', rolloff: -12 },
    envelope: { attack: 0.012, decay: 0.24, sustain: 0.62, release: 0.18 },
    filterEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.2, baseFrequency: 45, octaves: 1, exponent: 2 }
  });

  synth.connect(filter);
  filter.connect(distortion);
  distortion.connect(mainGain);
  mainGain.connect(pannerNode);
  subSynth.connect(subGain);
  subGain.connect(pannerNode);
  pannerNode.connect(volumeNode);
  volumeNode.connect(destination);

  return {
    type: 'bass',
    volumeNode,
    pannerNode,
    triggerNote: (note, duration, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttackRelease(note, duration, time, vel);
      subSynth.triggerAttackRelease(note, duration, time, vel);
    },
    attackNote: (note, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttack(note, time, vel);
      subSynth.triggerAttack(note, time, vel);
    },
    releaseNote: (note, time) => {
      synth.triggerRelease(time);
      subSynth.triggerRelease(time);
    },
    setMacro: (paramKey, value) => {
      const normalized = value / 100;
      if (paramKey === 'param1') {
        distortion.distortion = 0.04 + normalized * 0.48;
      } else if (paramKey === 'param2') {
        filter.frequency.value = 280 + normalized * 2100;
      }
    },
    silenceAll: () => {
      try {
        synth.triggerRelease();
        subSynth.triggerRelease();
      } catch (e) {
        // ignore
      }
    },
    dispose: () => {
      synth.dispose();
      subSynth.dispose();
      filter.dispose();
      distortion.dispose();
      mainGain.dispose();
      subGain.dispose();
      pannerNode.dispose();
      volumeNode.dispose();
    }
  };
}

/**
 * Polyphonic Keys & Chord Channel (Felt Piano / Warm Rhodes / Lush Pad)
 */
export function createKeysChannel(destination: Tone.ToneAudioNode): InstrumentChannel {
  const volumeNode = new Tone.Volume(0);
  const pannerNode = new Tone.Panner(0);
  const chorus = new Tone.Chorus(2.0, 2.0, 0.25).start();
  const filter = new Tone.Filter(4000, 'lowpass');

  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 2.5,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: {
      attack: 0.008,
      decay: 0.45,
      sustain: 0.2,
      release: 0.45
    },
    modulationEnvelope: { attack: 0.01, decay: 0.28, sustain: 0.15, release: 0.3 }
  });

  synth.maxPolyphony = 12;
  synth.connect(filter);
  filter.connect(chorus);
  chorus.connect(pannerNode);
  pannerNode.connect(volumeNode);
  volumeNode.connect(destination);

  return {
    type: 'keys',
    volumeNode,
    pannerNode,
    triggerNote: (note, duration, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttackRelease(note, duration, time, vel);
    },
    attackNote: (note, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttack(note, time, vel);
    },
    releaseNote: (note, time) => {
      synth.triggerRelease(note, time);
    },
    setMacro: (paramKey, value) => {
      const normalized = value / 100;
      if (paramKey === 'param1') {
        filter.frequency.value = 900 + normalized * 7100;
        synth.set({ modulationIndex: 1.2 + normalized * 4.8 });
      } else if (paramKey === 'param2') {
        // Param 2 = "Dreamy Chorus"
        chorus.wet.value = normalized * 0.6;
      }
    },
    silenceAll: () => {
      try {
        synth.releaseAll();
      } catch (e) {
        // ignore
      }
    },
    dispose: () => {
      synth.dispose();
      filter.dispose();
      chorus.dispose();
      pannerNode.dispose();
      volumeNode.dispose();
    }
  };
}

/**
 * Expressive Lead & Melody Synth Channel
 */
export function createLeadChannel(destination: Tone.ToneAudioNode): InstrumentChannel {
  const volumeNode = new Tone.Volume(0);
  const pannerNode = new Tone.Panner(0);
  const delay = new Tone.PingPongDelay({ delayTime: '8n', feedback: 0.2, wet: 0.15 });
  const filter = new Tone.Filter(4500, 'lowpass');

  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: {
      attack: 0.006,
      decay: 0.22,
      sustain: 0.3,
      release: 0.16
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0.1,
      release: 0.2,
      baseFrequency: 450,
      octaves: 3
    }
  });

  synth.portamento = 0.03; // Smooth subtle glide for lead melodies
  synth.connect(filter);
  filter.connect(delay);
  delay.connect(pannerNode);
  pannerNode.connect(volumeNode);
  volumeNode.connect(destination);

  return {
    type: 'lead',
    volumeNode,
    pannerNode,
    triggerNote: (note, duration, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttackRelease(note, duration, time, vel);
    },
    attackNote: (note, time, velocity = 100) => {
      const vel = Math.max(0.1, Math.min(1.0, velocity / 127));
      synth.triggerAttack(note, time, vel);
    },
    releaseNote: (note, time) => {
      synth.triggerRelease(time);
    },
    setMacro: (paramKey, value) => {
      const normalized = value / 100;
      if (paramKey === 'param1') {
        // Param 1 = "Echo / Delay" wet
        delay.wet.value = normalized * 0.45;
      } else if (paramKey === 'param2') {
        // Param 2 = "Glide Speed"
        synth.portamento = normalized * 0.15;
      }
    },
    silenceAll: () => {
      try {
        synth.triggerRelease();
      } catch (e) {
        // ignore
      }
    },
    dispose: () => {
      synth.dispose();
      filter.dispose();
      delay.dispose();
      pannerNode.dispose();
      volumeNode.dispose();
    }
  };
}
