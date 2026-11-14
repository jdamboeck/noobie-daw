import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Volume2,
  HelpCircle
} from 'lucide-react';
import { InstrumentType, Track } from '../types/daw';
import { BlockTemplate, SMART_BLOCKS_TEMPLATES } from '../music/blocksLibrary';

interface BlockLibraryProps {
  activeTrack: Track;
  onAddBlockFromTemplate: (template: BlockTemplate) => void;
  onPreviewTemplate: (template: BlockTemplate) => void;
}

export const BlockLibrary: React.FC<BlockLibraryProps> = ({
  activeTrack,
  onAddBlockFromTemplate,
  onPreviewTemplate
}) => {
  const [filterType, setFilterType] = useState<InstrumentType | 'active'>('active');

  const currentType = filterType === 'active' ? activeTrack.instrumentType : filterType;
  const filteredTemplates = SMART_BLOCKS_TEMPLATES.filter(t => t.instrumentType === currentType);

  const tabs: { type: InstrumentType; label: string; emoji: string; color: string }[] = [
    { type: 'drums', label: 'Beats', emoji: '🥁', color: 'bg-rose-500' },
    { type: 'bass', label: 'Bass', emoji: '🎸', color: 'bg-emerald-500' },
    { type: 'keys', label: 'Chords', emoji: '🎹', color: 'bg-amber-500' },
    { type: 'lead', label: 'Melodies', emoji: '🚀', color: 'bg-cyan-500' },
  ];

  return (
    <div className="w-80 bg-[#161a24] border-r border-white/10 flex flex-col h-full text-xs shadow-2xl select-none">
      {/* Toy Box Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#131720]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧱</span>
          <span className="font-black text-sm text-white">Music Blocks</span>
        </div>
        <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
          {filteredTemplates.length} Ready to Play
        </span>
      </div>

      {/* Chunky Tab Selector */}
      <div className="grid grid-cols-4 p-2 gap-1.5 bg-black/20 border-b border-white/5">
        {tabs.map((tab) => {
          const isSelected = currentType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setFilterType(tab.type)}
              className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                isSelected
                  ? `${tab.color} text-white font-black shadow-lg scale-105`
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl leading-none">{tab.emoji}</span>
              <span className="text-[10px] mt-1 font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Beginner Tip Banner */}
      <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">
          Drag any block onto a track or tap <strong>+ Add</strong>!
        </span>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {filteredTemplates.map((template) => {
          return (
            <div
              key={template.name}
              draggable
              onDragStart={(e) => {
                const globalIndex = SMART_BLOCKS_TEMPLATES.findIndex(t => t.name === template.name);
                e.dataTransfer.setData('application/jamblocks-template', globalIndex.toString());
              }}
              className="bg-[#1e2330] hover:bg-[#252c3d] border border-white/10 hover:border-white/25 rounded-2xl p-3 transition-all shadow-md flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:scale-[1.02] group"
            >
              {/* Header: Emoji, Title & Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow">{template.emoji}</span>
                  <div>
                    <div className="font-black text-white text-xs leading-tight">
                      {template.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      {template.category} • {template.durationBars} Bars
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Listen Preview Button */}
                  <button
                    onClick={() => onPreviewTemplate(template)}
                    className="p-1.5 bg-white/5 hover:bg-amber-400 hover:text-black rounded-xl text-gray-300 transition-colors"
                    title="Listen to how this block sounds"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Block Button */}
                  <button
                    onClick={() => onAddBlockFromTemplate(template)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                    title="Drop this block into your track"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-300 leading-snug">
                {template.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
