import React, { useRef, useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  Plus,
  Play,
  Sparkles,
  Smile
} from 'lucide-react';
import { InstrumentType, MidiBlock, ProjectMeta, Track, UserPresence } from '../types/daw';

interface ArrangerProps {
  meta: ProjectMeta;
  tracks: Track[];
  blocks: MidiBlock[];
  activeTrackId: string;
  selectedBlockId: string | null;
  playheadPosition: number;
  peers: UserPresence[];
  onSelectTrack: (trackId: string) => void;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateTrack: (trackId: string, update: Partial<Track>) => void;
  onRemoveTrack: (trackId: string) => void;
  onMoveBlock: (blockId: string, newTrackId: string, newStartBar: number) => void;
  onDuplicateBlock: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onSeek: (bar: number) => void;
}

const BAR_WIDTH = 110; // chunky bar width for easy touching and clicking

export const Arranger: React.FC<ArrangerProps> = ({
  meta,
  tracks,
  blocks,
  activeTrackId,
  selectedBlockId,
  playheadPosition,
  peers,
  onSelectTrack,
  onSelectBlock,
  onUpdateTrack,
  onRemoveTrack,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragInitialBar, setDragInitialBar] = useState<number>(1);

  const getTrackEmoji = (track: Track) => {
    switch (track.instrumentType) {
      case 'drums': return '🥁';
      case 'bass': return '🎸';
      case 'keys': return '🎹';
      case 'lead': return '🚀';
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const clickedBar = Math.max(1, Math.min(meta.totalBars, 1 + clickX / BAR_WIDTH));
    onSeek(clickedBar);
  };

  const handleBlockMouseDown = (e: React.MouseEvent, block: MidiBlock) => {
    e.stopPropagation();
    onSelectBlock(block.id);
    onSelectTrack(block.trackId);
    setDraggingBlockId(block.id);
    setDragStartX(e.clientX);
    setDragInitialBar(block.startBar);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingBlockId) return;
    const deltaX = e.clientX - dragStartX;
    const deltaBars = Math.round(deltaX / BAR_WIDTH);
    const newBar = Math.max(1, Math.min(meta.totalBars - 1, dragInitialBar + deltaBars));

    const block = blocks.find(b => b.id === draggingBlockId);
    if (block && block.startBar !== newBar) {
      onMoveBlock(block.id, block.trackId, newBar);
    }
  };

  const handleMouseUp = () => {
    setDraggingBlockId(null);
  };

  return (
    <div
      className="flex-1 flex overflow-hidden select-none bg-[#0e121a]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Track Headers Column */}
      <div className="w-56 bg-[#161b26] border-r border-white/10 flex flex-col z-20 shadow-2xl">
        {/* Header Title */}
        <div className="h-10 border-b border-white/10 px-4 flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider bg-[#131720]">
          <span>Instruments</span>
          <span className="text-[10px] text-gray-400 font-bold">Mute</span>
        </div>

        {/* Track Rows */}
        <div className="flex-1 overflow-y-auto">
          {tracks.map((track) => {
            const isActive = track.id === activeTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`h-24 border-b border-white/5 p-3 flex flex-col justify-between transition-all cursor-pointer relative ${
                  isActive ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r shadow-md"
                    style={{ backgroundColor: track.color }}
                  />
                )}

                {/* Track Icon & Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl drop-shadow">{getTrackEmoji(track)}</span>
                    <div>
                      <div className="font-extrabold text-xs text-white leading-tight">
                        {track.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium capitalize">
                        {track.instrumentType}
                      </div>
                    </div>
                  </div>

                  {/* Quick Mute & Remove */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { muted: !track.muted });
                      }}
                      className={`p-1.5 rounded-xl transition-all ${
                        track.muted ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                      title={track.muted ? 'Unmute Track' : 'Mute Track'}
                    >
                      {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {tracks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-colors"
                        title="Delete Instrument"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Track Loudness Slider */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                  <span>Level</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={track.volume}
                    onChange={(e) => onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 accent-indigo-500 h-1.5 bg-black/50 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Arranger Timeline & Grid */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0b0e14] cursor-pointer"
      >
        {/* Playful Bar Header */}
        <div
          className="h-10 border-b border-white/10 sticky top-0 bg-[#131720]/95 backdrop-blur z-10 flex"
          style={{ width: `${meta.totalBars * BAR_WIDTH}px` }}
        >
          {Array.from({ length: meta.totalBars }).map((_, barIdx) => {
            const barNum = barIdx + 1;
            const isLoopRegion = barNum >= meta.loopStartBar && barNum < meta.loopEndBar;
            return (
              <div
                key={barNum}
                className={`border-r border-white/5 flex items-center justify-between px-2.5 font-bold text-xs select-none ${
                  isLoopRegion ? 'bg-amber-500/10 text-amber-300 font-black' : 'text-gray-400'
                }`}
                style={{ width: `${BAR_WIDTH}px` }}
              >
                <span>Bar {barNum}</span>
                {barNum === meta.loopStartBar && <span className="text-[10px]">🔁 Loop</span>}
              </div>
            );
          })}
        </div>

        {/* Arranger Track Lanes */}
        <div
          className="relative"
          style={{ width: `${meta.totalBars * BAR_WIDTH}px` }}
        >
          {/* Subtle Vertical Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex">
            {Array.from({ length: meta.totalBars }).map((_, barIdx) => (
              <div
                key={barIdx}
                className="border-r border-white/[0.04]"
                style={{ width: `${BAR_WIDTH}px` }}
              />
            ))}
          </div>

          {/* Loop Range Highlight */}
          {meta.loopEnabled && (
            <div
              className="absolute top-0 bottom-0 bg-amber-500/[0.04] pointer-events-none border-x-2 border-amber-500/30"
              style={{
                left: `${(meta.loopStartBar - 1) * BAR_WIDTH}px`,
                width: `${(meta.loopEndBar - meta.loopStartBar) * BAR_WIDTH}px`
              }}
            />
          )}

          {/* Track Lanes */}
          {tracks.map((track) => {
            const trackBlocks = blocks.filter(b => b.trackId === track.id);
            const isTrackActive = track.id === activeTrackId;

            return (
              <div
                key={track.id}
                className={`h-24 border-b border-white/5 relative transition-colors ${
                  isTrackActive ? 'bg-white/[0.02]' : ''
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const templateData = e.dataTransfer.getData('application/jamblocks-template');
                  if (templateData) {
                    const rect = timelineRef.current?.getBoundingClientRect();
                    if (rect) {
                      const dropX = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
                      const targetBar = Math.max(1, Math.round(1 + dropX / BAR_WIDTH));
                      window.dispatchEvent(new CustomEvent('jamblocks:dropTemplate', {
                        detail: { templateIndex: parseInt(templateData), trackId: track.id, bar: targetBar }
                      }));
                    }
                  }
                }}
              >
                {/* Render Lego Blocks */}
                {trackBlocks.map((block) => {
                  const isSelected = block.id === selectedBlockId;
                  const leftPos = (block.startBar - 1) * BAR_WIDTH;
                  const blockWidth = block.durationBars * BAR_WIDTH;

                  return (
                    <div
                      key={block.id}
                      onMouseDown={(e) => handleBlockMouseDown(e, block)}
                      className={`absolute top-2.5 bottom-2.5 rounded-2xl p-2.5 flex flex-col justify-between cursor-grab active:cursor-grabbing shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] group ${
                        isSelected
                          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black z-10 scale-[1.02]'
                          : 'hover:brightness-110'
                      }`}
                      style={{
                        left: `${leftPos}px`,
                        width: `${blockWidth}px`,
                        backgroundColor: track.color,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.15) 100%)'
                      }}
                    >
                      {/* Lego Studs row (tactile toy look!) */}
                      <div className="flex gap-2 opacity-60 pointer-events-none pb-0.5">
                        {Array.from({ length: Math.min(8, block.durationBars * 3) }).map((_, studIdx) => (
                          <div
                            key={studIdx}
                            className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-inner"
                          />
                        ))}
                      </div>

                      {/* Block Name & Emoji */}
                      <div className="flex items-center justify-between text-white drop-shadow">
                        <div className="flex items-center gap-1.5 font-black text-xs truncate">
                          <span className="text-base">{block.emoji || '🎵'}</span>
                          <span className="truncate">{block.name}</span>
                        </div>

                        {/* Quick Actions on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateBlock(block.id);
                            }}
                            className="p-1 bg-black/40 hover:bg-black/60 rounded-lg text-white"
                            title="Duplicate Block"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveBlock(block.id);
                            }}
                            className="p-1 bg-rose-600/80 hover:bg-rose-600 rounded-lg text-white"
                            title="Delete Block"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Note Preview Ribbon */}
                      <div className="h-3 bg-black/25 rounded-full flex items-center px-1 overflow-hidden relative shadow-inner">
                        {block.notes.slice(0, 24).map((note, idx) => {
                          const leftPct = (note.step / (block.durationBars * 16)) * 100;
                          return (
                            <div
                              key={idx}
                              className="absolute w-2 h-2 rounded-full bg-white shadow-sm"
                              style={{ left: `${leftPct}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Smooth Playhead Beacon */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 z-30 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.8)]"
            style={{
              left: `${(playheadPosition - 1) * BAR_WIDTH}px`,
              transition: 'left 0.04s linear'
            }}
          >
            {/* Glowing Arrow Beacon */}
            <div className="w-5 h-5 bg-amber-400 rounded-full transform -translate-x-1/2 -mt-2 shadow-lg flex items-center justify-center text-[10px]">
              ⭐
            </div>
          </div>

          {/* Collaborator Ghosts */}
          {peers.map((peer, idx) => {
            if (!peer.cursorBar) return null;
            return (
              <div
                key={peer.id || idx}
                className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
                style={{
                  left: `${(peer.cursorBar - 1) * BAR_WIDTH}px`,
                  backgroundColor: peer.color
                }}
              >
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-black text-black transform -translate-x-1/2 whitespace-nowrap shadow-xl flex items-center gap-1"
                  style={{ backgroundColor: peer.color }}
                >
                  <span>👋</span>
                  <span>{peer.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
