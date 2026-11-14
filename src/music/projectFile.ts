import { MasterEffects, MidiBlock, ProjectMeta, Track } from '../types/daw';

export const PROJECT_FILE_FORMAT = 'noobie-daw-project';
export const PROJECT_FILE_VERSION = 1;

export interface ProjectFile {
  format: typeof PROJECT_FILE_FORMAT;
  version: typeof PROJECT_FILE_VERSION;
  savedAt: string;
  meta: ProjectMeta;
  tracks: Track[];
  blocks: MidiBlock[];
  masterFx: MasterEffects;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isShortString = (value: unknown, maxLength: number): value is string =>
  isString(value) && value.length > 0 && value.length <= maxLength;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNumberBetween = (value: unknown, min: number, max: number): value is number =>
  isFiniteNumber(value) && value >= min && value <= max;

export const isProjectMeta = (value: unknown): value is ProjectMeta => {
  if (!isRecord(value)) return false;
  return isShortString(value.id, 128)
    && isShortString(value.title, 200)
    && isNumberBetween(value.bpm, 40, 240)
    && ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].includes(String(value.rootNote))
    && ['major', 'minor', 'pentatonic_major', 'pentatonic_minor', 'blues', 'dorian'].includes(String(value.scale))
    && typeof value.scaleLock === 'boolean'
    && typeof value.loopEnabled === 'boolean'
    && Number.isInteger(value.loopStartBar) && isNumberBetween(value.loopStartBar, 1, 128)
    && Number.isInteger(value.loopEndBar) && isNumberBetween(value.loopEndBar, 2, 129)
    && Number.isInteger(value.totalBars) && isNumberBetween(value.totalBars, 1, 128)
    && value.loopStartBar <= value.totalBars
    && value.loopEndBar > value.loopStartBar
    && value.loopEndBar <= value.totalBars + 1
    && (value.chordProgression === undefined || (Array.isArray(value.chordProgression) && value.chordProgression.length <= 128 && value.chordProgression.every(degree => Number.isInteger(degree) && degree >= 0 && degree <= 11)))
    && (value.chordQualities === undefined || (Array.isArray(value.chordQualities) && value.chordQualities.length <= 128 && value.chordQualities.every(quality => ['diatonic', 'dominant7', 'major7', 'minor7'].includes(String(quality)))))
    && (value.soundStyle === undefined || ['hip-hop', 'rock', 'chiptunes', 'pop'].includes(String(value.soundStyle)));
};

export const isProjectTrack = (value: unknown): value is Track => {
  if (!isRecord(value) || !isRecord(value.macros)) return false;
  return isShortString(value.id, 128)
    && isShortString(value.name, 128)
    && isShortString(value.emoji, 32)
    && ['drums', 'bass', 'keys', 'lead'].includes(String(value.instrumentType))
    && isShortString(value.presetId, 128)
    && typeof value.color === 'string' && /^#[\da-f]{6}$/i.test(value.color)
    && isNumberBetween(value.volume, 0, 1)
    && isNumberBetween(value.pan, -1, 1)
    && typeof value.muted === 'boolean'
    && typeof value.soloed === 'boolean'
    && (value.followChords === undefined || typeof value.followChords === 'boolean')
    && isNumberBetween(value.macros.param1, 0, 100)
    && isNumberBetween(value.macros.param2, 0, 100)
    && (value.soundStyleOverride === undefined || value.soundStyleOverride === null || ['hip-hop', 'rock', 'chiptunes', 'pop'].includes(String(value.soundStyleOverride)));
};

const isNote = (value: unknown, maxSteps: number): boolean => {
  if (!isRecord(value)) return false;
  return isShortString(value.id, 128)
    && Number.isSafeInteger(value.step) && Number(value.step) >= 0 && Number(value.step) < maxSteps
    && Number.isSafeInteger(value.durationSteps) && Number(value.durationSteps) >= 1 && Number(value.durationSteps) <= 2048
    && isNumberBetween(value.velocity, 0, 127)
    && (value.degree === undefined || (Number.isSafeInteger(value.degree) && Number(value.degree) >= -128 && Number(value.degree) <= 128))
    && (value.octaveOffset === undefined || (Number.isSafeInteger(value.octaveOffset) && Number(value.octaveOffset) >= -8 && Number(value.octaveOffset) <= 8))
    && (value.midi === undefined || isNumberBetween(value.midi, 0, 127))
    && (value.drumSound === undefined || ['kick', 'snare', 'clap', 'hat_closed', 'hat_open', 'perc'].includes(String(value.drumSound)));
};

export const isProjectBlock = (value: unknown): value is MidiBlock => {
  if (!isRecord(value)) return false;
  const durationBars = Number(value.durationBars);
  const maxNotes = 4096;
  return isShortString(value.id, 128)
    && isShortString(value.trackId, 128)
    && isShortString(value.name, 128)
    && Number.isInteger(value.startBar) && isNumberBetween(value.startBar, 1, 128)
    && Number.isInteger(value.durationBars) && isNumberBetween(value.durationBars, 1, 128)
    && value.startBar + durationBars - 1 <= 128
    && isShortString(value.category, 128)
    && Array.isArray(value.notes) && value.notes.length <= maxNotes && value.notes.every(note => isNote(note, durationBars * 16))
    && (value.emoji === undefined || (isString(value.emoji) && value.emoji.length <= 32))
    && (value.color === undefined || (typeof value.color === 'string' && /^#[\da-f]{6}$/i.test(value.color)));
};

export const isProjectMasterEffects = (value: unknown): value is MasterEffects => {
  if (!isRecord(value)) return false;
  return ['volume', 'reverb', 'delay', 'filterCutoff', 'saturation', 'glue']
    .every(key => isNumberBetween(value[key], 0, 100));
};

export function createProjectFile(meta: ProjectMeta, tracks: Track[], blocks: MidiBlock[], masterFx: MasterEffects): ProjectFile {
  return {
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    meta: structuredClone(meta),
    tracks: structuredClone(tracks),
    blocks: structuredClone(blocks),
    masterFx: structuredClone(masterFx)
  };
}

export function parseProjectFile(contents: string): ProjectFile {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error('That file is not valid project JSON.');
  }

  if (!isRecord(value) || value.format !== PROJECT_FILE_FORMAT) {
    throw new Error('That file is not a Noobie DAW project.');
  }
  if (value.version !== PROJECT_FILE_VERSION) {
    throw new Error(`This project uses an unsupported format version (${String(value.version)}).`);
  }
  if (!isProjectMeta(value.meta) || !Array.isArray(value.tracks) || value.tracks.length === 0 || value.tracks.length > 128 || !value.tracks.every(isProjectTrack)
    || !Array.isArray(value.blocks) || value.blocks.length > 4096 || !value.blocks.every(isProjectBlock) || !isProjectMasterEffects(value.masterFx)) {
    throw new Error('This project is incomplete or contains invalid song data.');
  }

  const trackIds = new Set(value.tracks.map(track => track.id));
  const totalNotes = value.blocks.reduce((sum, block) => sum + block.notes.length, 0);
  if (trackIds.size !== value.tracks.length || new Set(value.blocks.map(block => block.id)).size !== value.blocks.length
    || value.blocks.some(block => !trackIds.has(block.trackId)) || totalNotes > 100000) {
    throw new Error('This project has duplicate IDs, invalid track references, or too much song data.');
  }

  return value as unknown as ProjectFile;
}
