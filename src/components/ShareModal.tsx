import React, { useState } from 'react';
import { Share2, X, Copy, Check, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { UserPresence } from '../types/daw';

interface ShareModalProps {
  roomId: string;
  peers: UserPresence[];
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ roomId, peers, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomUrl = typeof window !== 'undefined'
    ? (() => {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      return url.toString();
    })()
    : `https://jamblocks.app/?room=${encodeURIComponent(roomId)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-studio-800 border border-studio-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 bg-studio-750 border-b border-studio-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Collaborative Jam Room</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-studio-650 rounded-lg text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-gray-400 font-semibold mb-1 block">Shareable Jam Link</label>
            <div className="flex items-center gap-2 bg-studio-900 border border-studio-700 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={roomUrl}
                className="bg-transparent text-gray-300 font-mono text-[11px] flex-1 outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Connected Jam Members */}
          <div>
            <div className="text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Jam Members Online</span>
              <span className="text-[10px] text-gray-400 font-mono">{peers.length} Live</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {peers.map((peer, idx) => (
                <div
                  key={peer.id || idx}
                  className="flex items-center justify-between p-2.5 bg-studio-750/70 border border-studio-700 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                      style={{ backgroundColor: peer.color }}
                    />
                    <span className="font-semibold text-white">{peer.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Technology Note */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-[11px] text-indigo-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Serverless WebRTC P2P:</strong> Your musical session is synced peer-to-peer across browsers with zero central audio logging or delays.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-studio-750 border-t border-studio-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
