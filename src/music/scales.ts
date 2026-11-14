import { RootNote, ScaleMode } from '../types/daw';

export const ROOT_NOTES: RootNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ROOT_NOTE_VALUES: Record<RootNote, number> = {
  'C': 0,
  'C#': 1,
  'D': 2,
  'D#': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'G': 7,
  'G#': 8,
  'A': 9,
  'A#': 10,
  'B': 11,
};

export const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

export interface VibePreset {
  id: string;
  name: string;
  emoji: string;
  root: RootNote;
  scale: ScaleMode;
  description: string;
}

export const VIBE_PRESETS: VibePreset[] = [
  { id: 'happy', name: 'Sunny & Happy', emoji: '☀️', root: 'C', scale: 'major', description: 'Bright, joyful pop vibes' },
  { id: 'sad', name: 'Moody & Deep', emoji: '🌙', root: 'A', scale: 'minor', description: 'Emotional ballads & drama' },
  { id: 'magic', name: 'Magic Fairytale', emoji: '✨', root: 'G', scale: 'pentatonic_major', description: 'Sparkly, impossible to sound bad' },
  { id: 'chill', name: 'Chill Beach', emoji: '🏖️', root: 'D', scale: 'dorian', description: 'Laid-back groovy vibes' },
  { id: 'blues', name: 'Funky Blues', emoji: '🤠', root: 'E', scale: 'blues', description: 'Soulful groove with swagger' },
  { id: 'rock', name: 'Rock Star', emoji: '⚡', root: 'E', scale: 'pentatonic_minor', description: 'Punchy rock & retro game riffs' },
];

export const SCALE_LABELS: Record<ScaleMode, string> = {
  major: '☀️ Happy & Bright',
  minor: '🌙 Moody & Emotional',
  pentatonic_major: '✨ Magical & Easy',
  pentatonic_minor: '⚡ Rock & Heroic',
  blues: '🤠 Funky Blues',
  dorian: '🏖️ Chill & Groovy',
};
