import React, { useState } from 'react';
import {
  Play,
  Square,
  Users,
  Download,
  Share2,
  Sparkles,
  Radio,
  Smile,
  ShieldCheck,
  Zap,
  ChevronDown
} from 'lucide-react';
import { ProjectMeta, RootNote, ScaleMode, UserPresence } from '../types/daw';
import { VIBE_PRESETS, VibePreset } from '../music/scales';
import { MidiDeviceInfo } from '../types/midi';

interface HeaderProps {
  meta: ProjectMeta;
  isPlaying: boolean;
  peers: UserPresence[];
  midiDevices: MidiDeviceInfo[];
  onPlayToggle: () => void;
  onStop: () => void;
  onMetaChange: (update: Partial<ProjectMeta>) => void;
  onOpenMidiModal: () => void;
  onOpenShareModal: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  meta,
  isPlaying,
  peers,
  midiDevices,
  onPlayToggle,
  onStop,
  onMetaChange,
  onOpenMidiModal,
  onOpenShareModal,
  onExport,
  isExporting
}) => {
  const [showVibeMenu, setShowVibeMenu] = useState(false);
  const connectedMidi = midiDevices.find(d => d.state === 'connected');

  // Find active vibe preset or default
  const activeVibe = VIBE_PRESETS.find(
    v => v.scale === meta.scale && v.root === meta.rootNote
  ) || VIBE_PRESETS[0];

  const handleVibeSelect = (vibe: VibePreset) => {
    onMetaChange({ rootNote: vibe.root, scale: vibe.scale });
    setShowVibeMenu(false);
  };

  const speedPresets = [
    { label: 'Chill', emoji: '🐢', bpm: 88 },
    { label: 'Groove', emoji: '🚶', bpm: 116 },
    { label: 'Party', emoji: '🏃', bpm: 132 },
    { label: 'Blast', emoji: '🚀', bpm: 150 },
  ];

  return (
    <header className="h-16 bg-[#131722] border-b border-white/10 px-4 flex items-center justify-between select-none shadow-xl z-30">
      {/* Brand & Jam Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 rounded-2xl shadow-lg shadow-indigo-500/25">
          <span className="text-xl">🎵</span>
          <span className="font-extrabold text-base tracking-wide text-white drop-shadow">JamBlocks</span>
        </div>

        {/* Multiplayer Jam Friends Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-gray-200 hover:scale-105 active:scale-95 shadow-sm"
          title="Invite friends to make music together in real-time!"
        >
          <div className="flex -space-x-1.5 overflow-hidden">
            {peers.slice(0, 3).map((peer, idx) => (
              <div
                key={peer.id || idx}
                className="w-5 h-5 rounded-full border-2 border-[#131722] flex items-center justify-center text-[10px] font-bold text-black"
                style={{ backgroundColor: peer.color }}
              >
                {peer.name[0]}
              </div>
            ))}
          </div>
          <span className="text-white font-bold">{peers.length} Jammer{peers.length === 1 ? '' : 's'}</span>
          <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold">Invite</span>
        </button>
      </div>

      {/* Main Play / Vibe / Speed Controls */}
      <div className="flex items-center gap-3">
        {/* BIG Friendly Play Button */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={onPlayToggle}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/30 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Song</span>
              </>
            )}
          </button>

          <button
            onClick={onStop}
            className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Reset to Beginning"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Speed (BPM) Stepper with Emojis */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs">
          <span className="text-gray-400 font-bold text-[11px] pr-1">Speed:</span>
          {speedPresets.map((sp) => {
            const isSelected = Math.abs(meta.bpm - sp.bpm) <= 8;
            return (
              <button
                key={sp.label}
                onClick={() => onMetaChange({ bpm: sp.bpm })}
                className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title={`${sp.label} (${sp.bpm} BPM)`}
              >
                <span>{sp.emoji}</span>
                <span className="text-[11px]">{sp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Song Vibe / Mood Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowVibeMenu(!showVibeMenu)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm"
          >
            <span className="text-base">{activeVibe.emoji}</span>
            <span>Vibe: {activeVibe.name}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {showVibeMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-64 bg-[#1a202c] border border-white/15 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowVibeMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Choose Song Mood
              </div>
              {VIBE_PRESETS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVibeSelect(v)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    v.id === activeVibe.id
                      ? 'bg-amber-500 text-black font-extrabold shadow-md'
                      : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  <span className="text-xl">{v.emoji}</span>
                  <div>
                    <div className="text-xs font-bold leading-none">{v.name}</div>
                    <div className={`text-[10px] mt-0.5 ${v.id === activeVibe.id ? 'text-black/80 font-medium' : 'text-gray-400'}`}>
                      {v.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Perfect Pitch Guardrail Badge */}
        <div
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs"
          title="Guaranteed harmony: notes automatically lock into key so you can never hit a bad note!"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Perfect Pitch: ON</span>
        </div>
      </div>

      {/* Right Tools: MIDI Keyboard & Export */}
      <div className="flex items-center gap-2.5">
        {/* Hardware MIDI Pill */}
        <button
          onClick={() => {
            onOpenMidiModal();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            connectedMidi
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:scale-105'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
          }`}
          title="Click to view connected MIDI keyboard"
        >
          <span className="text-sm">{connectedMidi ? '🎹' : '🔌'}</span>
          <span>{connectedMidi ? (connectedMidi.name.split(' ')[0] || 'Keyboard') : 'Connect MIDI'}</span>
          {connectedMidi && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
        </button>

        {/* Export Song WAV */}
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Save and download your finished song as a high-quality audio file!"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Saving...' : 'Save Song'}</span>
        </button>
      </div>
    </header>
  );
};
