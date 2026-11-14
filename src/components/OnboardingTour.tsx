import React from 'react';
import { Sparkles, Music, Disc, Radio, X } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 bg-studio-800 border-2 border-indigo-500/50 rounded-2xl shadow-2xl p-4 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-studio-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-white text-sm">Welcome to JamBlocks!</h4>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-studio-700 rounded-lg text-gray-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-3 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
            <Disc className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-gray-200">1. Drag in Smart Blocks</div>
            <div className="text-[11px] text-gray-400">
              Pick a drum groove or chord progression from the left library to build your arrangement.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <Music className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-gray-200">2. Musical Guardrails (Scale Lock)</div>
            <div className="text-[11px] text-gray-400">
              Every block and live note auto-transposes to your song key. You can never hit a wrong note!
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-gray-200">3. Play & Collaborate</div>
            <div className="text-[11px] text-gray-400">
              Plug in any USB MIDI controller or use your typing keyboard. Invite friends to jam in real time!
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
      >
        Got it, let's make music!
      </button>
    </div>
  );
};
