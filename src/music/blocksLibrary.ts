import { InstrumentType, MidiBlock } from '../types/daw';

export interface BlockTemplate {
  name: string;
  emoji: string;
  category: string;
  instrumentType: InstrumentType;
  durationBars: number;
  description: string;
  notes: Array<{
    degree?: number;
    octaveOffset?: number;
    drumSound?: 'kick' | 'snare' | 'clap' | 'hat_closed' | 'hat_open' | 'perc';
    step: number; // 0 to 16 * durationBars - 1 (16 steps per bar)
    durationSteps: number;
    velocity: number;
  }>;
}

export const SMART_BLOCKS_TEMPLATES: BlockTemplate[] = [
  // ==========================================
  // 🥁 DRUMS & BEATS (2 bars = 32 steps)
  // ==========================================
  {
    name: 'Dance Party',
    emoji: '🪩',
    category: 'Dance & Pop',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Bouncy 4-on-the-floor beat that makes everyone want to dance!',
    notes: [
      ...[0, 4, 8, 12, 16, 20, 24, 28].map(s => ({ drumSound: 'kick' as const, step: s, durationSteps: 2, velocity: 115 })),
      ...[4, 12, 20, 28].map(s => ({ drumSound: 'clap' as const, step: s, durationSteps: 2, velocity: 105 })),
      ...[2, 6, 10, 14, 18, 22, 26, 30].map(s => ({ drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: 90 })),
      { drumSound: 'hat_open', step: 14, durationSteps: 2, velocity: 90 },
      { drumSound: 'hat_open', step: 30, durationSteps: 2, velocity: 95 },
    ]
  },
  {
    name: 'Hip-Hop Headnod',
    emoji: '🧢',
    category: 'Hip-Hop',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Classic boom-bap rhythm with swung kicks and crunchy snares.',
    notes: [
      { drumSound: 'kick', step: 0, durationSteps: 2, velocity: 120 },
      { drumSound: 'kick', step: 6, durationSteps: 2, velocity: 100 },
      { drumSound: 'kick', step: 10, durationSteps: 2, velocity: 110 },
      { drumSound: 'kick', step: 16, durationSteps: 2, velocity: 120 },
      { drumSound: 'kick', step: 22, durationSteps: 2, velocity: 95 },
      { drumSound: 'kick', step: 26, durationSteps: 2, velocity: 115 },
      ...[4, 12, 20, 28].map(s => ({ drumSound: 'snare' as const, step: s, durationSteps: 2, velocity: 115 })),
      ...[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(s => ({
        drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: s % 4 === 0 ? 95 : 70
      })),
      { drumSound: 'perc', step: 15, durationSteps: 1, velocity: 80 },
    ]
  },
  {
    name: 'Speedy Trap Roll',
    emoji: '⚡',
    category: 'Trap',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Fast rolling hi-hats with super punchy bass kicks.',
    notes: [
      { drumSound: 'kick', step: 0, durationSteps: 3, velocity: 125 },
      { drumSound: 'kick', step: 8, durationSteps: 2, velocity: 110 },
      { drumSound: 'kick', step: 16, durationSteps: 3, velocity: 125 },
      { drumSound: 'kick', step: 22, durationSteps: 2, velocity: 105 },
      { drumSound: 'kick', step: 26, durationSteps: 2, velocity: 115 },
      { drumSound: 'snare', step: 8, durationSteps: 2, velocity: 115 },
      { drumSound: 'snare', step: 24, durationSteps: 2, velocity: 120 },
      ...Array.from({ length: 32 }, (_, s) => ({
        drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: s >= 28 ? 105 : (s % 2 === 0 ? 85 : 55)
      }))
    ]
  },
  {
    name: 'Cozy Rainy Day',
    emoji: '☕',
    category: 'Chill & Lo-Fi',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Super relaxed, laid-back beat perfect for daydreaming.',
    notes: [
      { drumSound: 'kick', step: 0, durationSteps: 2, velocity: 90 },
      { drumSound: 'kick', step: 10, durationSteps: 2, velocity: 85 },
      { drumSound: 'kick', step: 16, durationSteps: 2, velocity: 90 },
      { drumSound: 'snare', step: 8, durationSteps: 2, velocity: 85 },
      { drumSound: 'snare', step: 24, durationSteps: 2, velocity: 90 },
      ...[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30].map(s => ({
        drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: 65
      })),
      { drumSound: 'perc', step: 14, durationSteps: 1, velocity: 70 },
      { drumSound: 'perc', step: 28, durationSteps: 1, velocity: 75 },
    ]
  },
  {
    name: 'Rock Monster',
    emoji: '🎸',
    category: 'Rock',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Big stadium rock drum groove with huge snare hits!',
    notes: [
      { drumSound: 'kick', step: 0, durationSteps: 2, velocity: 125 },
      { drumSound: 'kick', step: 2, durationSteps: 2, velocity: 110 },
      { drumSound: 'kick', step: 8, durationSteps: 2, velocity: 120 },
      { drumSound: 'kick', step: 16, durationSteps: 2, velocity: 125 },
      { drumSound: 'kick', step: 24, durationSteps: 2, velocity: 115 },
      { drumSound: 'snare', step: 4, durationSteps: 2, velocity: 120 },
      { drumSound: 'snare', step: 12, durationSteps: 2, velocity: 120 },
      { drumSound: 'snare', step: 20, durationSteps: 2, velocity: 120 },
      { drumSound: 'snare', step: 28, durationSteps: 2, velocity: 125 },
      ...[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(s => ({
        drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: 95
      })),
    ]
  },
  {
    name: 'Clap Frenzy',
    emoji: '👏',
    category: 'Fun & Games',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Double claps and playful syncopated rhythm.',
    notes: [
      ...[0, 8, 16, 24].map(s => ({ drumSound: 'kick' as const, step: s, durationSteps: 2, velocity: 115 })),
      ...[4, 6, 12, 20, 22, 28].map(s => ({ drumSound: 'clap' as const, step: s, durationSteps: 2, velocity: 110 })),
      ...[2, 6, 10, 14, 18, 22, 26, 30].map(s => ({ drumSound: 'hat_closed' as const, step: s, durationSteps: 1, velocity: 85 })),
      { drumSound: 'perc', step: 30, durationSteps: 1, velocity: 95 },
    ]
  },

  // ==========================================
  // 🎸 BASSLINES (2 bars = 32 steps)
  // ==========================================
  {
    name: 'Robot Walker',
    emoji: '🤖',
    category: 'Funky & Electro',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Steady mechanical bass pumping on the beat.',
    notes: [
      ...[0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ degree: 0, octaveOffset: 0, step: s, durationSteps: 1, velocity: 105 })),
      ...[16, 18, 20, 22].map(s => ({ degree: 4, octaveOffset: 0, step: s, durationSteps: 1, velocity: 100 })),
      ...[24, 26, 28, 30].map(s => ({ degree: 0, octaveOffset: 0, step: s, durationSteps: 1, velocity: 105 }))
    ]
  },
  {
    name: 'Bouncing Frog',
    emoji: '🐸',
    category: 'Groovy & Funk',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Jumping octave pops full of mischievous funk!',
    notes: [
      { degree: 0, octaveOffset: 0, step: 0, durationSteps: 1, velocity: 110 },
      { degree: 0, octaveOffset: 1, step: 3, durationSteps: 1, velocity: 95 },
      { degree: 0, octaveOffset: 0, step: 6, durationSteps: 1, velocity: 105 },
      { degree: 0, octaveOffset: 1, step: 9, durationSteps: 1, velocity: 90 },
      { degree: 2, octaveOffset: 0, step: 12, durationSteps: 1, velocity: 100 },
      { degree: 3, octaveOffset: 0, step: 14, durationSteps: 1, velocity: 105 },
      { degree: 0, octaveOffset: 0, step: 16, durationSteps: 1, velocity: 110 },
      { degree: 0, octaveOffset: 1, step: 19, durationSteps: 1, velocity: 95 },
      { degree: 4, octaveOffset: 0, step: 22, durationSteps: 1, velocity: 105 },
      { degree: 3, octaveOffset: 0, step: 26, durationSteps: 1, velocity: 100 },
      { degree: 2, octaveOffset: 0, step: 30, durationSteps: 1, velocity: 95 },
    ]
  },
  {
    name: 'Gentle Stroll',
    emoji: '🚶',
    category: 'Jazz & Soul',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Step-by-step melodic walking bassline.',
    notes: [
      { degree: 0, octaveOffset: 0, step: 0, durationSteps: 2, velocity: 105 },
      { degree: 2, octaveOffset: 0, step: 4, durationSteps: 2, velocity: 95 },
      { degree: 4, octaveOffset: 0, step: 8, durationSteps: 2, velocity: 100 },
      { degree: 3, octaveOffset: 0, step: 12, durationSteps: 2, velocity: 90 },
      { degree: 2, octaveOffset: 0, step: 16, durationSteps: 2, velocity: 105 },
      { degree: 1, octaveOffset: 0, step: 20, durationSteps: 2, velocity: 95 },
      { degree: 0, octaveOffset: 0, step: 24, durationSteps: 2, velocity: 100 },
      { degree: -1, octaveOffset: 0, step: 28, durationSteps: 2, velocity: 90 },
    ]
  },
  {
    name: 'Earthquake Sub',
    emoji: '🌋',
    category: 'Heavy & Deep',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Rumbling deep sub bass that shakes the floor.',
    notes: [
      { degree: 0, octaveOffset: -1, step: 0, durationSteps: 6, velocity: 115 },
      { degree: 3, octaveOffset: -1, step: 16, durationSteps: 4, velocity: 110 },
      { degree: 4, octaveOffset: -1, step: 24, durationSteps: 4, velocity: 115 },
    ]
  },
  {
    name: 'Secret Detective',
    emoji: '🕵️',
    category: 'Mystery & Cinema',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Sneaky, stealthy bassline tip-toeing in the shadows.',
    notes: [
      { degree: 0, octaveOffset: 0, step: 0, durationSteps: 1, velocity: 100 },
      { degree: 1, octaveOffset: 0, step: 4, durationSteps: 1, velocity: 90 },
      { degree: 2, octaveOffset: 0, step: 8, durationSteps: 1, velocity: 95 },
      { degree: 1, octaveOffset: 0, step: 12, durationSteps: 1, velocity: 90 },
      { degree: 0, octaveOffset: 0, step: 16, durationSteps: 1, velocity: 105 },
      { degree: -1, octaveOffset: 0, step: 20, durationSteps: 1, velocity: 95 },
      { degree: 0, octaveOffset: 0, step: 24, durationSteps: 2, velocity: 110 },
    ]
  },

  // ==========================================
  // 🎹 CHORDS & KEYS (4 bars = 64 steps)
  // ==========================================
  {
    name: 'Happy Sunshine',
    emoji: '☀️',
    category: 'Happy & Bright',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Cheerful chords that sound like a warm sunny morning!',
    notes: [
      // Bar 1: I chord (0, 2, 4)
      { degree: 0, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 90 },
      { degree: 2, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 85 },
      { degree: 4, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 85 },
      // Bar 2: IV chord (3, 5, 7)
      { degree: 3, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 90 },
      { degree: 5, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 85 },
      { degree: 7, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 85 },
      // Bar 3: V chord (4, 6, 8)
      { degree: 4, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 90 },
      { degree: 6, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 85 },
      { degree: 8, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 85 },
      // Bar 4: I chord (0, 2, 4)
      { degree: 0, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 95 },
      { degree: 2, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 90 },
      { degree: 4, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 90 },
    ]
  },
  {
    name: 'Movie Ballad',
    emoji: '🎬',
    category: 'Emotional & Deep',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Famous emotional chords heard in Hollywood movie themes.',
    notes: [
      // Bar 1: vi
      { degree: 5, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 85 },
      { degree: 7, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 80 },
      { degree: 9, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 85 },
      // Bar 2: IV
      { degree: 3, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 85 },
      { degree: 5, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 80 },
      { degree: 7, octaveOffset: 0, step: 16, durationSteps: 6, velocity: 85 },
      // Bar 3: I
      { degree: 0, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 90 },
      { degree: 2, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 85 },
      { degree: 4, octaveOffset: 0, step: 32, durationSteps: 6, velocity: 85 },
      // Bar 4: V
      { degree: 4, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 90 },
      { degree: 6, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 85 },
      { degree: 8, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 85 },
    ]
  },
  {
    name: 'Hero Fanfare',
    emoji: '🏆',
    category: 'Epic & Uplifting',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Triumphant chords for winning the grand championship!',
    notes: [
      { degree: 0, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 95 },
      { degree: 2, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 90 },
      { degree: 4, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 90 },
      { degree: 4, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 95 },
      { degree: 6, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 90 },
      { degree: 8, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 90 },
      { degree: 5, octaveOffset: -1, step: 32, durationSteps: 6, velocity: 95 },
      { degree: 7, octaveOffset: -1, step: 32, durationSteps: 6, velocity: 90 },
      { degree: 9, octaveOffset: -1, step: 32, durationSteps: 6, velocity: 90 },
      { degree: 3, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 95 },
      { degree: 5, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 90 },
      { degree: 7, octaveOffset: 0, step: 48, durationSteps: 6, velocity: 90 },
    ]
  },
  {
    name: 'Dreamy Cloud Pad',
    emoji: '☁️',
    category: 'Relaxing & Ambient',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Floating jazzy 7th chords that feel like floating in the sky.',
    notes: [
      { degree: 1, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 75 },
      { degree: 3, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 70 },
      { degree: 5, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 75 },
      { degree: 7, octaveOffset: 0, step: 0, durationSteps: 6, velocity: 70 },
      { degree: 4, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 80 },
      { degree: 6, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 75 },
      { degree: 8, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 75 },
      { degree: 10, octaveOffset: -1, step: 16, durationSteps: 6, velocity: 70 },
      { degree: 0, octaveOffset: 0, step: 32, durationSteps: 8, velocity: 80 },
      { degree: 2, octaveOffset: 0, step: 32, durationSteps: 8, velocity: 75 },
      { degree: 4, octaveOffset: 0, step: 32, durationSteps: 8, velocity: 75 },
      { degree: 6, octaveOffset: 0, step: 32, durationSteps: 8, velocity: 70 },
    ]
  },

  // ==========================================
  // 🚀 LEAD & MELODIES (2 bars = 32 steps)
  // ==========================================
  {
    name: 'Super Jump Melody',
    emoji: '🍄',
    category: 'Video Game',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Retro 8-bit arcade bounce that sounds like jumping over blocks!',
    notes: [
      { degree: 0, octaveOffset: 1, step: 0, durationSteps: 1, velocity: 105 },
      { degree: 2, octaveOffset: 1, step: 2, durationSteps: 1, velocity: 105 },
      { degree: 4, octaveOffset: 1, step: 4, durationSteps: 2, velocity: 110 },
      { degree: 0, octaveOffset: 1, step: 8, durationSteps: 1, velocity: 100 },
      { degree: 4, octaveOffset: 1, step: 10, durationSteps: 1, velocity: 105 },
      { degree: 7, octaveOffset: 1, step: 12, durationSteps: 2, velocity: 115 },
      { degree: 6, octaveOffset: 1, step: 16, durationSteps: 1, velocity: 105 },
      { degree: 4, octaveOffset: 1, step: 18, durationSteps: 1, velocity: 105 },
      { degree: 2, octaveOffset: 1, step: 20, durationSteps: 2, velocity: 100 },
      { degree: 0, octaveOffset: 1, step: 24, durationSteps: 3, velocity: 110 },
    ]
  },
  {
    name: 'Catchy Whistle',
    emoji: '🎵',
    category: 'Pop & Catchy',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Infectious, happy tune that gets stuck in your head all day!',
    notes: [
      { degree: 4, octaveOffset: 1, step: 0, durationSteps: 2, velocity: 100 },
      { degree: 4, octaveOffset: 1, step: 3, durationSteps: 2, velocity: 95 },
      { degree: 3, octaveOffset: 1, step: 6, durationSteps: 2, velocity: 90 },
      { degree: 2, octaveOffset: 1, step: 8, durationSteps: 3, velocity: 105 },
      { degree: 0, octaveOffset: 1, step: 14, durationSteps: 2, velocity: 85 },
      { degree: 2, octaveOffset: 1, step: 16, durationSteps: 2, velocity: 100 },
      { degree: 4, octaveOffset: 1, step: 19, durationSteps: 2, velocity: 95 },
      { degree: 6, octaveOffset: 1, step: 22, durationSteps: 2, velocity: 100 },
      { degree: 7, octaveOffset: 1, step: 24, durationSteps: 4, velocity: 110 },
    ]
  },
  {
    name: 'Sparkle Waterfall',
    emoji: '✨',
    category: 'Magic & Arp',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Rapid shimmering notes cascading down like fairy dust.',
    notes: [
      ...[0, 2, 4, 7, 9, 7, 4, 2].map((deg, i) => ({
        degree: deg, octaveOffset: 1, step: i * 2, durationSteps: 1, velocity: 90
      })),
      ...[0, 2, 4, 7, 9, 11, 12, 11].map((deg, i) => ({
        degree: deg, octaveOffset: 1, step: 16 + i * 2, durationSteps: 1, velocity: 95
      }))
    ]
  },
  {
    name: 'Cosmic Alien Radio',
    emoji: '🛸',
    category: 'Space & Sci-Fi',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Echoey extraterrestrial beeps calling from outer space!',
    notes: [
      { degree: 7, octaveOffset: 1, step: 0, durationSteps: 2, velocity: 110 },
      { degree: 5, octaveOffset: 1, step: 4, durationSteps: 1, velocity: 95 },
      { degree: 3, octaveOffset: 1, step: 8, durationSteps: 2, velocity: 105 },
      { degree: 2, octaveOffset: 1, step: 12, durationSteps: 1, velocity: 90 },
      { degree: 0, octaveOffset: 1, step: 16, durationSteps: 3, velocity: 115 },
      { degree: 2, octaveOffset: 1, step: 22, durationSteps: 1, velocity: 95 },
      { degree: 4, octaveOffset: 1, step: 26, durationSteps: 2, velocity: 105 },
    ]
  }
];

export function createBlockFromTemplate(
  template: BlockTemplate,
  trackId: string,
  startBar: number,
  color?: string
): MidiBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    trackId,
    name: template.name,
    emoji: template.emoji,
    category: template.category,
    startBar,
    durationBars: template.durationBars,
    color: color || '#6366f1',
    notes: template.notes.map((n, idx) => ({
      id: `note-${idx}-${Date.now()}`,
      degree: n.degree,
      octaveOffset: n.octaveOffset,
      drumSound: n.drumSound,
      step: n.step,
      durationSteps: n.durationSteps,
      velocity: n.velocity,
    }))
  };
}
