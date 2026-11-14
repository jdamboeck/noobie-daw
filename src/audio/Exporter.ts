import * as Tone from 'tone';
import { MasterEffects, MidiBlock, ProjectMeta, Track } from '../types/daw';
import { degreeToMidi, midiToNoteName, snapMidiToScale } from '../music/harmonic';
import {
  createBassChannel,
  createDrumChannel,
  createKeysChannel,
  createLeadChannel,
  InstrumentChannel
} from './Instruments';

/**
 * Encodes an AudioBuffer into standard 16-bit stereo WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + length);
  const view = new DataView(arrayBuffer);

  // Helper to write string ASCII
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');

  /* fmt sub-chunk */
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  /* data sub-chunk */
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write interleaved PCM audio data
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamping between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * High-speed offline song rendering
 */
export async function exportSongToWav(
  meta: ProjectMeta,
  tracks: Track[],
  blocks: MidiBlock[],
  masterFx: MasterEffects,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const secondsPerBeat = 60 / meta.bpm;
  const secondsPerBar = secondsPerBeat * 4;
  const totalDurationSeconds = meta.totalBars * secondsPerBar + 2.0; // add 2s tail for reverb decay

  const buffer = await Tone.Offline(async (context) => {
    // Build offline audio graph
    const masterInput = new Tone.Gain(1);
    const masterFilter = new Tone.Filter(20000, 'lowpass');
    const masterSaturation = new Tone.Distortion(0.02);
    const masterDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.15, wet: 0.08 });
    const masterReverb = new Tone.Freeverb({ roomSize: 0.35, dampening: 3500, wet: 0.1 });
    const masterLimiter = new Tone.Limiter(-0.1);
    const masterGain = new Tone.Gain(masterFx.volume / 100);

    masterInput.connect(masterFilter);
    masterFilter.connect(masterSaturation);
    masterSaturation.connect(masterDelay);
    masterDelay.connect(masterReverb);
    masterReverb.connect(masterLimiter);
    masterLimiter.connect(masterGain);
    masterGain.toDestination();

    masterFilter.frequency.value = Math.exp(Math.log(200) + ((Math.log(20000) - Math.log(200)) / 100) * masterFx.filterCutoff);
    masterSaturation.distortion = (masterFx.saturation / 100) * 0.25;
    masterDelay.wet.value = (masterFx.delay / 100) * 0.3;
    masterReverb.wet.value = (masterFx.reverb / 100) * 0.4;
    const channels = new Map<string, InstrumentChannel>();
    const hasSolo = tracks.some(track => track.soloed);

    for (const track of tracks) {
      let channel: InstrumentChannel;
      switch (track.instrumentType) {
        case 'drums':
          channel = createDrumChannel(masterInput, track.soundStyleOverride ?? meta.soundStyle ?? 'pop');
          break;
        case 'bass':
          channel = createBassChannel(masterInput, track.soundStyleOverride ?? meta.soundStyle ?? 'pop');
          break;
        case 'keys':
          channel = createKeysChannel(masterInput, track.soundStyleOverride ?? meta.soundStyle ?? 'pop');
          break;
        case 'lead':
          channel = createLeadChannel(masterInput, track.soundStyleOverride ?? meta.soundStyle ?? 'pop');
          break;
      }
      channel.volumeNode.volume.value = track.muted ? -Infinity : Tone.gainToDb(track.volume);
      channel.pannerNode.pan.value = track.pan;
      channel.setMacro('param1', track.macros.param1);
      channel.setMacro('param2', track.macros.param2);
      channels.set(track.id, channel);
    }

    const scheduledNotes: Array<{
      channel: InstrumentChannel;
      track: Track;
      note: MidiBlock['notes'][number];
      startTime: number;
      gateSeconds: number;
    }> = [];

    for (const block of blocks) {
      const track = tracks.find(t => t.id === block.trackId);
      if (!track || track.muted || (hasSolo && !track.soloed)) continue;
      const channel = channels.get(track.id);
      if (!channel) continue;

      const blockStartSeconds = (block.startBar - 1) * secondsPerBar;
      const secondsPer16th = secondsPerBeat / 4;

      for (const note of block.notes) {
        scheduledNotes.push({
          channel,
          track,
          note,
          startTime: blockStartSeconds + note.step * secondsPer16th,
          gateSeconds: Math.max(0.04, Math.min(note.durationSteps * secondsPer16th * 0.85, 1.8))
        });
      }
    }

    scheduledNotes.sort((left, right) => left.startTime - right.startTime);

    for (const { channel, track, note, startTime, gateSeconds } of scheduledNotes) {
      if (track.instrumentType === 'drums') {
        if (note.drumSound && channel.triggerDrum) {
          channel.triggerDrum(note.drumSound, startTime, note.velocity);
        }
      } else {
        let midiNote: number;
        const baseOctave = track.instrumentType === 'bass' ? 2 : (track.instrumentType === 'lead' ? 5 : 4);

        if (note.degree !== undefined) {
          midiNote = degreeToMidi(
            note.degree,
            note.octaveOffset || 0,
            baseOctave,
            meta.rootNote,
            meta.scale
          );
        } else if (note.midi !== undefined) {
          midiNote = meta.scaleLock
            ? snapMidiToScale(note.midi, meta.rootNote, meta.scale)
            : note.midi;
        } else {
          continue;
        }

        channel.triggerNote(midiToNoteName(midiNote), gateSeconds, startTime, note.velocity);
      }
    }
  }, totalDurationSeconds);

  return audioBufferToWav(buffer.get() as AudioBuffer);
}
