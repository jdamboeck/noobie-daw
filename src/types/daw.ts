export type RootNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ScaleMode = 'major' | 'minor' | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'dorian';

export type InstrumentType = 'drums' | 'bass' | 'keys' | 'lead';
export type SoundStyle = 'hip-hop' | 'rock' | 'chiptunes' | 'pop';
export type ChordQuality = 'diatonic' | 'dominant7' | 'major7' | 'minor7';

export type DrumSound = 'kick' | 'snare' | 'clap' | 'hat_closed' | 'hat_open' | 'perc';

export interface NoteEvent {
  id: string;
  degree?: number;
  octaveOffset?: number;
  midi?: number;
  drumSound?: DrumSound;
  step: number; // 0 to 16 * durationBars - 1 (16 steps per bar)
  durationSteps: number;
  velocity: number;
}

export interface MidiBlock {
  id: string;
  trackId: string;
  name: string;
  emoji?: string;
  startBar: number;
  durationBars: number;
  color?: string;
  category: string;
  notes: NoteEvent[];
  lockedBy?: string;
}

export interface Track {
  id: string;
  name: string;
  emoji: string;
  instrumentType: InstrumentType;
  presetId: string;
  soundStyleOverride?: SoundStyle | null;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  macros: {
    param1: number; // e.g. Punch / Growl / Sparkle / Echo (0 - 100)
    param2: number; // e.g. Room / Brightness / Cloud / Glide (0 - 100)
  };
}

export interface ProjectMeta {
  id: string;
  title: string;
  bpm: number;
  rootNote: RootNote;
  scale: ScaleMode;
  chordProgression?: number[];
  chordQualities?: ChordQuality[];
  chordLock?: boolean;
  scaleLock: boolean;
  loopEnabled: boolean;
  loopStartBar: number;
  loopEndBar: number;
  totalBars: number;
  soundStyle?: SoundStyle;
}

export interface MasterEffects {
  volume: number; // 0 to 100
  reverb: number; // 0 to 100
  delay: number; // 0 to 100
  filterCutoff: number; // 0 to 100
  saturation: number; // 0 to 100
  glue: number; // 0 to 100
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursorBar?: number;
  cursorTrackId?: string;
  selectedBlockId?: string;
  lastActive: number;
}
