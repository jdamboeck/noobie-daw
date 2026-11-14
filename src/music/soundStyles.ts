import { SoundStyle } from '../types/daw';

export const SOUND_STYLE_PRESETS: { id: SoundStyle; name: string; emoji: string; description: string }[] = [
  { id: 'hip-hop', name: 'Hip-hop', emoji: '🎤', description: 'Deep 808s and warm, laid-back tones' },
  { id: 'rock', name: 'Rock', emoji: '🎸', description: 'Punchy drums and bright, driven sounds' },
  { id: 'chiptunes', name: 'Chiptunes', emoji: '👾', description: 'Playful square-wave, 8-bit sounds' },
  { id: 'pop', name: 'Pop', emoji: '🌈', description: 'Bright, smooth, feel-good sounds' }
];
