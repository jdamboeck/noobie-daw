import React from 'react';
import { Sliders, Sparkles, Grid, X, Music } from 'lucide-react';
import { DrumSound, MidiBlock, NoteEvent, ProjectMeta, Track } from '../types/daw';
import { degreeToMidi, midiToNoteName } from '../music/harmonic';

interface InspectorProps {
  activeTrack: Track;
  selectedBlock: MidiBlock | null;
  meta: ProjectMeta;
  onUpdateTrackMacros: (macros: Partial<Track['macros']>) => void;
  onUpdateBlockNotes: (blockId: string, notes: NoteEvent[]) => void;
  onCloseBlock: () => void;
  onAuditionNote: (midi: number) => void;
  onAuditionDrum: (drum: DrumSound) => void;
}

const DRUM_PADS: { sound: DrumSound; label: string; emoji: string }[] = [
  { sound: 'kick', label: 'Boom (Kick)', emoji: '💥' },
  { sound: 'snare', label: 'Crack (Snare)', emoji: '🥁' },
  { sound: 'clap', label: 'Clap', emoji: '👏' },
  { sound: 'hat_closed', label: 'Ting (Hat)', emoji: '🔔' },
  { sound: 'hat_open', label: 'Splash (Open)', emoji: '🌊' },
  { sound: 'perc', label: 'Coconut (Perc)', emoji: '🥥' },
];

export const Inspector: React.FC<InspectorProps> = ({
  activeTrack,
  selectedBlock,
  meta,
  onUpdateTrackMacros,
  onUpdateBlockNotes,
  onCloseBlock,
  onAuditionNote,
  onAuditionDrum
}) => {
  const getPlayfulMacroLabels = (type: Track['instrumentType']) => {
    switch (type) {
      case 'drums': return { p1: '💥 Punch (Snap!)', p2: '🏰 Room (Big Hall)' };
      case 'bass': return { p1: '🐯 Growl (Tiger Drive)', p2: '💡 Brightness' };
      case 'keys': return { p1: '✨ Sparkle', p2: '☁️ Dream Cloud' };
      case 'lead': return { p1: '🚀 Space Echo', p2: '🏂 Slide Speed' };
    }
  };

  const labels = getPlayfulMacroLabels(activeTrack.instrumentType);

  const handleToggleDrumStep = (sound: DrumSound, step: number) => {
    if (!selectedBlock) return;
    const existingIndex = selectedBlock.notes.findIndex(
      n => n.drumSound === sound && n.step === step
    );

    let updatedNotes: NoteEvent[];
    if (existingIndex !== -1) {
      updatedNotes = selectedBlock.notes.filter((_, idx) => idx !== existingIndex);
    } else {
      updatedNotes = [
        ...selectedBlock.notes,
        {
          id: `drum-${Date.now()}-${step}`,
          drumSound: sound,
          step,
          durationSteps: 2,
          velocity: 100
        }
      ];
      onAuditionDrum(sound);
    }
    onUpdateBlockNotes(selectedBlock.id, updatedNotes);
  };

  const handleToggleMelodicStep = (degree: number, step: number) => {
    if (!selectedBlock) return;
    const existingIndex = selectedBlock.notes.findIndex(
      n => n.degree === degree && n.step === step
    );

    let updatedNotes: NoteEvent[];
    if (existingIndex !== -1) {
      updatedNotes = selectedBlock.notes.filter((_, idx) => idx !== existingIndex);
    } else {
      updatedNotes = [
        ...selectedBlock.notes,
        {
          id: `note-${Date.now()}-${step}`,
          degree,
          octaveOffset: 0,
          step,
          durationSteps: 2,
          velocity: 100
        }
      ];
      const baseOctave = activeTrack.instrumentType === 'bass' ? 2 : (activeTrack.instrumentType === 'lead' ? 5 : 4);
      const midi = degreeToMidi(degree, 0, baseOctave, meta.rootNote, meta.scale);
      onAuditionNote(midi);
    }
    onUpdateBlockNotes(selectedBlock.id, updatedNotes);
  };

  const totalSteps = selectedBlock ? selectedBlock.durationBars * 16 : 32;
  const degreesToRender = [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="h-56 bg-[#161a24] border-t border-white/10 flex text-xs select-none shadow-2xl">
      {/* Left: Playful Sound Knobs */}
      <div className="w-64 p-3.5 bg-[#131720] border-r border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3 font-black text-white text-xs">
            <span className="text-base">🎛️</span>
            <span>{activeTrack.name} Sound Shapers</span>
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Macro 1 */}
            <div>
              <div className="flex justify-between text-gray-300 font-bold text-[11px] mb-1">
                <span>{labels.p1}</span>
                <span className="font-mono text-amber-400">{activeTrack.macros.param1}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeTrack.macros.param1}
                onChange={(e) => onUpdateTrackMacros({
                  param1: parseInt(e.target.value)
                })}
                className="w-full accent-indigo-500 h-2 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

            {/* Macro 2 */}
            <div>
              <div className="flex justify-between text-gray-300 font-bold text-[11px] mb-1">
                <span>{labels.p2}</span>
                <span className="font-mono text-amber-400">{activeTrack.macros.param2}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeTrack.macros.param2}
                onChange={(e) => onUpdateTrackMacros({
                  param2: parseInt(e.target.value)
                })}
                className="w-full accent-indigo-500 h-2 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl flex items-center justify-between font-bold">
          <span>🛡️ Key Lock:</span>
          <span>{meta.rootNote} {meta.scale}</span>
        </div>
      </div>

      {/* Right: Step Sequencer & Note Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0e121a]">
        {selectedBlock ? (
          <>
            {/* Header */}
            <div className="h-9 px-4 border-b border-white/10 bg-[#161a26] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedBlock.emoji || '🧱'}</span>
                <span className="font-black text-white text-xs">{selectedBlock.name}</span>
                <span className="text-[11px] text-gray-400 font-bold">
                  ({selectedBlock.durationBars} Bars • Tap any square to change notes!)
                </span>
              </div>

              <button
                onClick={onCloseBlock}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Close Editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-3">
              {activeTrack.instrumentType === 'drums' ? (
                /* Drum Pad Step Sequencer */
                <div className="flex flex-col gap-1.5 min-w-max">
                  {DRUM_PADS.map((pad) => (
                    <div key={pad.sound} className="flex items-center gap-2">
                      <button
                        onClick={() => onAuditionDrum(pad.sound)}
                        className="w-28 text-left text-[11px] font-bold text-gray-200 hover:text-amber-300 flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <span className="text-base">{pad.emoji}</span>
                        <span className="truncate">{pad.label}</span>
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, step) => {
                          const isBeatStart = step % 4 === 0;
                          const isActive = selectedBlock.notes.some(
                            n => n.drumSound === pad.sound && n.step === step
                          );

                          return (
                            <button
                              key={step}
                              onClick={() => handleToggleDrumStep(pad.sound, step)}
                              className={`w-6 h-6 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-rose-500 shadow-md shadow-rose-500/50 scale-105'
                                  : isBeatStart
                                    ? 'bg-white/15 hover:bg-white/25'
                                    : 'bg-white/5 hover:bg-white/15'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Melodic In-Key Piano Roll */
                <div className="flex flex-col gap-1 min-w-max">
                  {degreesToRender.map((degree) => {
                    const baseOctave = activeTrack.instrumentType === 'bass' ? 2 : (activeTrack.instrumentType === 'lead' ? 5 : 4);
                    const midi = degreeToMidi(degree, 0, baseOctave, meta.rootNote, meta.scale);
                    const noteName = midiToNoteName(midi);

                    return (
                      <div key={degree} className="flex items-center gap-2">
                        <button
                          onClick={() => onAuditionNote(midi)}
                          className="w-16 text-left text-[11px] font-mono font-bold text-amber-300 hover:text-white flex items-center justify-between p-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span>{noteName}</span>
                          <span className="text-[9px] text-gray-500">#{degree + 1}</span>
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalSteps }).map((_, step) => {
                            const isBeatStart = step % 4 === 0;
                            const isActive = selectedBlock.notes.some(
                              n => n.degree === degree && n.step === step
                            );

                            return (
                              <button
                                key={step}
                                onClick={() => handleToggleMelodicStep(degree, step)}
                                className={`w-6 h-4 rounded-md transition-all ${
                                  isActive
                                    ? 'bg-amber-400 shadow-md shadow-amber-500/50 scale-105'
                                    : isBeatStart
                                      ? 'bg-white/15 hover:bg-white/25'
                                      : 'bg-white/5 hover:bg-white/15'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Friendly Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 p-4 text-center">
            <span className="text-3xl animate-bounce">👆</span>
            <span className="font-extrabold text-white text-sm">Tap Any Block on Your Timeline!</span>
            <span className="text-[11px] text-gray-400 max-w-sm">
              Click any colored block on the tracks above to open its step notes and tweak them however you like!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
