import { MasterEffects, MidiBlock, ProjectMeta, SoundStyle, Track } from '../types/daw';
import { createBlockFromTemplate, SMART_BLOCKS_TEMPLATES } from './blocksLibrary';

export interface DemoSong {
  style: SoundStyle;
  label: string;
  emoji: string;
  meta: ProjectMeta;
  tracks: Track[];
  blocks: MidiBlock[];
  masterFx: MasterEffects;
}

const definitions: Record<SoundStyle, {
  label: string;
  emoji: string;
  title: string;
  bpm: number;
  rootNote: ProjectMeta['rootNote'];
  scale: ProjectMeta['scale'];
  progression: number[];
  drumTemplate: string;
  bassTemplate: string;
  keysTemplate: string;
  leadTemplate: string;
  tracks: Array<Pick<Track, 'name' | 'emoji' | 'instrumentType' | 'color' | 'volume' | 'pan' | 'macros'>>;
  masterFx: MasterEffects;
}> = {
  'hip-hop': {
    label: 'Hip-hop', emoji: '🎤', title: 'Midnight Sidewalk', bpm: 88, rootNote: 'A', scale: 'minor',
    progression: [0, 5, 2, 6], drumTemplate: 'Hip-Hop Headnod', bassTemplate: 'Earthquake Sub',
    keysTemplate: 'Dreamy Cloud Pad', leadTemplate: 'Secret Detective',
    tracks: [
      { name: 'Pocket Drums', emoji: '🥁', instrumentType: 'drums', color: '#f43f5e', volume: 0.82, pan: 0, macros: { param1: 58, param2: 32 } },
      { name: '808 Underpass', emoji: '🌋', instrumentType: 'bass', color: '#10b981', volume: 0.82, pan: 0, macros: { param1: 68, param2: 42 } },
      { name: 'Rainy Keys', emoji: '🌧️', instrumentType: 'keys', color: '#f59e0b', volume: 0.66, pan: -0.12, macros: { param1: 52, param2: 64 } },
      { name: 'Alleyway Motif', emoji: '🕵️', instrumentType: 'lead', color: '#06b6d4', volume: 0.55, pan: 0.16, macros: { param1: 48, param2: 28 } }
    ],
    masterFx: { volume: 82, reverb: 22, delay: 28, filterCutoff: 78, saturation: 24, glue: 36 }
  },
  rock: {
    label: 'Rock', emoji: '🎸', title: 'Afterburner Avenue', bpm: 132, rootNote: 'E', scale: 'minor',
    progression: [0, 3, 4, 3], drumTemplate: 'Rock Monster', bassTemplate: 'Home Base Bounce',
    keysTemplate: 'Happy Sunshine', leadTemplate: 'Catchy Whistle',
    tracks: [
      { name: 'Garage Kit', emoji: '🥁', instrumentType: 'drums', color: '#f43f5e', volume: 0.9, pan: 0, macros: { param1: 78, param2: 24 } },
      { name: 'Amped Bass', emoji: '🎸', instrumentType: 'bass', color: '#10b981', volume: 0.84, pan: -0.04, macros: { param1: 72, param2: 66 } },
      { name: 'Wide Chords', emoji: '🎹', instrumentType: 'keys', color: '#f59e0b', volume: 0.62, pan: 0.14, macros: { param1: 68, param2: 42 } },
      { name: 'Chorus Hook', emoji: '⚡', instrumentType: 'lead', color: '#06b6d4', volume: 0.74, pan: 0.08, macros: { param1: 22, param2: 58 } }
    ],
    masterFx: { volume: 86, reverb: 18, delay: 12, filterCutoff: 100, saturation: 34, glue: 58 }
  },
  chiptunes: {
    label: 'Chiptunes', emoji: '👾', title: 'Pixel Comet', bpm: 132, rootNote: 'C', scale: 'major',
    progression: [0, 4, 2, 4], drumTemplate: 'Speedy Trap Roll', bassTemplate: 'Robot Walker',
    keysTemplate: 'Scale Staircase', leadTemplate: 'Super Jump Melody',
    tracks: [
      { name: 'Bit Beat', emoji: '🕹️', instrumentType: 'drums', color: '#f43f5e', volume: 0.78, pan: 0, macros: { param1: 66, param2: 18 } },
      { name: 'Coin Bass', emoji: '🪙', instrumentType: 'bass', color: '#10b981', volume: 0.72, pan: 0, macros: { param1: 42, param2: 82 } },
      { name: 'Level Up', emoji: '🧩', instrumentType: 'keys', color: '#f59e0b', volume: 0.66, pan: -0.1, macros: { param1: 78, param2: 24 } },
      { name: 'Pixel Lead', emoji: '👾', instrumentType: 'lead', color: '#06b6d4', volume: 0.76, pan: 0.12, macros: { param1: 34, param2: 18 } }
    ],
    masterFx: { volume: 84, reverb: 8, delay: 18, filterCutoff: 100, saturation: 20, glue: 30 }
  },
  pop: {
    label: 'Pop', emoji: '🌈', title: 'Paper Sky Parade', bpm: 116, rootNote: 'C', scale: 'major',
    progression: [0, 4, 5, 3], drumTemplate: 'Dance Party', bassTemplate: 'Relative Pair',
    keysTemplate: 'Hero Fanfare', leadTemplate: 'Catchy Whistle',
    tracks: [
      { name: 'Bright Beat', emoji: '🥁', instrumentType: 'drums', color: '#f43f5e', volume: 0.84, pan: 0, macros: { param1: 54, param2: 36 } },
      { name: 'Bounce Line', emoji: '🎸', instrumentType: 'bass', color: '#10b981', volume: 0.78, pan: 0, macros: { param1: 48, param2: 56 } },
      { name: 'Sunbeam Chords', emoji: '☀️', instrumentType: 'keys', color: '#f59e0b', volume: 0.68, pan: -0.1, macros: { param1: 62, param2: 48 } },
      { name: 'Singalong', emoji: '🎵', instrumentType: 'lead', color: '#06b6d4', volume: 0.7, pan: 0.12, macros: { param1: 24, param2: 44 } }
    ],
    masterFx: { volume: 85, reverb: 25, delay: 18, filterCutoff: 96, saturation: 14, glue: 40 }
  }
};

export const DEMO_SONGS: Array<Pick<DemoSong, 'style' | 'label' | 'emoji'>> =
  (Object.keys(definitions) as SoundStyle[]).map(style => ({
    style,
    label: definitions[style].label,
    emoji: definitions[style].emoji
  }));

function findTemplate(name: string) {
  const template = SMART_BLOCKS_TEMPLATES.find(item => item.name === name);
  if (!template) throw new Error(`Missing demo pattern: ${name}`);
  return template;
}

export function createDemoSong(style: SoundStyle): DemoSong {
  const definition = definitions[style];
  const totalBars = 8;
  const meta: ProjectMeta = {
    id: `demo-${style}`,
    title: definition.title,
    bpm: definition.bpm,
    rootNote: definition.rootNote,
    scale: definition.scale,
    chordProgression: Array.from({ length: totalBars }, (_, bar) => definition.progression[bar % definition.progression.length]),
    chordQualities: [],
    scaleLock: true,
    loopEnabled: true,
    loopStartBar: 1,
    loopEndBar: totalBars + 1,
    totalBars,
    soundStyle: style
  };

  const tracks: Track[] = definition.tracks.map((track, index) => ({
    ...track,
    id: `demo-${style}-track-${index}`,
    presetId: 'default',
    muted: false,
    soloed: false,
    followChords: track.instrumentType !== 'drums',
    soundStyleOverride: null
  }));

  const blocks: MidiBlock[] = [];
  const addPattern = (trackIndex: number, templateName: string, startBar: number) => {
    const track = tracks[trackIndex];
    const block = createBlockFromTemplate(findTemplate(templateName), track.id, startBar, track.color);
    const id = `demo-${style}-block-${blocks.length}`;
    blocks.push({
      ...block,
      id,
      notes: block.notes.map((note, noteIndex) => ({ ...note, id: `${id}-note-${noteIndex}` }))
    });
  };

  for (const bar of [1, 3, 5, 7]) {
    addPattern(0, definition.drumTemplate, bar);
    addPattern(1, definition.bassTemplate, bar);
  }
  addPattern(2, definition.keysTemplate, 1);
  addPattern(2, definition.keysTemplate, 5);
  addPattern(3, definition.leadTemplate, 3);
  addPattern(3, definition.leadTemplate, 7);

  return { ...definition, style, meta, tracks, blocks };
}
