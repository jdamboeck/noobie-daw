import React, { useState, useEffect } from 'react';
import { Keyboard, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { DrumSound, InstrumentType, ProjectMeta, Track } from '../types/daw';
import { isNoteInScale, midiToNoteName } from '../music/harmonic';

interface VirtualKeyboardProps {
  activeTrack: Track;
  meta: ProjectMeta;
  onAuditionNote: (midi: number) => void;
  onAuditionDrum: (drum: DrumSound) => void;
  onClose: () => void;
}

const DRUM_PADS: { sound: DrumSound; key: string; label: string; emoji: string; color: string }[] = [
  { sound: 'kick', key: '1 / A', label: 'Boom Kick', emoji: '💥', color: 'from-rose-500 to-rose-700' },
  { sound: 'snare', key: '2 / S', label: 'Snappy Snare', emoji: '🥁', color: 'from-amber-500 to-amber-700' },
  { sound: 'clap', key: '3 / D', label: 'Hand Clap', emoji: '👏', color: 'from-orange-500 to-orange-700' },
  { sound: 'hat_closed', key: '4 / F', label: 'Ting Hat', emoji: '🔔', color: 'from-emerald-500 to-emerald-700' },
  { sound: 'hat_open', key: '5 / G', label: 'Splash Hat', emoji: '🌊', color: 'from-cyan-500 to-cyan-700' },
  { sound: 'perc', key: '6 / H', label: 'Coconut Perc', emoji: '🥥', color: 'from-purple-500 to-purple-700' },
];

const KEYBOARD_MAP: Record<string, number> = {
  'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6, 'g': 7,
  'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13, 'l': 14, 'p': 15, ';': 16,
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  activeTrack,
  meta,
  onAuditionNote,
  onAuditionDrum,
  onClose
}) => {
  const [octave, setOctave] = useState<number>(4);
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set());

  // Listen to computer keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();

      if (activeTrack.instrumentType === 'drums') {
        if (key === 'a' || key === '1') onAuditionDrum('kick');
        else if (key === 's' || key === '2') onAuditionDrum('snare');
        else if (key === 'd' || key === '3') onAuditionDrum('clap');
        else if (key === 'f' || key === '4') onAuditionDrum('hat_closed');
        else if (key === 'g' || key === '5') onAuditionDrum('hat_open');
        else if (key === 'h' || key === '6') onAuditionDrum('perc');
        return;
      }

      if (KEYBOARD_MAP[key] !== undefined) {
        const offset = KEYBOARD_MAP[key];
        const midi = (octave + 1) * 12 + offset;
        setActiveMidiKeys(prev => new Set(prev).add(midi));
        onAuditionNote(midi);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key] !== undefined) {
        const offset = KEYBOARD_MAP[key];
        const midi = (octave + 1) * 12 + offset;
        setActiveMidiKeys(prev => {
          const next = new Set(prev);
          next.delete(midi);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octave, activeTrack, onAuditionNote, onAuditionDrum]);

  const baseMidi = (octave + 1) * 12;
  const pianoKeys = Array.from({ length: 25 }, (_, i) => baseMidi + i);

  return (
    <div className="h-48 bg-[#181d2a] border-t border-white/10 flex flex-col select-none shadow-2xl p-3 z-40">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">{activeTrack.instrumentType === 'drums' ? '🥁' : '🎹'}</span>
          <span className="font-black text-white text-sm">
            Playable {activeTrack.instrumentType === 'drums' ? 'Drum Pads' : 'Toy Keyboard'}
          </span>
          <span className="text-gray-400 font-bold">({activeTrack.name})</span>
        </div>

        {activeTrack.instrumentType !== 'drums' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 rounded-xl border border-white/10 px-2 py-1 text-xs">
              <button
                onClick={() => setOctave(Math.max(1, octave - 1))}
                className="p-1 hover:text-white text-gray-400"
                title="Lower Pitch"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-black text-amber-300">Octave {octave}</span>
              <button
                onClick={() => setOctave(Math.min(7, octave + 1))}
                className="p-1 hover:text-white text-gray-400"
                title="Higher Pitch"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gold Dots = Perfect Pitch</span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
          title="Close Playable Keys"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Pads or Piano */}
      <div className="flex-1 flex items-center justify-center pt-2">
        {activeTrack.instrumentType === 'drums' ? (
          /* Bouncy Drum Pads */
          <div className="grid grid-cols-6 gap-2.5 w-full max-w-2xl h-full">
            {DRUM_PADS.map((pad) => (
              <button
                key={pad.sound}
                onClick={() => onAuditionDrum(pad.sound)}
                className={`bg-gradient-to-br ${pad.color} text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all border border-white/20 hover:brightness-110 hover:scale-105`}
              >
                <span className="text-2xl drop-shadow">{pad.emoji}</span>
                <span className="text-xs font-black">{pad.label}</span>
                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  {pad.key}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Playable Piano Keys */
          <div className="flex h-full relative justify-center">
            {pianoKeys.map((midi) => {
              const semitone = midi % 12;
              const isBlack = [1, 3, 6, 8, 10].includes(semitone);
              const isInScale = isNoteInScale(midi, meta.rootNote, meta.scale);
              const isPressed = activeMidiKeys.has(midi);

              if (isBlack) {
                return (
                  <button
                    key={midi}
                    onMouseDown={() => onAuditionNote(midi)}
                    className={`w-7 h-20 bg-[#12151e] text-white rounded-b-xl -mx-3.5 z-20 shadow-xl flex flex-col justify-end items-center pb-1.5 transition-all border border-white/15 active:scale-95 ${
                      isPressed ? 'bg-amber-400 border-amber-300' : 'hover:bg-[#1f2433]'
                    }`}
                  >
                    {isInScale && (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mb-1 shadow-sm shadow-amber-400" />
                    )}
                    <span className="text-[8px] font-mono text-gray-400 font-bold">
                      {midiToNoteName(midi)}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={midi}
                  onMouseDown={() => onAuditionNote(midi)}
                  className={`w-10 h-full rounded-b-2xl flex flex-col justify-end items-center pb-2 z-10 border transition-all active:scale-95 shadow-md ${
                    isPressed
                      ? 'bg-amber-300 border-amber-400 shadow-inner'
                      : isInScale
                        ? 'bg-white border-gray-200 text-gray-800 hover:bg-amber-50'
                        : 'bg-gray-300 border-gray-400 text-gray-500 opacity-60'
                  }`}
                >
                  {isInScale && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mb-1.5 shadow" />
                  )}
                  <span className="text-[10px] font-mono font-black">
                    {midiToNoteName(midi)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
