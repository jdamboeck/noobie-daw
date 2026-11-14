export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export interface MidiLearnBinding {
  paramId: string; // e.g. "track-1-volume", "master-reverb", "macro-param1"
  channel: number;
  ccNumber: number;
}

export interface MidiNoteMessage {
  type: 'noteon' | 'noteoff';
  note: number; // 0-127
  velocity: number; // 0-127
  channel: number;
}
