import React, { useState, useEffect } from 'react';
import { Radio, X, CheckCircle, AlertCircle, RefreshCw, Cpu, Activity, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { MidiDeviceInfo } from '../types/midi';
import { MidiManager, MidiPermissionStatus } from '../midi/MidiManager';

interface MidiModalProps {
  devices: MidiDeviceInfo[];
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: (sysex?: boolean) => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({ devices, isOpen, onClose, onRequestAccess }) => {
  const [lastActivity, setLastActivity] = useState<string>('Press any key or pad on your controller...');
  const [activityFlash, setActivityFlash] = useState<boolean>(false);
  const [status, setStatus] = useState<MidiPermissionStatus>('unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const midiManager = MidiManager.getInstance();
  const isFirefox = midiManager.getIsFirefox();

  useEffect(() => {
    if (!isOpen) return;

    setStatus(midiManager.getPermissionStatus());
    setErrorMessage(midiManager.getLastError());

    const unsubStatus = midiManager.onStatusChanged((newStatus, error) => {
      setStatus(newStatus);
      setErrorMessage(error);
    });

    const unsubNote = midiManager.onNote((msg) => {
      setLastActivity(`Note ${msg.type.toUpperCase()}: Pitch ${msg.note} • Velocity: ${msg.velocity}`);
      setActivityFlash(true);
      setTimeout(() => setActivityFlash(false), 150);
    });

    const unsubCc = midiManager.onCc((cc, val) => {
      setLastActivity(`Control Change: CC #${cc} = ${val}`);
      setActivityFlash(true);
      setTimeout(() => setActivityFlash(false), 150);
    });

    return () => {
      unsubStatus();
      unsubNote();
      unsubCc();
    };
  }, [isOpen, midiManager]);

  if (!isOpen) return null;

  const handleConnectStandard = async () => {
    onRequestAccess(false);
  };

  const handleConnectSysEx = async () => {
    onRequestAccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-studio-800 border border-studio-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-studio-750 border-b border-studio-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">MIDI Controller Connection</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-studio-650 rounded-lg text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Detected Devices Banner */}
          {devices.length > 0 ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-emerald-300 text-sm">MIDI Hardware Ready!</div>
                  <div className="text-[11px] text-emerald-200/80">
                    {devices.length} controller{devices.length > 1 ? 's' : ''} connected and mapped to active tracks.
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectStandard}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-scan</span>
              </button>
            </div>
          ) : (
            /* Action Buttons if no devices or awaiting permission */
            <div className="p-4 bg-studio-900 border border-studio-700 rounded-xl flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-white text-sm">Connect Hardware Controller</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Click the button below to initialize browser MIDI access and scan for connected USB/Bluetooth keyboards:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleConnectStandard}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Connect MIDI Devices</span>
                </button>

                <button
                  onClick={handleConnectSysEx}
                  className="bg-studio-750 hover:bg-studio-700 text-gray-200 border border-studio-600 font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  title="Requests SysEx permission (forces browser popup dialog in Chrome/Firefox)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request With Popup</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-[11px] text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <div className="font-bold">MIDI access unavailable ({status})</div>
                <div className="mt-0.5 text-rose-200/80">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Real-Time Signal Monitor */}
          <div className="bg-studio-900 border border-studio-700 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-100 ${
                  activityFlash ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400' : 'bg-gray-600'
                }`}
              />
              <span className="font-mono text-gray-300 text-[11px] truncate max-w-sm">{lastActivity}</span>
            </div>
            <Activity className="w-4 h-4 text-gray-500 shrink-0" />
          </div>

          {/* Connected Device Cards */}
          <div>
            <div className="text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Connected Hardware</span>
              <span className="text-[10px] text-gray-500 font-mono">{devices.length} Port{devices.length === 1 ? '' : 's'}</span>
            </div>

            {devices.length > 0 ? (
              <div className="flex flex-col gap-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-studio-750/70 border border-studio-700 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="font-bold text-white text-xs">{device.name}</div>
                        <div className="text-[10px] text-gray-400">{device.manufacturer || 'Hardware Controller'}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-studio-750/30 border border-dashed border-studio-700 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-gray-400">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-gray-300">No Controllers Detected Yet</span>
                <span className="text-[11px] text-gray-500 max-w-xs">
                  Make sure your USB keyboard (e.g. Launchkey, MPK Mini, Keystation) is plugged in, then click <strong>Connect MIDI Devices</strong> above.
                </span>
              </div>
            )}
          </div>

          {/* Browser Help & Tips */}
          <div className="p-3 bg-studio-750/50 border border-studio-700 rounded-xl flex flex-col gap-1.5 text-[11px] text-gray-400">
            <div className="font-semibold text-gray-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Browser Tips:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-gray-400">
              <li><strong>Chrome / Edge / Brave:</strong> Clicking "Connect MIDI" will prompt <em>"localhost:3000 wants to use your MIDI devices"</em>. Click Allow.</li>
              <li><strong>Firefox:</strong> Make sure <code>dom.webmidi.enabled</code> is set to <code>true</code> in <code>about:config</code>. Firefox auto-approves standard MIDI controllers without needing a popup.</li>
              <li><strong>On-Screen Keyboard:</strong> You can also use your computer typing keys (A, W, S, E, D, F...) or on-screen piano keys!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-studio-750 border-t border-studio-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
