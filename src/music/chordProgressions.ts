import { ScaleMode } from '../types/daw';
import { SCALE_INTERVALS } from './scales';

export interface ChordProgressionSeed {
  id: string;
  name: string;
  emoji: string;
  style: string;
  description: string;
  mode: 'major' | 'minor';
  numerals: string[];
  degrees: number[];
}

export function fitProgressionToScale(degrees: number[], targetScale: ScaleMode, mode: 'major' | 'minor'): number[] {
  const sourceIntervals = mode === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : SCALE_INTERVALS.major;
  const targetIntervals = SCALE_INTERVALS[targetScale];
  return degrees.map(degree => {
    const targetPitch = sourceIntervals[((degree % 7) + 7) % 7];
    return targetIntervals.reduce((closest, interval, index) =>
      Math.abs(interval - targetPitch) < Math.abs(targetIntervals[closest] - targetPitch) ? index : closest, 0
    );
  });
}

export const CHORD_PROGRESSION_SEEDS: ChordProgressionSeed[] = [
  {
    id: 'pop-anthem',
    name: 'Big Pop Hook',
    emoji: '🌈',
    style: 'Pop',
    description: 'A bright, familiar loop with a little emotional lift.',
    mode: 'major',
    numerals: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 4, 5, 3]
  },
  {
    id: 'chart-cycle',
    name: 'Chart Favorite',
    emoji: '📻',
    style: 'Pop',
    description: 'A strong, satisfying turnaround found often in hit-song chord charts.',
    mode: 'major',
    numerals: ['vi', 'IV', 'V', 'I'],
    degrees: [5, 3, 4, 0]
  },
  {
    id: 'doo-wop',
    name: 'Heart & Soul',
    emoji: '💞',
    style: 'Classic pop',
    description: 'The timeless doo-wop turn, warm and easy to sing over.',
    mode: 'major',
    numerals: ['I', 'vi', 'IV', 'V'],
    degrees: [0, 5, 3, 4]
  },
  {
    id: 'pop-minor',
    name: 'Bittersweet Loop',
    emoji: '🌧️',
    style: 'Pop / indie',
    description: 'A darker, gently descending loop with a soft landing.',
    mode: 'minor',
    numerals: ['i', 'VII', 'VI', 'iv'],
    degrees: [0, 6, 5, 3]
  },
  {
    id: 'hip-hop-minor',
    name: 'Headnod Minor',
    emoji: '🎧',
    style: 'Hip-hop / R&B',
    description: 'A mellow minor-key cycle that leaves room for the beat.',
    mode: 'minor',
    numerals: ['i', 'VI', 'III', 'VII'],
    degrees: [0, 5, 2, 6]
  },
  {
    id: 'rock-drive',
    name: 'Guitar Lift',
    emoji: '⚡',
    style: 'Rock',
    description: 'A sturdy, energetic I–IV–V shape for a sing-along chorus.',
    mode: 'major',
    numerals: ['I', 'IV', 'V', 'IV'],
    degrees: [0, 3, 4, 3]
  },
  {
    id: 'blues-twelve',
    name: '12-Bar Blues',
    emoji: '🎷',
    style: 'Blues / rock’n’roll',
    description: 'The classic 12-bar journey: home, away, and back again.',
    mode: 'major',
    numerals: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4]
  },
  {
    id: 'jazz-turnaround',
    name: 'Jazz Turnaround',
    emoji: '🎹',
    style: 'Jazz / soul',
    description: 'A smooth ii–V–I resolution with one extra step to keep it rolling.',
    mode: 'major',
    numerals: ['ii', 'V', 'I', 'vi'],
    degrees: [1, 4, 0, 5]
  },
  {
    id: 'soul-sway',
    name: 'Soul Sway',
    emoji: '🪩',
    style: 'Soul / R&B',
    description: 'A mellow circle of chords with a warm, nostalgic pull.',
    mode: 'major',
    numerals: ['I', 'vi', 'ii', 'V'],
    degrees: [0, 5, 1, 4]
  }
];
