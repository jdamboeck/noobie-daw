import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InstrumentType, MasterEffects, MidiBlock, NoteEvent, ProjectMeta, SoundStyle, Track, UserPresence } from './types/daw';
import { MidiDeviceInfo } from './types/midi';
import { AudioEngine } from './audio/AudioEngine';
import { exportSongToWav } from './audio/Exporter';
import { MidiManager } from './midi/MidiManager';
import { CollaborationManager, TransportSyncMessage } from './multiplayer/CollaborationManager';
import { BlockTemplate, createBlockFromTemplate, SMART_BLOCKS_TEMPLATES } from './music/blocksLibrary';
import { VIBE_PROGRESSIONS } from './music/scales';
import { createDemoSong } from './music/demoSongs';
import {
  createProjectFile,
  isProjectBlock,
  isProjectMasterEffects,
  isProjectMeta,
  isProjectTrack,
  parseProjectFile
} from './music/projectFile';

import { MusicGarden } from './components/MusicGarden';
import { MidiModal } from './components/MidiModal';
import { ShareModal } from './components/ShareModal';

// Starter Template Tracks & Blocks with Fun Emojis
const DEFAULT_TRACKS: Track[] = [
  {
    id: 'trk-drums',
    name: 'Beat Box',
    emoji: '🥁',
    instrumentType: 'drums',
    presetId: '808-kit',
    color: '#f43f5e',
    volume: 0.85,
    pan: 0,
    muted: false,
    soloed: false,
    macros: { param1: 50, param2: 25 }
  },
  {
    id: 'trk-bass',
    name: 'Bassline',
    emoji: '🎸',
    instrumentType: 'bass',
    presetId: 'analog-sub',
    color: '#10b981',
    volume: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    followChords: true,
    macros: { param1: 20, param2: 60 }
  },
  {
    id: 'trk-keys',
    name: 'Chords & Piano',
    emoji: '🎹',
    instrumentType: 'keys',
    presetId: 'felt-piano',
    color: '#f59e0b',
    volume: 0.75,
    pan: -0.15,
    muted: false,
    soloed: false,
    followChords: true,
    macros: { param1: 60, param2: 45 }
  },
  {
    id: 'trk-lead',
    name: 'Lead Melody',
    emoji: '🚀',
    instrumentType: 'lead',
    presetId: 'neon-synth',
    color: '#06b6d4',
    volume: 0.7,
    pan: 0.15,
    muted: false,
    soloed: false,
    followChords: true,
    macros: { param1: 40, param2: 30 }
  }
];

const makeStarterBlock = (
  name: string,
  emoji: string,
  instrumentType: InstrumentType,
  startBar: number,
  durationBars: number,
  notes: BlockTemplate['notes']
) => createBlockFromTemplate({
  name,
  emoji,
  category: 'Paper Rocket Parade',
  instrumentType,
  durationBars,
  description: 'A part of the starter song, written to fit its chord journey.',
  notes
}, `trk-${instrumentType}`, startBar, DEFAULT_TRACKS.find(track => track.instrumentType === instrumentType)?.color);

const makeBassPhrase = (startBar: number, roots: number[], name: string) => {
  const fifths: Record<number, number> = { 0: 4, 5: 2, 3: 0, 4: 1 };
  const notes = roots.flatMap((root, barIndex) => [0, 4, 8, 12].map((stepInBar, beat) => ({
    degree: beat === 2 ? fifths[root] : root,
    octaveOffset: 0,
    step: barIndex * 16 + stepInBar,
    durationSteps: 2,
    velocity: beat === 0 ? 110 : beat === 2 ? 96 : 102
  })));
  return makeStarterBlock(name, '🎸', 'bass', startBar, 2, notes);
};

const makeKeysPhrase = (startBar: number, roots: number[], name: string) => {
  const chordWalk = [0, 2, 4, 2];
  const notes = roots.flatMap((root, barIndex) => chordWalk.map((chordTone, beat) => ({
    degree: root + chordTone,
    step: barIndex * 16 + beat * 4,
    durationSteps: 3,
    velocity: beat === 0 ? 82 : 70 - (beat % 2) * 5
  })));
  return makeStarterBlock(name, '☁️', 'keys', startBar, 2, notes);
};

const makeMelodyPhrase = (startBar: number, name: string, notes: BlockTemplate['notes']) =>
  makeStarterBlock(name, '🚀', 'lead', startBar, 2, notes);

// Paper Rocket Parade follows C–Am–F–G, then C–Am–F–C in C major.
const DEFAULT_BLOCKS: MidiBlock[] = [
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[3], 'trk-drums', 1, '#f43f5e'),
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[0], 'trk-drums', 3, '#f43f5e'),
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[4], 'trk-drums', 5, '#f43f5e'),
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[0], 'trk-drums', 7, '#f43f5e'),
  makeBassPhrase(1, [0, 5], 'Root rocket · C to Am'),
  makeBassPhrase(3, [3, 4], 'Orbit switch · F to G'),
  makeBassPhrase(5, [0, 5], 'Round two · C to Am'),
  makeBassPhrase(7, [3, 0], 'Home stretch · F to C'),
  makeKeysPhrase(1, [0, 5], 'Cloud steps · C to Am'),
  makeKeysPhrase(3, [3, 4], 'Cloud steps · F to G'),
  makeKeysPhrase(5, [0, 5], 'Cloud steps · C to Am'),
  makeKeysPhrase(7, [3, 0], 'Cloud steps · F to C'),
  makeMelodyPhrase(3, 'First flight', [
    { degree: 5, step: 0, durationSteps: 2, velocity: 92 },
    { degree: 7, step: 4, durationSteps: 2, velocity: 88 },
    { degree: 5, step: 8, durationSteps: 2, velocity: 86 },
    { degree: 3, step: 12, durationSteps: 3, velocity: 92 },
    { degree: 6, step: 16, durationSteps: 2, velocity: 90 },
    { degree: 4, step: 20, durationSteps: 2, velocity: 86 },
    { degree: 1, step: 24, durationSteps: 2, velocity: 88 },
    { degree: 6, step: 28, durationSteps: 3, velocity: 94 }
  ]),
  makeMelodyPhrase(5, 'Starlight answer', [
    { degree: 4, step: 0, durationSteps: 2, velocity: 88 },
    { degree: 2, step: 4, durationSteps: 2, velocity: 84 },
    { degree: 4, step: 8, durationSteps: 2, velocity: 90 },
    { degree: 7, step: 12, durationSteps: 3, velocity: 94 },
    { degree: 2, step: 16, durationSteps: 2, velocity: 88 },
    { degree: 7, step: 20, durationSteps: 2, velocity: 86 },
    { degree: 5, step: 24, durationSteps: 2, velocity: 90 },
    { degree: 7, step: 28, durationSteps: 3, velocity: 96 }
  ]),
  makeMelodyPhrase(7, 'Home among the stars', [
    { degree: 5, step: 0, durationSteps: 2, velocity: 90 },
    { degree: 7, step: 4, durationSteps: 2, velocity: 88 },
    { degree: 5, step: 8, durationSteps: 2, velocity: 86 },
    { degree: 3, step: 12, durationSteps: 3, velocity: 90 },
    { degree: 4, step: 16, durationSteps: 2, velocity: 88 },
    { degree: 2, step: 20, durationSteps: 2, velocity: 84 },
    { degree: 0, step: 24, durationSteps: 4, velocity: 98 },
    { degree: 0, step: 28, durationSteps: 4, velocity: 92 }
  ])
].map((block, blockIndex) => ({
  ...block,
  id: `default-block-${blockIndex}`,
  notes: block.notes.map((note, noteIndex) => ({ ...note, id: `default-block-${blockIndex}-note-${noteIndex}` }))
}));

export function App() {
  // Session State
  const [meta, setMeta] = useState<ProjectMeta>({
    id: 'jam-project',
    title: 'Paper Rocket Parade',
    bpm: 112,
    rootNote: 'C',
    scale: 'major',
    chordProgression: Array.from({ length: 16 }, (_, index) => VIBE_PROGRESSIONS.happy[index % VIBE_PROGRESSIONS.happy.length]),
    scaleLock: true,
    loopEnabled: true,
    loopStartBar: 1,
    loopEndBar: 9,
    totalBars: 16,
    soundStyle: 'pop'
  });

  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [blocks, setBlocks] = useState<MidiBlock[]>(DEFAULT_BLOCKS);
  const [masterFx, setMasterFx] = useState<MasterEffects>({
    volume: 85,
    reverb: 25,
    delay: 20,
    filterCutoff: 95,
    saturation: 15,
    glue: 20
  });

  // UI & Selection State
  const [activeTrackId, setActiveTrackId] = useState<string>('trk-keys');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPosition, setPlayheadPosition] = useState<number>(1);
  const [pendingRemotePlay, setPendingRemotePlay] = useState<TransportSyncMessage | null>(null);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Hardware & Peers
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [peers, setPeers] = useState<UserPresence[]>([]);
  const midiNoteTrackIds = useRef<Map<string, string>>(new Map());
  const tracksRef = useRef(tracks);
  const metaRef = useRef(meta);
  tracksRef.current = tracks;
  metaRef.current = meta;

  const audioEngine = AudioEngine.getInstance();
  const midiManager = MidiManager.getInstance();
  const collabManager = CollaborationManager.getInstance();

  // Explicit User-Gesture MIDI Access Request
  const handleRequestMidiAccess = useCallback(async (sysex: boolean = false) => {
    await midiManager.requestAccess(sysex);
    setMidiDevices(midiManager.getConnectedDevices());
  }, [midiManager]);

  // Initialize Audio & Collaboration on Mount
  useEffect(() => {
    // 1. Get Room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestedRoomId = urlParams.get('room');
    const hasValidRoomId = Boolean(requestedRoomId && requestedRoomId.length <= 128);
    const roomId = hasValidRoomId ? requestedRoomId! : `jam-${window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
    if (!hasValidRoomId) {
      const roomUrl = new URL(window.location.href);
      roomUrl.searchParams.set('room', roomId);
      window.history.replaceState(window.history.state, '', roomUrl);
    }

    // 2. Connect WebRTC Collaboration Manager
    collabManager.connect(roomId, {
      meta,
      tracks,
      blocks,
      masterFx
    });

    const unsubState = collabManager.onStateChange(() => {
      // Bound peer-controlled collections before converting Yjs records into React state.
      if (collabManager.yTracks.size > 128 || collabManager.yBlocks.size > 4096) return;
      // Sync state from Yjs doc
      const remoteMeta = collabManager.yMeta.toJSON();
      if (remoteMeta && Object.keys(remoteMeta).length > 0) {
        setMeta(prev => {
          const candidate = { ...prev, ...remoteMeta };
          return isProjectMeta(candidate) ? candidate : prev;
        });
      }
      const remoteTracks = collabManager.getTracks();
      const validTracks = remoteTracks.filter(isProjectTrack);
      const validTrackIds = new Set(validTracks.map(track => track.id));
      if (validTracks.length > 0 && validTrackIds.size === validTracks.length) {
        setTracks(validTracks);
      }
      const remoteBlocks = collabManager.getBlocks();
      if (validTracks.length > 0) {
        const validBlocks = remoteBlocks.filter((block) => isProjectBlock(block) && validTrackIds.has(block.trackId));
        const noteCount = validBlocks.reduce((total, block) => total + block.notes.length, 0);
        if (noteCount <= 100000) setBlocks(validBlocks);
      }
      const remoteFx = collabManager.yMasterFx.toJSON();
      if (remoteFx && Object.keys(remoteFx).length > 0) {
        setMasterFx(prev => {
          const candidate = { ...prev, ...remoteFx };
          return isProjectMasterEffects(candidate) ? candidate : prev;
        });
      }
    });

    const unsubPeers = collabManager.onPeersChange((newPeers) => {
      setPeers(newPeers);
    });

    const unsubTransport = collabManager.onTransportAction((action) => {
      if (action.action === 'play') {
        audioEngine.seekToBar(action.bar);
        setPlayheadPosition(action.bar);
        if (!audioEngine.isReadyForRemotePlayback()) {
          setPendingRemotePlay(action);
          setIsPlaying(false);
          return;
        }
        setPendingRemotePlay(null);
        audioEngine.play(action.timestamp).then(() => setIsPlaying(true)).catch((err) => {
          setPendingRemotePlay(action);
          setIsPlaying(false);
          console.error('Could not start playback from a collaborator:', err);
        });
      } else if (action.action === 'pause') {
        audioEngine.seekToBar(action.bar);
        audioEngine.pause();
        setIsPlaying(false);
        setPendingRemotePlay(null);
      } else if (action.action === 'stop') {
        audioEngine.stop();
        audioEngine.seekToBar(action.bar);
        setIsPlaying(false);
        setPlayheadPosition(action.bar);
        setPendingRemotePlay(null);
      } else {
        audioEngine.seekToBar(action.bar);
        setPlayheadPosition(action.bar);
        setPendingRemotePlay((pending) => pending ? { ...pending, bar: action.bar } : null);
      }
    });

    // 3. Setup AudioEngine Playhead Callback
    let lastPresenceBar = -1;
    audioEngine.setPlayheadTickCallback((bar) => {
      setPlayheadPosition(bar);
      if (!audioEngine.getIsPlaying()) setIsPlaying(false);
      const cursorBar = Math.floor(bar);
      if (cursorBar !== lastPresenceBar) {
        lastPresenceBar = cursorBar;
        collabManager.updateLocalPresence({ cursorBar });
      }
    });

    // 4. Try automatic silent MIDI connection (works immediately if enabled in Firefox or allowed in Chrome)
    midiManager.tryAutoConnect().then(() => {
      setMidiDevices(midiManager.getConnectedDevices());
    });

    // 5. Listen for device changes
    const unsubDevices = midiManager.onDevicesChanged((devices) => {
      setMidiDevices(devices);
    });

    // 5. Global Drag & Drop listener for templates
    const handleDropTemplate = (e: any) => {
      const { templateIndex, trackId, bar } = e.detail ?? {};
      const template = Number.isInteger(templateIndex) ? SMART_BLOCKS_TEMPLATES[templateIndex] : undefined;
      const targetTrack = tracksRef.current.find(t => t.id === trackId);
      if (template && targetTrack && Number.isInteger(bar) && bar >= 1 && bar <= 128) {
        const boundedBar = Math.min(bar, 128 - template.durationBars + 1);
        const newBlock = createBlockFromTemplate(template, targetTrack.id, boundedBar, targetTrack.color);
        if (boundedBar + template.durationBars - 1 > metaRef.current.totalBars) {
          collabManager.updateMeta({ totalBars: boundedBar + template.durationBars - 1 });
        }
        collabManager.addBlock(newBlock);
      }
    };
    window.addEventListener('jamblocks:dropTemplate', handleDropTemplate);

    return () => {
      unsubState();
      unsubPeers();
      unsubTransport();
      unsubDevices();
      window.removeEventListener('jamblocks:dropTemplate', handleDropTemplate);
      collabManager.disconnect();
    };
  }, []);

  // Sync Audio Engine on state updates
  useEffect(() => {
    audioEngine.updateSession(meta, tracks, blocks);
  }, [meta, tracks, blocks]);

  useEffect(() => {
    audioEngine.updateMasterEffects(masterFx);
  }, [masterFx]);

  // Handle Incoming MIDI note messages to active track
  useEffect(() => {
    const unsubMidi = midiManager.onNote((msg) => {
      const noteKey = `${msg.channel}:${msg.note}`;
      if (msg.type === 'noteon') {
        midiNoteTrackIds.current.set(noteKey, activeTrackId);
        audioEngine.attackMidiNote(activeTrackId, msg.note, msg.velocity);
      } else {
        const trackId = midiNoteTrackIds.current.get(noteKey) || activeTrackId;
        midiNoteTrackIds.current.delete(noteKey);
        audioEngine.releaseMidiNote(trackId, msg.note);
      }
    });
    return () => unsubMidi();
  }, [activeTrackId, audioEngine, midiManager]);

  // Spacebar Play / Pause Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Playback Handlers
  const handlePlayToggle = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      collabManager.broadcastTransport('pause', playheadPosition);
    } else {
      const startBar = playheadPosition;
      if (pendingRemotePlay) audioEngine.seekToBar(startBar);
      const action = collabManager.broadcastTransport('play', startBar);
      await audioEngine.play(action.timestamp);
      setIsPlaying(true);
      setPendingRemotePlay(null);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    const startBar = meta.loopEnabled ? meta.loopStartBar : 1;
    setPlayheadPosition(startBar);
    setPendingRemotePlay(null);
    collabManager.broadcastTransport('stop', startBar);
  };

  const handleStartFresh = () => {
    handleStop();
    collabManager.clearBlocks();
    setSelectedBlockId(null);
  };

  const handleSeek = (bar: number) => {
    audioEngine.seekToBar(bar);
    setPlayheadPosition(bar);
    setPendingRemotePlay((pending) => pending ? { ...pending, bar } : null);
    collabManager.broadcastTransport('seek', bar);
  };

  // Track & Block Operations
  const handleAddTrack = (type: InstrumentType) => {
    const colors: Record<InstrumentType, string> = {
      drums: '#f43f5e',
      bass: '#10b981',
      keys: '#f59e0b',
      lead: '#06b6d4'
    };
    const names: Record<InstrumentType, string> = {
      drums: 'Beat Box',
      bass: 'Bassline',
      keys: 'Keys & Chords',
      lead: 'Lead Melody'
    };
    const emojis: Record<InstrumentType, string> = {
      drums: '🥁',
      bass: '🎸',
      keys: '🎹',
      lead: '🚀'
    };

    const newTrack: Track = {
      id: `trk-${Date.now()}`,
      name: `${names[type]} ${tracks.filter(t => t.instrumentType === type).length + 1}`,
      emoji: emojis[type],
      instrumentType: type,
      presetId: 'default',
      color: colors[type],
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      followChords: type !== 'drums',
      macros: { param1: 50, param2: 50 },
      soundStyleOverride: null
    };
    collabManager.addTrack(newTrack);
    setActiveTrackId(newTrack.id);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (tracks.length <= 1) return;
    collabManager.removeTrack(trackId);
    if (activeTrackId === trackId) {
      setActiveTrackId(tracks.find(track => track.id !== trackId)?.id || '');
    }
    if (blocks.some(block => block.trackId === trackId && block.id === selectedBlockId)) {
      setSelectedBlockId(null);
    }
  };

  const handleAddBlockFromTemplate = (template: BlockTemplate) => {
    const targetTrack = tracks.find(track => track.instrumentType === template.instrumentType)
      || tracks.find(track => track.id === activeTrackId)
      || tracks[0];
    const trackBlocks = blocks.filter(b => b.trackId === targetTrack.id);
    let targetBar = 1;
    if (trackBlocks.length > 0) {
      const lastBlock = trackBlocks.reduce((max, b) => (b.startBar + b.durationBars > max ? b.startBar + b.durationBars : max), 1);
      targetBar = lastBlock;
    }

    targetBar = Math.min(targetBar, 128 - template.durationBars + 1);
    const requiredBars = targetBar + template.durationBars - 1;
    if (requiredBars > meta.totalBars) collabManager.updateMeta({ totalBars: requiredBars });

    const newBlock = createBlockFromTemplate(template, targetTrack.id, targetBar, targetTrack.color);
    collabManager.addBlock(newBlock);
    setSelectedBlockId(newBlock.id);
    setActiveTrackId(targetTrack.id);
  };

  const handleAddBlankBlock = (instrumentType: InstrumentType) => {
    handleAddBlockFromTemplate({
      name: 'My pattern',
      emoji: '🪴',
      category: 'Made by you',
      instrumentType,
      durationBars: 2,
      description: 'A little patch of music, ready for your ideas.',
      notes: []
    });
  };

  const handleMoveBlock = (blockId: string, newTrackId: string, newStartBar: number) => {
    collabManager.updateBlock(blockId, { startBar: newStartBar, trackId: newTrackId });
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const duplicated: MidiBlock = {
      ...block,
      id: `block-${Date.now()}`,
      startBar: Math.min(block.startBar + block.durationBars, 128 - block.durationBars + 1),
      notes: block.notes.map(n => ({ ...n, id: `note-${Date.now()}-${Math.random()}` }))
    };
    const requiredBars = duplicated.startBar + duplicated.durationBars - 1;
    if (requiredBars > meta.totalBars) collabManager.updateMeta({ totalBars: requiredBars });
    collabManager.addBlock(duplicated);
  };

  const handleRemoveBlock = (blockId: string) => {
    collabManager.removeBlock(blockId);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Export to WAV Handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const wavBlob = await exportSongToWav(meta, tracks, blocks, masterFx);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.title.replace(/\s+/g, '_')}_JamBlocks.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please check browser audio permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveProject = () => {
    const project = createProjectFile(meta, tracks, blocks, masterFx);
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = meta.title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'my-song';
    link.href = url;
    link.download = `${filename}.noobie.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Song files must be smaller than 10 MB.');
      const project = parseProjectFile(await file.text());
      if (!window.confirm(`Load “${project.meta.title}” and replace the song currently open? This will also update the shared song for everyone in this room.`)) return;
      handleStop();
      collabManager.replaceProject(project);
      setActiveTrackId(project.tracks[0].id);
      setSelectedBlockId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not load that song file.');
    }
  };

  const handleLoadDemo = (style: SoundStyle) => {
    const demo = createDemoSong(style);
    if (!window.confirm(`Load “${demo.meta.title}” and replace the song currently open? This will also update the shared song for everyone in this room.`)) return;
    handleStop();
    collabManager.replaceProject(demo);
    setActiveTrackId(demo.tracks[0].id);
    setSelectedBlockId(null);
    setPlayheadPosition(demo.meta.loopStartBar || 1);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  return (
    <>
      <MusicGarden
        meta={meta}
        tracks={tracks}
        blocks={blocks}
        masterFx={masterFx}
        activeTrackId={activeTrackId}
        selectedBlock={selectedBlock}
        playheadPosition={playheadPosition}
        isPlaying={isPlaying}
        peers={peers}
        midiDevices={midiDevices}
        isExporting={isExporting}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onLoadDemo={handleLoadDemo}
        showKeyboard={showKeyboard}
        pendingRemotePlay={Boolean(pendingRemotePlay)}
        onPlayToggle={handlePlayToggle}
        onStop={handleStop}
        onStartFresh={handleStartFresh}
        onMetaChange={(update) => collabManager.updateMeta(update)}
        onSetSoundStyle={(style) => collabManager.setSoundStyle(style)}
        onFxChange={(update) => collabManager.updateMasterEffects(update)}
        onSelectTrack={setActiveTrackId}
        onSelectBlock={setSelectedBlockId}
        onSeek={handleSeek}
        onAddTrack={handleAddTrack}
        onRemoveTrack={handleRemoveTrack}
        onSetTrackChordFollow={(trackId, followChords) => collabManager.updateTrack(trackId, { followChords })}
        onPlantSeed={handleAddBlockFromTemplate}
        onPlantBlank={handleAddBlankBlock}
        onPreviewSeed={(template) => {
          const previewTrack = tracks.find(track => track.instrumentType === template.instrumentType) || tracks[0];
          void audioEngine.previewPattern(previewTrack.id, template.notes);
        }}
        onRemoveBlock={handleRemoveBlock}
        onMoveBlock={handleMoveBlock}
        onToggleMute={(track) => collabManager.updateTrack(track.id, { muted: !track.muted })}
        onVolumeChange={(trackId, volume) => collabManager.updateTrack(trackId, { volume })}
        onOpenMidi={() => setIsMidiModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onExport={handleExport}
        onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
        onUpdateTrackMacros={(macros) => collabManager.updateTrack(activeTrackId, { macros })}
        onUpdateTrackStyle={(style: SoundStyle | null) => collabManager.updateTrack(activeTrackId, { soundStyleOverride: style })}
        onUpdateBlockNotes={(blockId, notes) => collabManager.updateBlock(blockId, { notes })}
        onAuditionNote={(midi) => audioEngine.auditionNote(activeTrackId, midi)}
        onAuditionDrum={(sound) => audioEngine.auditionDrum(activeTrackId, sound)}
      />

      <MidiModal
        devices={midiDevices}
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        onRequestAccess={handleRequestMidiAccess}
      />

      <ShareModal
        roomId={collabManager.roomId}
        peers={peers}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

    </>
  );
}

export default App;
