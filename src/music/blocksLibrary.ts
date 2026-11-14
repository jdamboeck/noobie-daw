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

const makeBassNotes = (roots: number[]) => roots.flatMap((root, barIndex) => [0, 4, 8, 12].map((stepInBar, beat) => ({
  degree: beat === 2 ? root + 4 : root,
  octaveOffset: 0,
  step: barIndex * 16 + stepInBar,
  durationSteps: 2,
  velocity: beat === 0 ? 108 : beat === 2 ? 94 : 100
})));

const makeTriadProgression = (roots: number[]) => roots.flatMap((root, barIndex) => [0, 2, 4].map((interval, tone) => ({
  degree: root + interval,
  octaveOffset: root === 0 ? 0 : -1,
  step: barIndex * 16,
  durationSteps: 13,
  velocity: tone === 0 ? 92 : tone === 1 ? 84 : 78
})));

const makeSeventhProgression = (roots: number[]) => roots.flatMap((root, barIndex) => [0, 2, 4, 6].map((interval, tone) => ({
  degree: root + interval,
  octaveOffset: root === 0 ? 0 : -1,
  step: barIndex * 16,
  durationSteps: 12,
  velocity: tone === 0 ? 82 : 70
})));

const makeLeadArpeggio = (roots: number[]) => roots.flatMap((root, barIndex) => [root, root + 2, root + 4, root + 2].map((degree, beat) => ({
  degree,
  octaveOffset: 1,
  step: barIndex * 16 + beat * 4,
  durationSteps: beat === 3 ? 3 : 2,
  velocity: beat === 0 ? 96 : beat === 2 ? 90 : 84
})));

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
  {
    name: 'Steady Backbeat',
    emoji: '🛤️',
    category: 'The Basics',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'A classic kick-on-one, clap-on-two-and-four pop groove.',
    notes: [
      ...[0, 8, 16, 24].map(step => ({ drumSound: 'kick' as const, step, durationSteps: 2, velocity: 110 })),
      ...[4, 12, 20, 28].map(step => ({ drumSound: 'snare' as const, step, durationSteps: 2, velocity: 108 })),
      ...Array.from({ length: 16 }, (_, index) => ({ drumSound: 'hat_closed' as const, step: index * 2, durationSteps: 1, velocity: index % 2 === 0 ? 78 : 62 }))
    ]
  },
  {
    name: 'Half-Time Giants',
    emoji: '🦕',
    category: 'The Basics',
    instrumentType: 'drums',
    durationBars: 2,
    description: 'Big open spaces, with the snare landing on beat three.',
    notes: [
      ...[0, 12, 16, 28].map(step => ({ drumSound: 'kick' as const, step, durationSteps: 2, velocity: 112 })),
      ...[8, 24].map(step => ({ drumSound: 'snare' as const, step, durationSteps: 2, velocity: 116 })),
      ...[2, 6, 10, 14, 18, 22, 26, 30].map(step => ({ drumSound: 'hat_closed' as const, step, durationSteps: 1, velocity: 72 }))
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
    description: 'Pulses between the home note and its fifth: a dependable scale-built foundation.',
    notes: makeBassNotes([0, 4])
  },
  {
    name: 'Octave Hopper',
    emoji: '🐸',
    category: 'Groovy & Funk',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'A root-note bounce with a few scale-step hops for a playful bass hook.',
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
    description: 'A scale walk that circles home and uses a leading note to resolve.',
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
  {
    name: 'Home Base Bounce',
    emoji: '🏠',
    category: 'The Basics',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'A steady tonic groove with fifth-note pops to make the root feel strong.',
    notes: makeBassNotes([0, 0])
  },
  {
    name: 'Relative Pair',
    emoji: '🧩',
    category: 'Chord Friends',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Moves from scale degree six to four, a smooth, familiar pop-song turn.',
    notes: makeBassNotes([5, 3])
  },
  {
    name: 'Lift to Home',
    emoji: '🎈',
    category: 'Chord Friends',
    instrumentType: 'bass',
    durationBars: 2,
    description: 'Steps from four to five, ready to resolve back to the home chord.',
    notes: makeBassNotes([3, 4])
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
    description: 'A scale-built home–subdominant–dominant–home chord journey.',
    notes: makeTriadProgression([0, 3, 4, 0])
  },
  {
    name: 'Movie Ballad',
    emoji: '🎬',
    category: 'Emotional & Deep',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'A familiar six–four–one–five scale-degree path, built from your selected notes.',
    notes: makeTriadProgression([5, 3, 0, 4])
  },
  {
    name: 'Hero Fanfare',
    emoji: '🏆',
    category: 'Epic & Uplifting',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'An uplifting one–five–six–four loop, with every chord drawn from your scale.',
    notes: makeTriadProgression([0, 4, 5, 3])
  },
  {
    name: 'Dreamy Cloud Pad',
    emoji: '☁️',
    category: 'Relaxing & Ambient',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'A gentle two–five–one seventh-chord turn in seven-note scales, with an extra five.',
    notes: makeSeventhProgression([1, 4, 0, 4])
  },
  {
    name: 'Two-Five Landing',
    emoji: '🛬',
    category: 'Chord Friends',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'In seven-note scales, this classic two-to-five-to-one cadence lands back at home.',
    notes: makeTriadProgression([1, 4, 0, 0])
  },
  {
    name: 'Home Again',
    emoji: '🏡',
    category: 'Chord Friends',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Home, relative six, four, then home again—a friendly way to finish a phrase.',
    notes: makeTriadProgression([0, 5, 3, 0])
  },
  {
    name: 'Falling Leaves',
    emoji: '🍂',
    category: 'Chord Friends',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'A stepwise six–five–four move that settles softly on the home chord.',
    notes: makeTriadProgression([5, 4, 3, 0])
  },
  {
    name: 'Scale Staircase',
    emoji: '🪜',
    category: 'The Basics',
    instrumentType: 'keys',
    durationBars: 4,
    description: 'Four neighboring scale chords climb together before returning to the root.',
    notes: makeTriadProgression([0, 1, 2, 0])
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
  },
  {
    name: 'Home to the Fifth',
    emoji: '🛝',
    category: 'Chord Hoppers',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Climbs through the home chord, then hops through the dominant chord.',
    notes: makeLeadArpeggio([0, 4])
  },
  {
    name: 'Six to Four',
    emoji: '🧭',
    category: 'Chord Hoppers',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'A melody made from the chord tones of scale degrees six and four.',
    notes: makeLeadArpeggio([5, 3])
  },
  {
    name: 'Fifth Comes Home',
    emoji: '🏁',
    category: 'Chord Hoppers',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'Follows the five chord back to the home chord for a satisfying landing.',
    notes: makeLeadArpeggio([4, 0])
  },
  {
    name: 'Scale-Step Skip',
    emoji: '🦘',
    category: 'The Basics',
    instrumentType: 'lead',
    durationBars: 2,
    description: 'A simple up-and-down tune using only notes from your selected scale.',
    notes: [
      ...[0, 2, 4, 2, 3, 5, 4, 2].map((degree, index) => ({ degree, octaveOffset: 1, step: index * 2, durationSteps: 1, velocity: index % 4 === 0 ? 94 : 82 })),
      ...[0, 2, 4, 6, 5, 3, 2, 0].map((degree, index) => ({ degree, octaveOffset: 1, step: 16 + index * 2, durationSteps: index === 7 ? 2 : 1, velocity: index === 7 ? 96 : 84 }))
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
