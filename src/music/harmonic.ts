import { ChordQuality, RootNote, ScaleMode } from '../types/daw';
import { ROOT_NOTE_VALUES, SCALE_INTERVALS } from './scales';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Returns the 12-TET pitch classes (0-11) that belong to the current root and scale
 */
export function getScalePitchClasses(root: RootNote, scale: ScaleMode): number[] {
  const rootVal = ROOT_NOTE_VALUES[root];
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.major;
  return intervals.map(interval => (rootVal + interval) % 12);
}

/**
 * Checks if a MIDI note is in the active scale
 */
export function isNoteInScale(midi: number, root: RootNote, scale: ScaleMode): boolean {
  const pc = ((midi % 12) + 12) % 12;
  const validPcs = getScalePitchClasses(root, scale);
  return validPcs.includes(pc);
}

/**
 * Snaps a MIDI note to the nearest in-scale note
 */
export function snapMidiToScale(midi: number, root: RootNote, scale: ScaleMode): number {
  const validPcs = getScalePitchClasses(root, scale);
  const pc = ((midi % 12) + 12) % 12;

  if (validPcs.includes(pc)) {
    return midi;
  }

  // Find nearest valid pitch class
  let minDiff = 12;
  let bestPc = validPcs[0];

  for (const targetPc of validPcs) {
    let diff = Math.abs(pc - targetPc);
    if (diff > 6) diff = 12 - diff; // circular distance on pitch wheel
    if (diff < minDiff) {
      minDiff = diff;
      bestPc = targetPc;
    }
  }

  // Calculate the shift
  const octaveBase = Math.floor(midi / 12) * 12;
  let snapped = octaveBase + bestPc;

  // Keep it closest to the original note (can shift up or down an octave if closer)
  if (snapped - midi > 6) snapped -= 12;
  else if (midi - snapped > 6) snapped += 12;

  return Math.max(0, Math.min(127, snapped));
}

/**
 * Converts a scale degree (0 = root, 1 = 2nd, etc.) into an absolute MIDI note
 */
export function degreeToMidi(
  degree: number,
  octaveOffset: number = 0,
  baseOctave: number = 4,
  root: RootNote,
  scale: ScaleMode
): number {
  const rootVal = ROOT_NOTE_VALUES[root];
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.major;
  const numSteps = intervals.length;

  const octaveFromDegree = Math.floor(degree / numSteps);
  const degreeIndex = ((degree % numSteps) + numSteps) % numSteps;
  const interval = intervals[degreeIndex];

  const totalOctave = baseOctave + octaveFromDegree + octaveOffset;
  const midi = (totalOctave + 1) * 12 + rootVal + interval;
  return Math.max(0, Math.min(127, midi));
}

/**
 * Converts MIDI number (e.g. 60) to Note Name (e.g. "C4")
 */
export function midiToNoteName(midi: number): string {
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

/**
 * Converts MIDI number to frequency (Hz)
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getChordForDegree(
  degree: number,
  root: RootNote,
  scale: ScaleMode,
  chordQuality: ChordQuality = 'diatonic'
): { label: string; midiNotes: number[] } {
  const rootMidi = degreeToMidi(degree, 0, 4, root, scale);
  const explicitIntervals: Partial<Record<ChordQuality, number[]>> = {
    dominant7: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10]
  };
  const midiNotes = explicitIntervals[chordQuality]
    ? explicitIntervals[chordQuality]!.map(interval => rootMidi + interval)
    : [0, 2, 4].map(offset => degreeToMidi(degree + offset, 0, 4, root, scale));
  const intervals = midiNotes.map(note => note - rootMidi);
  const quality = chordQuality === 'dominant7' ? '7'
    : chordQuality === 'major7' ? 'maj7'
      : chordQuality === 'minor7' ? 'm7'
        : intervals[1] === 4 && intervals[2] === 7 ? ''
    : intervals[1] === 3 && intervals[2] === 7 ? 'm'
      : intervals[1] === 3 && intervals[2] === 6 ? 'dim'
        : intervals[1] === 4 && intervals[2] === 8 ? 'aug'
          : intervals[1] === 4 && intervals[2] === 9 ? '6' : 'sus';
  return { label: `${midiToNoteName(rootMidi).replace(/\d+$/, '')}${quality}`, midiNotes };
}

export function voiceLeadChord(previous: number[] | undefined, current: number[]): number[] {
  if (!previous?.length || current.length < 2) return [...current].sort((a, b) => a - b);

  const sorted = [...current].sort((a, b) => a - b);
  let best = sorted;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let inversion = 0; inversion < sorted.length; inversion++) {
    const inverted = [...sorted.slice(inversion), ...sorted.slice(0, inversion).map(note => note + 12)];
    for (const octaveShift of [-12, 0, 12]) {
      const candidate = inverted.map(note => note + octaveShift);
      const distance = candidate.reduce((sum, note, index) => sum + Math.abs(note - previous[Math.min(index, previous.length - 1)]), 0);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

export function getVoicedProgression(
  degrees: number[],
  qualities: ChordQuality[] | undefined,
  root: RootNote,
  scale: ScaleMode
): number[][] {
  let previous: number[] | undefined;
  return degrees.map((degree, index) => {
    const chord = getChordForDegree(degree, root, scale, qualities?.[index] ?? 'diatonic');
    previous = voiceLeadChord(previous, chord.midiNotes);
    return previous;
  });
}

export function snapMidiToChord(midi: number, chordNotes: number[]): number {
  const pitchClasses = new Set(chordNotes.map(note => ((note % 12) + 12) % 12));
  let nearest = midi;
  let distance = Number.POSITIVE_INFINITY;
  for (let candidate = Math.max(0, midi - 12); candidate <= Math.min(127, midi + 12); candidate++) {
    if (!pitchClasses.has(candidate % 12)) continue;
    const candidateDistance = Math.abs(candidate - midi);
    if (candidateDistance < distance) {
      nearest = candidate;
      distance = candidateDistance;
    }
  }
  return nearest;
}
