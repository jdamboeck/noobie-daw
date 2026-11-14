import React, { useState } from 'react';
import { Plus, Sparkles, Repeat, Keyboard, Volume2 } from 'lucide-react';
import { InstrumentType, MasterEffects, ProjectMeta } from '../types/daw';

interface ToolbarProps {
  meta: ProjectMeta;
  masterFx: MasterEffects;
  showKeyboard: boolean;
  onToggleKeyboard: () => void;
  onAddTrack: (type: InstrumentType) => void;
  onMetaChange: (update: Partial<ProjectMeta>) => void;
  onFxChange: (update: Partial<MasterEffects>) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  meta,
  masterFx,
  showKeyboard,
  onToggleKeyboard,
  onAddTrack,
  onMetaChange,
  onFxChange,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMagicMenu, setShowMagicMenu] = useState(false);

  return (
    <div className="h-12 bg-[#181c28] border-b border-white/10 px-4 flex items-center justify-between text-xs select-none">
      {/* Left: Add Instrument & Loop */}
      <div className="flex items-center gap-3">
        {/* Add Instrument Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Instrument</span>
          </button>

          {showAddMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-52 bg-[#1e2330] border border-white/15 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowAddMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Choose an Instrument
              </div>
              <button
                onClick={() => { onAddTrack('drums'); setShowAddMenu(false); }}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-500/20 text-left text-gray-200 hover:text-white transition-colors"
              >
                <span className="text-xl">🥁</span>
                <div>
                  <div className="font-bold text-xs">Beat Box (Drums)</div>
                  <div className="text-[10px] text-gray-400">Punchy dance & hip-hop beats</div>
                </div>
              </button>
              <button
                onClick={() => { onAddTrack('bass'); setShowAddMenu(false); }}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-500/20 text-left text-gray-200 hover:text-white transition-colors"
              >
                <span className="text-xl">🎸</span>
                <div>
                  <div className="font-bold text-xs">Bassline</div>
                  <div className="text-[10px] text-gray-400">Low, grooving, funky bass</div>
                </div>
              </button>
              <button
                onClick={() => { onAddTrack('keys'); setShowAddMenu(false); }}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-500/20 text-left text-gray-200 hover:text-white transition-colors"
              >
                <span className="text-xl">🎹</span>
                <div>
                  <div className="font-bold text-xs">Chords & Piano</div>
                  <div className="text-[10px] text-gray-400">Harmonious piano & lush pads</div>
                </div>
              </button>
              <button
                onClick={() => { onAddTrack('lead'); setShowAddMenu(false); }}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-cyan-500/20 text-left text-gray-200 hover:text-white transition-colors"
              >
                <span className="text-xl">🚀</span>
                <div>
                  <div className="font-bold text-xs">Lead Melody</div>
                  <div className="text-[10px] text-gray-400">Catchy tunes & synth hooks</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Loop Toggle */}
        <button
          onClick={() => onMetaChange({ loopEnabled: !meta.loopEnabled })}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold border transition-all ${
            meta.loopEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200'
          }`}
          title="Repeat your music continuously"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Loop: {meta.loopEnabled ? 'ON (Bars 1-4)' : 'OFF'}</span>
        </button>
      </div>

      {/* Right: Sound Magic & On-Screen Playable Keys */}
      <div className="flex items-center gap-2.5">
        {/* Sound Magic (Master Effects) */}
        <div className="relative">
          <button
            onClick={() => setShowMagicMenu(!showMagicMenu)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sound Magic</span>
          </button>

          {showMagicMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-[#1e2330] border border-white/15 rounded-2xl shadow-2xl z-50 p-3.5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowMagicMenu(false)}
            >
              <div className="font-extrabold text-white text-xs border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Sound Magic Controls</span>
                <span className="text-amber-400">✨</span>
              </div>

              {/* Master Volume */}
              <div>
                <div className="flex justify-between text-gray-300 font-bold text-[11px] mb-1">
                  <span>🔊 Master Volume</span>
                  <span className="font-mono text-amber-400">{masterFx.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterFx.volume}
                  onChange={(e) => onFxChange({ volume: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                />
              </div>

              {/* Space Echo */}
              <div>
                <div className="flex justify-between text-gray-300 font-bold text-[11px] mb-1">
                  <span>🌌 Big Hall Space</span>
                  <span className="font-mono text-amber-400">{masterFx.reverb}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterFx.reverb}
                  onChange={(e) => onFxChange({ reverb: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                />
              </div>

              {/* Tape Saturation */}
              <div>
                <div className="flex justify-between text-gray-300 font-bold text-[11px] mb-1">
                  <span>📻 Warm Vintage Vibe</span>
                  <span className="font-mono text-amber-400">{masterFx.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterFx.saturation}
                  onChange={(e) => onFxChange({ saturation: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Playable On-Screen Keyboard Toggle */}
        <button
          onClick={onToggleKeyboard}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold border transition-all shadow-sm ${
            showKeyboard
              ? 'bg-amber-400 text-black border-amber-300 shadow-amber-400/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
          }`}
          title="Open big on-screen piano keys & drum pads"
        >
          <Keyboard className="w-4 h-4" />
          <span>{showKeyboard ? 'Hide Toy Keys' : '🎹 Play On-Screen'}</span>
        </button>
      </div>
    </div>
  );
};
