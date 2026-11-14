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
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNumberBetween = (value: unknown, min: number, max: number): value is number =>
  isFiniteNumber(value) && value >= min && value <= max;

const isMeta = (value: unknown): value is ProjectMeta => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.title)
    && isNumberBetween(value.bpm, 40, 240)
    && ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].includes(String(value.rootNote))
    && ['major', 'minor', 'pentatonic_major', 'pentatonic_minor', 'blues', 'dorian'].includes(String(value.scale))
    && typeof value.scaleLock === 'boolean'
    && typeof value.loopEnabled === 'boolean'
    && isNumberBetween(value.loopStartBar, 1, 128)
    && isNumberBetween(value.loopEndBar, 1, 128)
    && isNumberBetween(value.totalBars, 1, 128)
    && (value.chordProgression === undefined || (Array.isArray(value.chordProgression) && value.chordProgression.every(degree => Number.isInteger(degree) && degree >= 0 && degree <= 11)))
    && (value.chordQualities === undefined || (Array.isArray(value.chordQualities) && value.chordQualities.every(quality => ['diatonic', 'dominant7', 'major7', 'minor7'].includes(String(quality)))))
    && (value.soundStyle === undefined || ['hip-hop', 'rock', 'chiptunes', 'pop'].includes(String(value.soundStyle)));
};

const isTrack = (value: unknown): value is Track => {
  if (!isRecord(value) || !isRecord(value.macros)) return false;
  return isString(value.id)
    && isString(value.name)
    && isString(value.emoji)
    && ['drums', 'bass', 'keys', 'lead'].includes(String(value.instrumentType))
    && isString(value.presetId)
    && isString(value.color)
    && isNumberBetween(value.volume, 0, 1)
    && isNumberBetween(value.pan, -1, 1)
    && typeof value.muted === 'boolean'
    && typeof value.soloed === 'boolean'
    && (value.followChords === undefined || typeof value.followChords === 'boolean')
    && isNumberBetween(value.macros.param1, 0, 100)
    && isNumberBetween(value.macros.param2, 0, 100)
    && (value.soundStyleOverride === undefined || value.soundStyleOverride === null || ['hip-hop', 'rock', 'chiptunes', 'pop'].includes(String(value.soundStyleOverride)));
};

const isNote = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && Number.isInteger(value.step) && Number(value.step) >= 0
    && Number.isInteger(value.durationSteps) && Number(value.durationSteps) >= 1
    && isNumberBetween(value.velocity, 0, 127)
    && (value.degree === undefined || Number.isInteger(value.degree))
    && (value.octaveOffset === undefined || Number.isInteger(value.octaveOffset))
    && (value.midi === undefined || isNumberBetween(value.midi, 0, 127))
    && (value.drumSound === undefined || ['kick', 'snare', 'clap', 'hat_closed', 'hat_open', 'perc'].includes(String(value.drumSound)));
};

const isBlock = (value: unknown): value is MidiBlock => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.trackId)
    && isString(value.name)
    && isNumberBetween(value.startBar, 1, 128)
    && isNumberBetween(value.durationBars, 1, 128)
    && isString(value.category)
    && Array.isArray(value.notes) && value.notes.every(isNote)
    && (value.emoji === undefined || isString(value.emoji))
    && (value.color === undefined || isString(value.color));
};

const isMasterEffects = (value: unknown): value is MasterEffects => {
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
  if (!isMeta(value.meta) || !Array.isArray(value.tracks) || value.tracks.length === 0 || !value.tracks.every(isTrack)
    || !Array.isArray(value.blocks) || !value.blocks.every(isBlock) || !isMasterEffects(value.masterFx)) {
    throw new Error('This project is incomplete or contains invalid song data.');
  }

  const trackIds = new Set(value.tracks.map(track => track.id));
  if (trackIds.size !== value.tracks.length || new Set(value.blocks.map(block => block.id)).size !== value.blocks.length
    || value.blocks.some(block => !trackIds.has(block.trackId))) {
    throw new Error('This project has duplicate IDs or sounds attached to a missing track.');
  }

  return value as unknown as ProjectFile;
}
