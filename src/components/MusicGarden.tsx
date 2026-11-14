import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FilePlus2,
  Headphones,
  Keyboard,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { BlockTemplate, SMART_BLOCKS_TEMPLATES } from '../music/blocksLibrary';
import { SCALE_INTERVALS, VIBE_PRESETS, VIBE_PROGRESSIONS } from '../music/scales';
import { getChordForDegree } from '../music/harmonic';
import { SOUND_STYLE_PRESETS } from '../music/soundStyles';
import { MasterEffects, MidiBlock, NoteEvent, ProjectMeta, SoundStyle, Track, UserPresence } from '../types/daw';
import { MidiDeviceInfo } from '../types/midi';
import { Inspector } from './Inspector';
import { VirtualKeyboard } from './VirtualKeyboard';
import './MusicGarden.css';

interface MusicGardenProps {
  meta: ProjectMeta;
  tracks: Track[];
  blocks: MidiBlock[];
  masterFx: MasterEffects;
  activeTrackId: string;
  selectedBlock: MidiBlock | null;
  playheadPosition: number;
  isPlaying: boolean;
  peers: UserPresence[];
  midiDevices: MidiDeviceInfo[];
  pendingRemotePlay: boolean;
  isExporting: boolean;
  showKeyboard: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  onStartFresh: () => void;
  onMetaChange: (update: Partial<ProjectMeta>) => void;
  onSetSoundStyle: (style: SoundStyle) => void;
  onFxChange: (update: Partial<MasterEffects>) => void;
  onSelectTrack: (id: string) => void;
  onSelectBlock: (id: string | null) => void;
  onSeek: (bar: number) => void;
  onAddTrack: (type: Track['instrumentType']) => void;
  onPlantSeed: (template: BlockTemplate) => void;
  onPlantBlank: (type: Track['instrumentType']) => void;
  onPreviewSeed: (template: BlockTemplate) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, trackId: string, startBar: number) => void;
  onToggleMute: (track: Track) => void;
  onRemoveTrack: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onOpenMidi: () => void;
  onOpenShare: () => void;
  onExport: () => void;
  onToggleKeyboard: () => void;
  onUpdateTrackMacros: (macros: Partial<Track['macros']>) => void;
  onUpdateTrackStyle: (style: SoundStyle | null) => void;
  onUpdateBlockNotes: (blockId: string, notes: NoteEvent[]) => void;
  onAuditionNote: (midi: number) => void;
  onAuditionDrum: (sound: NonNullable<NoteEvent['drumSound']>) => void;
}

const SOUNDS: { type: Track['instrumentType']; label: string; emoji: string; color: string; name: string }[] = [
  { type: 'drums', label: 'Beats', emoji: '🥁', color: 'coral', name: 'Beat blooms' },
  { type: 'bass', label: 'Bouncy', emoji: '🪇', color: 'mint', name: 'Bounce roots' },
  { type: 'keys', label: 'Dreamy', emoji: '☁️', color: 'sunshine', name: 'Cloud garden' },
  { type: 'lead', label: 'Twinkles', emoji: '✨', color: 'lilac', name: 'Star trail' }
];

const SPEEDS = [
  { label: 'Slow', emoji: '🐢', bpm: 88 },
  { label: 'Bouncy', emoji: '🐇', bpm: 116 },
  { label: 'Zoomy', emoji: '🚀', bpm: 132 },
  { label: 'Wild', emoji: '🦋', bpm: 150 }
];

const soundFor = (track: Track) => SOUNDS.find(sound => sound.type === track.instrumentType) || SOUNDS[0];

const friendlyTrackName = (track: Track, sameTypeIndex: number) => {
  const name = soundFor(track).name;
  return sameTypeIndex ? `${name} ${sameTypeIndex + 1}` : name;
};

export const MusicGarden: React.FC<MusicGardenProps> = (props) => {
  const [seedType, setSeedType] = useState<Track['instrumentType']>('drums');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddSound, setShowAddSound] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showFreshConfirm, setShowFreshConfirm] = useState(false);
  const [isDark, setIsDark] = useState(() => window.localStorage.getItem('sound-garden-theme') === 'dark');

  const activeTrack = props.tracks.find(track => track.id === props.activeTrackId) || props.tracks[0];
  const connectedMidi = props.midiDevices.filter(device => device.state === 'connected');
  const selectedVibe = VIBE_PRESETS.find(vibe => vibe.root === props.meta.rootNote && vibe.scale === props.meta.scale) || VIBE_PRESETS[0];
  const progressionTemplate = VIBE_PROGRESSIONS[selectedVibe.id];
  const chordProgression = Array.from({ length: props.meta.totalBars }, (_, bar) =>
    props.meta.chordProgression?.[bar] ?? progressionTemplate[bar % progressionTemplate.length]
  );
  const seedTemplates = useMemo(
    () => SMART_BLOCKS_TEMPLATES.filter(template => template.instrumentType === seedType),
    [seedType]
  );

  useEffect(() => {
    window.localStorage.setItem('sound-garden-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const selectVibe = (vibeId: string) => {
    const vibe = VIBE_PRESETS.find(item => item.id === vibeId);
    if (vibe) {
      const progression = VIBE_PROGRESSIONS[vibe.id];
      props.onMetaChange({
        rootNote: vibe.root,
        scale: vibe.scale,
        chordProgression: Array.from({ length: props.meta.totalBars }, (_, bar) => progression[bar % progression.length])
      });
    }
  };

  return (
    <main className={`garden-shell ${isDark ? 'is-dark' : ''}`}>
      <header className="garden-topbar">
        <a className="garden-brand" href="#top" aria-label="Sound Garden home">
          <span className="garden-brand-mark" aria-hidden="true">🌱</span>
          <span><strong>sound garden</strong><small>make a little noise</small></span>
        </a>
        <div className="garden-top-actions">
          <button className="garden-soft-button" onClick={props.onOpenShare} aria-label="Jam with friends" title="Jam with friends">
            <Share2 size={19} aria-hidden="true" />
            <span>Jam with friends{props.peers.length > 0 ? ` · ${props.peers.length}` : ''}</span>
          </button>
          <button className={`garden-soft-button ${connectedMidi.length ? 'is-connected' : ''}`} onClick={props.onOpenMidi} aria-label={connectedMidi.length ? 'Keyboard ready; manage music keyboard' : 'Plug in a music keyboard'} title={connectedMidi.length ? 'Manage music keyboard' : 'Plug in a music keyboard'}>
            <Radio size={19} aria-hidden="true" />
            <span>{connectedMidi.length ? 'Keyboard ready' : 'Plug in a keyboard'}</span>
            {connectedMidi.length > 0 && <span className="garden-live-dot" aria-label="Connected" />}
          </button>
          <button className="garden-soft-button garden-theme-toggle" onClick={() => setIsDark(value => !value)} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            <span>{isDark ? 'Light garden' : 'Dark garden'}</span>
          </button>
        </div>
      </header>

      <section className="garden-welcome" id="top" aria-labelledby="garden-title">
        <div className="garden-welcome-copy">
          <p className="garden-eyebrow"><Sparkles size={16} aria-hidden="true" /> A tiny musical world, made by you</p>
          <h1 id="garden-title">Plant a sound.<br /><span>Grow a song.</span></h1>
          <p className="garden-intro">Pick a little sound seed, plant it in your garden, and watch your song come alive.</p>
          <p className="garden-song-map"><span>CHORD TRAIL</span> {chordProgression.slice(0, 5).map(degree => getChordForDegree(degree, props.meta.rootNote, props.meta.scale).label).join(' → ')}</p>
          <div className="garden-vibe-line">
            <span aria-hidden="true">{selectedVibe.emoji}</span>
            <span>Your song feels <strong>{selectedVibe.name.toLowerCase()}</strong></span>
            <button className="garden-text-button" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings}>
              Change mood <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className={`garden-world ${props.isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
          <span className="garden-sun">☀️</span>
          <span className="garden-cloud cloud-one">☁️</span>
          <span className="garden-cloud cloud-two">☁️</span>
          <span className="garden-hill hill-back" />
          <span className="garden-hill hill-front" />
          <span className="garden-flower flower-one">🌼</span>
          <span className="garden-flower flower-two">🌷</span>
          <span className="garden-flower flower-three">🌻</span>
          <span className="garden-butterfly">🦋</span>
        </div>
      </section>

      {showSettings && (
        <section className="garden-settings" aria-label="Song mood and sound settings">
          <div className="garden-settings-heading">
            <div><span className="garden-kicker">MAKE IT YOURS</span><h2>Choose your song’s mood</h2></div>
            <button className="garden-icon-button" onClick={() => setShowSettings(false)} aria-label="Close sound settings"><X size={19} /></button>
          </div>
          <div className="garden-vibe-options" role="group" aria-label="Song mood">
            {VIBE_PRESETS.map(vibe => (
              <button key={vibe.id} className={`garden-vibe-option ${selectedVibe.id === vibe.id ? 'is-selected' : ''}`} onClick={() => selectVibe(vibe.id)} aria-pressed={selectedVibe.id === vibe.id}>
                <span>{vibe.emoji}</span><span>{vibe.name}</span>{selectedVibe.id === vibe.id && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="garden-style-picker">
            <div className="garden-style-heading"><span className="garden-kicker">BAND SOUND</span><span>Pick a sound world for every instrument</span></div>
            <div className="garden-vibe-options" role="group" aria-label="Style for all instruments">
              {SOUND_STYLE_PRESETS.map(style => (
                <button key={style.id} className={`garden-vibe-option ${props.meta.soundStyle === style.id ? 'is-selected' : ''}`} onClick={() => props.onSetSoundStyle(style.id)} aria-label={`${style.name}: ${style.description}`} aria-pressed={(props.meta.soundStyle ?? 'pop') === style.id}>
                  <span>{style.emoji}</span><span>{style.name}</span>{(props.meta.soundStyle ?? 'pop') === style.id && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
            <p className="garden-style-note">Changing the band sound resets individual instrument choices to follow along.</p>
          </div>
          <div className="garden-settings-bottom">
            <div><span className="garden-kicker">HOW FAST?</span><div className="garden-speed-options">
              {SPEEDS.map(speed => <button key={speed.bpm} onClick={() => props.onMetaChange({ bpm: speed.bpm })} className={Math.abs(props.meta.bpm - speed.bpm) < 5 ? 'is-selected' : ''} aria-pressed={Math.abs(props.meta.bpm - speed.bpm) < 5}>{speed.emoji} {speed.label}</button>)}
            </div></div>
            <div className="garden-fx-options">
              <label><span><Volume2 size={15} aria-hidden="true" /> Song volume</span><input type="range" min="0" max="100" value={props.masterFx.volume} onChange={event => props.onFxChange({ volume: Number(event.target.value) })} /><output>{props.masterFx.volume}%</output></label>
              <label><span>☁️ Dreamy space</span><input type="range" min="0" max="100" value={props.masterFx.reverb} onChange={event => props.onFxChange({ reverb: Number(event.target.value) })} /><output>{props.masterFx.reverb}%</output></label>
              <label><span>🌀 Echo bounce</span><input type="range" min="0" max="100" value={props.masterFx.delay} onChange={event => props.onFxChange({ delay: Number(event.target.value) })} /><output>{props.masterFx.delay}%</output></label>
              <label><span>☀️ Brightness</span><input type="range" min="0" max="100" value={props.masterFx.filterCutoff} onChange={event => props.onFxChange({ filterCutoff: Number(event.target.value) })} /><output>{props.masterFx.filterCutoff}%</output></label>
              <label><span>📻 Warmth</span><input type="range" min="0" max="100" value={props.masterFx.saturation} onChange={event => props.onFxChange({ saturation: Number(event.target.value) })} /><output>{props.masterFx.saturation}%</output></label>
              <label><span>🤝 Band glue</span><input type="range" min="0" max="100" value={props.masterFx.glue} onChange={event => props.onFxChange({ glue: Number(event.target.value) })} /><output>{props.masterFx.glue}%</output></label>
            </div>
          </div>
        </section>
      )}

      <section className={`garden-player ${props.isPlaying ? 'is-playing' : ''}`} aria-label="Song player">
        <button className={`garden-play-button ${props.isPlaying ? 'is-playing' : ''}`} onClick={props.onPlayToggle} aria-label={props.isPlaying ? 'Pause your song' : 'Play your song'}>
          {props.isPlaying ? <Pause fill="currentColor" size={27} /> : <Play fill="currentColor" size={27} />}
        </button>
        <div className="garden-player-copy"><strong>{props.isPlaying ? 'Your garden is singing!' : 'Give it a listen'}</strong><span>{props.meta.bpm} happy beats a minute · loops {props.meta.loopEnabled ? 'on' : 'off'}</span></div>
        <div className="garden-player-wave" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ '--wave-index': index } as React.CSSProperties} />)}</div>
        <button className={`garden-loop-button ${props.meta.loopEnabled ? 'is-on' : ''}`} onClick={() => props.onMetaChange({ loopEnabled: !props.meta.loopEnabled })} aria-pressed={props.meta.loopEnabled}>
          <span aria-hidden="true">🔁</span><span>Keep growing</span>
        </button>
        <button className="garden-icon-button" onClick={props.onStop} aria-label="Start the song from the beginning"><RotateCcw size={19} /></button>
      </section>

      {props.pendingRemotePlay && <div className="garden-friend-note" role="status">A friend started the song! Press Play to join in. <button onClick={props.onPlayToggle}>Join them</button></div>}

      <section className="garden-workbench" aria-label="Make your song">
        <div className="garden-section-heading">
          <div><span className="garden-kicker">YOUR MUSICAL BACKYARD</span><h2>Sound garden <span aria-hidden="true">🌿</span></h2></div>
          <div className="garden-heading-actions">
            <button className="garden-outline-button garden-new-button" onClick={() => setShowFreshConfirm(true)}><FilePlus2 size={18} /> Start fresh</button>
            <button className="garden-outline-button" onClick={() => setShowAddSound(!showAddSound)} aria-expanded={showAddSound}><Plus size={18} /> Add a sound</button>
            <button className="garden-primary-button" onClick={props.onExport} disabled={props.isExporting}><Download size={18} /> {props.isExporting ? 'Saving…' : 'Save my song'}</button>
          </div>
        </div>

        {showAddSound && <div className="garden-add-sound" role="group" aria-label="Choose a sound to add">
          <span>What should grow?</span>{SOUNDS.map(sound => <button key={sound.type} onClick={() => { props.onAddTrack(sound.type); setShowAddSound(false); }}><span>{sound.emoji}</span>{sound.name}</button>)}
          <button className="garden-close-add" aria-label="Close add sound menu" onClick={() => setShowAddSound(false)}><X size={18} /></button>
        </div>}

        <div className="garden-map-scroll" role="region" aria-label="Your song arrangement; scroll sideways to see more" tabIndex={0}>
          <div className="garden-map" style={{ minWidth: `${Math.max(760, props.meta.totalBars * 62)}px` }}>
            <div className="garden-map-labels" aria-hidden="true"><span>Sound beds</span><div className="garden-ruler" style={{ '--bar-count': props.meta.totalBars } as React.CSSProperties}>{Array.from({ length: props.meta.totalBars }, (_, index) => <span key={index}>{index === 0 ? 'Start' : index === props.meta.totalBars - 1 ? 'Finish' : index === 4 ? 'A little later' : index === 8 ? 'Halfway' : index === 12 ? 'Nearly there' : ''}</span>)}</div></div>
            <div className="garden-chord-track">
              <div className="garden-chord-track-label"><span aria-hidden="true">🎼</span><span><strong>Chord garden</strong><small>Choose a chord each bar</small></span></div>
              <div className="garden-chord-cells" style={{ '--bar-count': props.meta.totalBars } as React.CSSProperties}>
                {chordProgression.map((degree, bar) => {
                  const chord = getChordForDegree(degree, props.meta.rootNote, props.meta.scale);
                  return <label className={Math.floor(props.playheadPosition) === bar + 1 ? 'is-current' : ''} key={bar}>
                    <span className="sr-only">Chord for bar {bar + 1}</span>
                    <select aria-label={`Chord for bar ${bar + 1}`} value={degree} onChange={event => {
                      const nextProgression = [...chordProgression];
                      nextProgression[bar] = Number(event.target.value);
                      props.onMetaChange({ chordProgression: nextProgression });
                    }}>
                      {Array.from({ length: SCALE_INTERVALS[props.meta.scale].length }, (_, option) => {
                        const optionChord = getChordForDegree(option, props.meta.rootNote, props.meta.scale);
                        return <option key={option} value={option}>{optionChord.label}</option>;
                      })}
                    </select>
                    <small>{bar + 1}</small>
                    <span className="garden-chord-readout" aria-hidden="true">{chord.label}</span>
                  </label>;
                })}
              </div>
            </div>
            {props.tracks.map(track => {
              const sound = soundFor(track);
              const sameTypeTracks = props.tracks.filter(item => item.instrumentType === track.instrumentType);
              const sameTypeIndex = sameTypeTracks.findIndex(item => item.id === track.id);
              const trackBlocks = props.blocks.filter(block => block.trackId === track.id);
              return <div className={`garden-bed ${sound.color} ${props.activeTrackId === track.id ? 'is-active' : ''}`} key={track.id}>
                <button className="garden-bed-name" onClick={() => props.onSelectTrack(track.id)} aria-pressed={props.activeTrackId === track.id}>
                  <span className="garden-bed-emoji">{sound.emoji}</span><span><strong>{friendlyTrackName(track, sameTypeIndex)}</strong><small>{trackBlocks.length ? `${trackBlocks.length} little ${trackBlocks.length === 1 ? 'sound' : 'sounds'} growing` : 'Ready for a seed'}</small></span>
                </button>
                <div className="garden-bed-controls">
                  <label className="garden-bed-volume"><span className="sr-only">{friendlyTrackName(track, sameTypeIndex)} volume</span><input type="range" min="0" max="1" step="0.05" value={track.volume} onChange={event => props.onVolumeChange(track.id, Number(event.target.value))} /></label>
                  <button className={`garden-mute-button ${track.muted ? 'is-muted' : ''}`} onClick={() => props.onToggleMute(track)} aria-label={`${track.muted ? 'Wake up' : 'Quiet'} ${friendlyTrackName(track, sameTypeIndex)}`} aria-pressed={track.muted}>{track.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
                  {props.tracks.length > 1 && <button className="garden-mute-button" onClick={() => props.onRemoveTrack(track.id)} aria-label={`Remove ${friendlyTrackName(track, sameTypeIndex)}`}><X size={16} /></button>}
                </div>
                <div className="garden-bed-vine" style={{ '--bar-count': props.meta.totalBars } as React.CSSProperties} onClick={event => {
                  if ((event.target as HTMLElement).closest('button')) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const bar = Math.min(props.meta.totalBars, Math.max(1, Math.floor((event.clientX - rect.left) / rect.width * props.meta.totalBars) + 1));
                  props.onSeek(bar);
                }}>
                  {Array.from({ length: props.meta.totalBars }, (_, index) => <button className="garden-bar-hit-area" key={index} style={{ left: `${(index / props.meta.totalBars) * 100}%` }} onClick={event => { event.stopPropagation(); props.onSeek(index + 1); }} aria-label={`Jump to part ${index + 1}`} />)}
                  <span className="garden-playhead" style={{ left: `${((props.playheadPosition - 1) / props.meta.totalBars) * 100}%` }} />
                  {trackBlocks.map(block => <div className={`garden-planted-seed ${props.selectedBlock?.id === block.id ? 'is-selected' : ''}`} key={block.id} style={{ left: `${((block.startBar - 1) / props.meta.totalBars) * 100}%`, width: `${Math.max(6, (block.durationBars / props.meta.totalBars) * 100)}%` }}>
                    <button className="garden-seed-chip" onClick={() => { props.onSelectTrack(track.id); props.onSelectBlock(block.id); }} aria-label={`Select ${block.emoji || sound.emoji} ${block.name}`}><span>{block.emoji || sound.emoji}</span><strong>{block.name}</strong></button>
                    <div className="garden-seed-tools">
                      <button onClick={() => { props.onSelectTrack(track.id); props.onSelectBlock(block.id); setShowEditor(true); }} aria-label={`Edit notes in ${block.name}`}><Pencil size={13} /></button>
                      <button onClick={() => props.onMoveBlock(block.id, track.id, Math.max(1, block.startBar - 1))} aria-label={`Move ${block.name} earlier`}><ArrowLeft size={13} /></button>
                      <button onClick={() => props.onMoveBlock(block.id, track.id, Math.min(props.meta.totalBars - block.durationBars + 1, block.startBar + 1))} aria-label={`Move ${block.name} later`}><ArrowRight size={13} /></button>
                      <button onClick={() => props.onRemoveBlock(block.id)} aria-label={`Remove ${block.name}`}><X size={13} /></button>
                    </div>
                  </div>)}
                </div>
              </div>;
            })}
          </div>
        </div>

        <div className="garden-seed-shelf">
          <div className="garden-seed-heading"><div><span className="garden-kicker">PICK A SEED</span><h3>Choose a sound to plant</h3></div><p>Melodies and chords use notes from your chosen scale.</p></div>
          <div className="garden-seed-filters" role="group" aria-label="Sound seed types">
            {SOUNDS.map(sound => <button key={sound.type} className={`garden-filter ${sound.color} ${seedType === sound.type ? 'is-selected' : ''}`} onClick={() => setSeedType(sound.type)} aria-pressed={seedType === sound.type}><span>{sound.emoji}</span>{sound.label}</button>)}
          </div>
          <button className="garden-blank-button" onClick={() => { props.onPlantBlank(seedType); setShowEditor(true); }}><span className="garden-blank-emoji" aria-hidden="true">🪴</span><span className="garden-blank-copy"><strong>Start with a blank pattern</strong><small>Make every note yourself</small></span><Plus size={19} aria-hidden="true" /></button>
          <div className="garden-seed-cards">
            {seedTemplates.map(template => <article className={`garden-seed-card ${soundFor({ instrumentType: template.instrumentType } as Track).color}`} key={template.name}>
              <div className="garden-seed-card-emoji" aria-hidden="true">{template.emoji}</div>
              <div className="garden-seed-card-copy"><h4>{template.name}</h4><p>{template.description}</p></div>
              <div className="garden-seed-card-actions"><button className="garden-listen-button" onClick={() => props.onPreviewSeed(template)} aria-label={`Listen to ${template.name}`}><Headphones size={17} /><span>Listen</span></button><button className="garden-plant-button" onClick={() => props.onPlantSeed(template)}><Plus size={17} /><span>Plant it!</span></button></div>
            </article>)}
          </div>
        </div>
      </section>

      <footer className="garden-footer">
        <span><Sparkles size={16} aria-hidden="true" /> There are no wrong notes in this garden.</span>
        <div><button onClick={() => setShowEditor(true)} disabled={!props.selectedBlock}><SlidersHorizontal size={16} /> Tinker with a sound</button><button onClick={props.onToggleKeyboard} aria-pressed={props.showKeyboard}><Keyboard size={16} /> {props.showKeyboard ? 'Hide play keys' : 'Play your own notes'}</button></div>
      </footer>

      {props.showKeyboard && activeTrack && <div className="garden-keyboard-dock"><div className="garden-keyboard-caption"><span>{activeTrack.emoji} You’re playing {friendlyTrackName(activeTrack, 0)}</span><button onClick={props.onToggleKeyboard} aria-label="Close play keys"><X size={18} /></button></div><VirtualKeyboard activeTrack={activeTrack} meta={props.meta} onAuditionNote={props.onAuditionNote} onAuditionDrum={props.onAuditionDrum} onClose={props.onToggleKeyboard} /></div>}

      {showFreshConfirm && <div className="garden-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowFreshConfirm(false); }}><section className="garden-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="garden-confirm-title" aria-describedby="garden-confirm-copy"><span className="garden-confirm-emoji" aria-hidden="true">🌱</span><h2 id="garden-confirm-title">Make room for a new song?</h2><p id="garden-confirm-copy">This clears the blocks from this shared timeline. Your sounds, tempo, and settings will stay.</p><div><button className="garden-outline-button" onClick={() => setShowFreshConfirm(false)}>Keep this song</button><button className="garden-primary-button" onClick={() => { props.onStartFresh(); setShowFreshConfirm(false); }}>Start with an empty timeline</button></div></section></div>}

      {showEditor && activeTrack && <div className="garden-modal-backdrop garden-editor-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowEditor(false); }}><section className="garden-editor-modal" role="dialog" aria-modal="true" aria-labelledby="garden-editor-title"><div className="garden-editor-heading"><div><span className="garden-kicker">TINKER TIME</span><h2 id="garden-editor-title">Make this sound your own</h2></div><button className="garden-icon-button" onClick={() => setShowEditor(false)} aria-label="Close sound editor"><X size={20} /></button></div><Inspector activeTrack={activeTrack} selectedBlock={props.selectedBlock} meta={props.meta} onUpdateTrackMacros={props.onUpdateTrackMacros} onUpdateTrackStyle={props.onUpdateTrackStyle} onUpdateBlockNotes={props.onUpdateBlockNotes} onCloseBlock={() => setShowEditor(false)} onAuditionNote={props.onAuditionNote} onAuditionDrum={props.onAuditionDrum} /></section></div>}
    </main>
  );
};
