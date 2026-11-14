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
          kickSynth.triggerAttackRelease('C1', '16n', t, vel);
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
          hatSynth.triggerAttackRelease('32n', t, vel * 0.7);
          break;
        case 'hat_open':
          hatSynth.envelope.decay = 0.25;
          hatSynth.triggerAttackRelease('16n', t, vel * 0.8);
          break;
        case 'perc':
          percSynth.triggerAttackRelease('16n', t, vel * 0.8);
          break;
      }
    },
    setMacro: (paramKey, value) => {
      const normalized = value / 100;
      if (paramKey === 'param1') {
        // Param 1 = "Punch"
        kickSynth.pitchDecay = 0.02 + normalized * 0.06;
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
  const filter = new Tone.Filter(800, 'lowpass', -24);

  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: {
      Q: 2,
      type: 'lowpass',
      rolloff: -24
    },
    envelope: {
      attack: 0.005,
      decay: 0.25,
      sustain: 0.05,
      release: 0.1
    },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0.05,
      release: 0.15,
      baseFrequency: 70,
      octaves: 3,
      exponent: 2
    }
  });

  synth.connect(filter);
  filter.connect(distortion);
  distortion.connect(pannerNode);
  pannerNode.connect(volumeNode);
  volumeNode.connect(destination);

  return {
    type: 'bass',
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
        // Param 1 = "Growl" (Distortion drive)
        distortion.distortion = normalized * 0.4;
      } else if (paramKey === 'param2') {
        // Param 2 = "Cutoff" (Filter brightness)
        filter.frequency.value = 80 + normalized * 3000;
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
      distortion.dispose();
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

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.015,
      decay: 0.35,
      sustain: 0.15,
      release: 0.25
    }
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
        // Param 1 = "Brightness" (Filter cutoff)
        filter.frequency.value = 400 + normalized * 7000;
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
    oscillator: { type: 'square' },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.2,
      release: 0.2
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0.1,
      release: 0.2,
      baseFrequency: 300,
      octaves: 2.5
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
