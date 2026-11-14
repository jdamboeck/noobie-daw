import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InstrumentType, MasterEffects, MidiBlock, NoteEvent, ProjectMeta, Track, UserPresence } from './types/daw';
import { MidiDeviceInfo } from './types/midi';
import { AudioEngine } from './audio/AudioEngine';
import { exportSongToWav } from './audio/Exporter';
import { MidiManager } from './midi/MidiManager';
import { CollaborationManager, TransportSyncMessage } from './multiplayer/CollaborationManager';
import { BlockTemplate, createBlockFromTemplate, SMART_BLOCKS_TEMPLATES } from './music/blocksLibrary';

import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { Arranger } from './components/Arranger';
import { BlockLibrary } from './components/BlockLibrary';
import { Inspector } from './components/Inspector';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { MidiModal } from './components/MidiModal';
import { ShareModal } from './components/ShareModal';
import { OnboardingTour } from './components/OnboardingTour';

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
    macros: { param1: 40, param2: 30 }
  }
];

// Starter Pre-Populated Blocks with crisp, musical durations
const DEFAULT_BLOCKS: MidiBlock[] = [
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[0], 'trk-drums', 1, '#f43f5e'),  // 🪩 Dance Party Bars 1-2
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[0], 'trk-drums', 3, '#f43f5e'),  // 🪩 Dance Party Bars 3-4
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[6], 'trk-bass', 1, '#10b981'),   // 🤖 Robot Walker Bars 1-2
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[6], 'trk-bass', 3, '#10b981'),   // 🤖 Robot Walker Bars 3-4
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[12], 'trk-keys', 1, '#f59e0b'),  // 🎬 Movie Ballad Bars 1-4
  createBlockFromTemplate(SMART_BLOCKS_TEMPLATES[15], 'trk-lead', 3, '#06b6d4'),  // 🍄 Super Jump Melody Bars 3-4
].map((block, blockIndex) => ({
  ...block,
  id: `default-block-${blockIndex}`,
  notes: block.notes.map((note, noteIndex) => ({ ...note, id: `default-block-${blockIndex}-note-${noteIndex}` }))
}));

export function App() {
  // Session State
  const [meta, setMeta] = useState<ProjectMeta>({
    id: 'jam-project',
    title: 'Collaborative Beat',
    bpm: 116,
    rootNote: 'C',
    scale: 'minor',
    scaleLock: true,
    loopEnabled: true,
    loopStartBar: 1,
    loopEndBar: 5,
    totalBars: 16
  });

  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [blocks, setBlocks] = useState<MidiBlock[]>(DEFAULT_BLOCKS);
  const [masterFx, setMasterFx] = useState<MasterEffects>({
    volume: 85,
    reverb: 25,
    delay: 20,
    filterCutoff: 95,
    saturation: 15
  });

  // UI & Selection State
  const [activeTrackId, setActiveTrackId] = useState<string>('trk-keys');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPosition, setPlayheadPosition] = useState<number>(1);
  const [pendingRemotePlay, setPendingRemotePlay] = useState<TransportSyncMessage | null>(null);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals & Tour
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(true);

  // Hardware & Peers
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [peers, setPeers] = useState<UserPresence[]>([]);
  const midiNoteTrackIds = useRef<Map<string, string>>(new Map());

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
    const roomId = urlParams.get('room') || 'summer-jam';

    // 2. Connect WebRTC Collaboration Manager
    collabManager.connect(roomId, {
      meta,
      tracks,
      blocks,
      masterFx
    });

    const unsubState = collabManager.onStateChange(() => {
      // Sync state from Yjs doc
      const remoteMeta = collabManager.yMeta.toJSON();
      if (remoteMeta && Object.keys(remoteMeta).length > 0) {
        setMeta(prev => ({ ...prev, ...remoteMeta }));
      }
      const remoteTracks = collabManager.getTracks();
      if (remoteTracks && remoteTracks.length > 0) {
        setTracks([...remoteTracks]);
      }
      const remoteBlocks = collabManager.getBlocks();
      if (remoteBlocks) {
        setBlocks([...remoteBlocks]);
      }
      const remoteFx = collabManager.yMasterFx.toJSON();
      if (remoteFx && Object.keys(remoteFx).length > 0) {
        setMasterFx(prev => ({ ...prev, ...remoteFx }));
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
    audioEngine.setPlayheadTickCallback((bar) => {
      setPlayheadPosition(bar);
      if (!audioEngine.getIsPlaying()) setIsPlaying(false);
      collabManager.updateLocalPresence({ cursorBar: bar });
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
      const { templateIndex, trackId, bar } = e.detail;
      const template = SMART_BLOCKS_TEMPLATES[templateIndex];
      const targetTrack = tracks.find(t => t.id === trackId) || tracks[0];
      if (template) {
        const newBlock = createBlockFromTemplate(template, targetTrack.id, bar, targetTrack.color);
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
      macros: { param1: 50, param2: 50 }
    };
    collabManager.addTrack(newTrack);
    setActiveTrackId(newTrack.id);
  };

  const handleAddBlockFromTemplate = (template: BlockTemplate) => {
    const activeTrack = tracks.find(t => t.id === activeTrackId) || tracks[0];
    const trackBlocks = blocks.filter(b => b.trackId === activeTrack.id);
    let targetBar = 1;
    if (trackBlocks.length > 0) {
      const lastBlock = trackBlocks.reduce((max, b) => (b.startBar + b.durationBars > max ? b.startBar + b.durationBars : max), 1);
      targetBar = lastBlock;
    }

    const newBlock = createBlockFromTemplate(template, activeTrack.id, targetBar, activeTrack.color);
    collabManager.addBlock(newBlock);
    setSelectedBlockId(newBlock.id);
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
      startBar: block.startBar + block.durationBars,
      notes: block.notes.map(n => ({ ...n, id: `note-${Date.now()}-${Math.random()}` }))
    };
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

  const activeTrack = tracks.find(t => t.id === activeTrackId) || tracks[0];
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-900 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        meta={meta}
        isPlaying={isPlaying}
        peers={peers}
        midiDevices={midiDevices}
        onPlayToggle={handlePlayToggle}
        onStop={handleStop}
        onMetaChange={(update) => collabManager.updateMeta(update)}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Toolbar */}
      <Toolbar
        meta={meta}
        masterFx={masterFx}
        showKeyboard={showKeyboard}
        onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
        onAddTrack={handleAddTrack}
        onMetaChange={(update) => collabManager.updateMeta(update)}
        onFxChange={(update) => collabManager.updateMasterEffects(update)}
      />

      {pendingRemotePlay && (
        <div className="bg-indigo-950/80 border-b border-indigo-400/30 px-4 py-2 text-center text-xs text-indigo-100">
          A collaborator started playback. Click Play to enable audio and join at bar {Math.floor(pendingRemotePlay.bar)}.
        </div>
      )}

      {/* Main Studio Viewport (Block Palette + Arranger) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Smart Block Library */}
        <BlockLibrary
          activeTrack={activeTrack}
          onAddBlockFromTemplate={handleAddBlockFromTemplate}
          onPreviewTemplate={(template) => {
            if (activeTrack.instrumentType === 'drums') {
              audioEngine.auditionDrum(activeTrack.id, 'kick', 110);
              setTimeout(() => audioEngine.auditionDrum(activeTrack.id, 'snare', 110), 200);
            } else {
              audioEngine.auditionNote(activeTrack.id, 60, 100);
              setTimeout(() => audioEngine.auditionNote(activeTrack.id, 64, 100), 180);
              setTimeout(() => audioEngine.auditionNote(activeTrack.id, 67, 100), 360);
            }
          }}
        />

        {/* Center/Right Arranger Timeline */}
        <Arranger
          meta={meta}
          tracks={tracks}
          blocks={blocks}
          activeTrackId={activeTrackId}
          selectedBlockId={selectedBlockId}
          playheadPosition={playheadPosition}
          peers={peers}
          onSelectTrack={(id) => setActiveTrackId(id)}
          onSelectBlock={(id) => setSelectedBlockId(id)}
          onUpdateTrack={(id, update) => collabManager.updateTrack(id, update)}
          onRemoveTrack={(id) => collabManager.removeTrack(id)}
          onMoveBlock={handleMoveBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onRemoveBlock={handleRemoveBlock}
          onSeek={handleSeek}
        />
      </div>

      {/* Bottom Inspector (Macros + Step Sequencer / Piano Roll) */}
      <Inspector
        activeTrack={activeTrack}
        selectedBlock={selectedBlock}
        meta={meta}
        onUpdateTrackMacros={(macros) => collabManager.updateTrack(activeTrack.id, { macros })}
        onUpdateBlockNotes={(blockId, notes) => collabManager.updateBlock(blockId, { notes })}
        onCloseBlock={() => setSelectedBlockId(null)}
        onAuditionNote={(midi) => audioEngine.auditionNote(activeTrack.id, midi)}
        onAuditionDrum={(sound) => audioEngine.auditionDrum(activeTrack.id, sound)}
      />

      {/* Optional Dockable Virtual Keyboard / MPC Pads */}
      {showKeyboard && (
        <VirtualKeyboard
          activeTrack={activeTrack}
          meta={meta}
          onAuditionNote={(midi) => audioEngine.auditionNote(activeTrack.id, midi)}
          onAuditionDrum={(sound) => audioEngine.auditionDrum(activeTrack.id, sound)}
          onClose={() => setShowKeyboard(false)}
        />
      )}

      {/* Modals & Onboarding Tour */}
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

      <OnboardingTour
        isOpen={isOnboardingOpen}
        onDismiss={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}

export default App;
