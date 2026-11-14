import { MidiDeviceInfo, MidiLearnBinding, MidiNoteMessage } from '../types/midi';

export type NoteCallback = (message: MidiNoteMessage) => void;
export type CcCallback = (cc: number, value: number, channel: number) => void;
export type MidiPermissionStatus = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

interface MIDIAccessLike {
  inputs: {
    forEach: (cb: (input: MIDIInputLike, key: string) => void) => void;
    values: () => IterableIterator<MIDIInputLike>;
  };
  onstatechange: ((event: any) => void) | null;
}

interface MIDIInputLike {
  id: string;
  name?: string;
  manufacturer?: string;
  state: string;
  onmidimessage: ((event: MIDIMessageEventLike) => void) | null;
}

interface MIDIMessageEventLike {
  data: Uint8Array | number[];
}

export class MidiManager {
  private static instance: MidiManager;
  private midiAccess: MIDIAccessLike | null = null;
  private isSupported: boolean = false;
  private isFirefox: boolean = false;
  private permissionStatus: MidiPermissionStatus = 'unknown';
  private lastError: string | null = null;
  private devices: MidiDeviceInfo[] = [];

  // Listeners
  private noteCallbacks: Set<NoteCallback> = new Set();
  private ccCallbacks: Set<CcCallback> = new Set();
  private deviceChangeCallbacks: Set<(devices: MidiDeviceInfo[]) => void> = new Set();
  private statusChangeCallbacks: Set<(status: MidiPermissionStatus, error: string | null) => void> = new Set();

  // MIDI Learn State
  private learningParamId: string | null = null;
  private bindings: Map<string, MidiLearnBinding> = new Map();

  private constructor() {
    if (typeof navigator !== 'undefined') {
      this.isFirefox = /firefox/i.test(navigator.userAgent);
      this.isSupported = 'requestMIDIAccess' in navigator;
      if (!this.isSupported) {
        this.permissionStatus = 'unsupported';
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          this.lastError = 'Web MIDI requires a secure context. Open this app on localhost or over HTTPS.';
        } else if (this.isFirefox) {
          this.lastError = 'Web MIDI is disabled in Firefox by default. Enable dom.webmidi.enabled in about:config.';
        } else {
          this.lastError = 'Web MIDI is not supported in this browser.';
        }
      } else {
        this.permissionStatus = 'prompt';
      }
    }
    this.loadBindingsFromStorage();
  }

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getIsFirefox(): boolean {
    return this.isFirefox;
  }

  public getPermissionStatus(): MidiPermissionStatus {
    return this.permissionStatus;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Attempts automatic silent connection on startup
   * (Works if permission was previously allowed in Chrome, or in Firefox with dom.webmidi.enabled)
   */
  public async tryAutoConnect(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      return false;
    }
    try {
      return await this.requestAccess(false);
    } catch (e) {
      // User gesture needed
      return false;
    }
  }

  /**
   * Primary MIDI connection method (called from user click gesture)
   */
  public async requestAccess(sysex: boolean = false): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      this.isSupported = false;
      this.permissionStatus = 'unsupported';
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        this.lastError = 'Web MIDI requires a secure context. Open this app on localhost or over HTTPS.';
      } else if (this.isFirefox) {
        this.lastError = 'Web MIDI is disabled in Firefox. Go to about:config and set dom.webmidi.enabled to true.';
      } else {
        this.lastError = 'Web MIDI is not supported in this browser.';
      }
      this.notifyStatusChange();
      return false;
    }

    try {
      const nav = navigator as any;
      // Single standard call without unsupported parameters
      const access = (await nav.requestMIDIAccess({ sysex })) as MIDIAccessLike;

      this.midiAccess = access;
      this.permissionStatus = 'granted';
      this.lastError = null;

      this.updateDeviceList();
      this.bindInputs();

      // Listen for hot-plug events (e.g. plugging in or turning on Launchkey)
      this.midiAccess.onstatechange = () => {
        this.updateDeviceList();
        this.bindInputs();
      };

      this.notifyStatusChange();
      return true;
    } catch (err: any) {
      console.warn('Web MIDI Access request error:', err);
      this.permissionStatus = 'denied';
      this.lastError = err?.message || 'Access to MIDI devices was blocked by browser.';
      this.notifyStatusChange();
      return false;
    }
  }

  private updateDeviceList(): void {
    if (!this.midiAccess || !this.midiAccess.inputs) return;
    const list: MidiDeviceInfo[] = [];

    this.midiAccess.inputs.forEach((input: MIDIInputLike) => {
      if (input) {
        list.push({
          id: input.id,
          name: input.name || 'Hardware MIDI Keyboard',
          manufacturer: input.manufacturer || 'USB MIDI Device',
          state: (input.state as 'connected' | 'disconnected') || 'connected',
          type: 'input'
        });
      }
    });

    this.devices = list;
    this.deviceChangeCallbacks.forEach(cb => cb([...this.devices]));
  }

  private bindInputs(): void {
    if (!this.midiAccess || !this.midiAccess.inputs) return;

    this.midiAccess.inputs.forEach((input: MIDIInputLike) => {
      if (input) {
        input.onmidimessage = (event: MIDIMessageEventLike) => {
          this.handleMidiMessage(event);
        };
      }
    });
  }

  private handleMidiMessage(event: MIDIMessageEventLike): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0];
    const messageType = statusByte >> 4;
    const channel = statusByte & 0x0f;
    const byte1 = data[1];
    const byte2 = data[2] || 0;

    // Note On (0x9)
    if (messageType === 0x9) {
      if (byte2 > 0) {
        this.dispatchNote({
          type: 'noteon',
          note: byte1,
          velocity: byte2,
          channel
        });
      } else {
        this.dispatchNote({
          type: 'noteoff',
          note: byte1,
          velocity: 0,
          channel
        });
      }
    } else if (messageType === 0x8) {
      // Note Off (0x8)
      this.dispatchNote({
        type: 'noteoff',
        note: byte1,
        velocity: byte2,
        channel
      });
    } else if (messageType === 0xb) {
      // CC (0xB)
      const ccNumber = byte1;
      const ccValue = byte2;

      if (this.learningParamId) {
        this.bindParameter(this.learningParamId, channel, ccNumber);
        this.learningParamId = null;
      }

      this.ccCallbacks.forEach(cb => cb(ccNumber, ccValue, channel));
    }
  }

  private dispatchNote(message: MidiNoteMessage): void {
    this.noteCallbacks.forEach(cb => cb(message));
  }

  private notifyStatusChange(): void {
    this.statusChangeCallbacks.forEach(cb => cb(this.permissionStatus, this.lastError));
  }

  // --- Subscriptions ---
  public onNote(callback: NoteCallback): () => void {
    this.noteCallbacks.add(callback);
    return () => this.noteCallbacks.delete(callback);
  }

  public onCc(callback: CcCallback): () => void {
    this.ccCallbacks.add(callback);
    return () => this.ccCallbacks.delete(callback);
  }

  public onDevicesChanged(callback: (devices: MidiDeviceInfo[]) => void): () => void {
    this.deviceChangeCallbacks.add(callback);
    callback([...this.devices]);
    return () => this.deviceChangeCallbacks.delete(callback);
  }

  public onStatusChanged(callback: (status: MidiPermissionStatus, error: string | null) => void): () => void {
    this.statusChangeCallbacks.add(callback);
    callback(this.permissionStatus, this.lastError);
    return () => this.statusChangeCallbacks.delete(callback);
  }

  public getConnectedDevices(): MidiDeviceInfo[] {
    return [...this.devices];
  }

  // --- MIDI Learn ---
  public startMidiLearn(paramId: string): void {
    this.learningParamId = paramId;
  }

  public stopMidiLearn(): void {
    this.learningParamId = null;
  }

  public getIsLearning(): string | null {
    return this.learningParamId;
  }

  public bindParameter(paramId: string, channel: number, ccNumber: number): void {
    const binding: MidiLearnBinding = { paramId, channel, ccNumber };
    this.bindings.set(paramId, binding);
    this.saveBindingsToStorage();
  }

  public getBinding(paramId: string): MidiLearnBinding | undefined {
    return this.bindings.get(paramId);
  }

  private saveBindingsToStorage(): void {
    try {
      const arr = Array.from(this.bindings.entries());
      localStorage.setItem('jamblocks_midi_bindings', JSON.stringify(arr));
    } catch (e) {
      // ignore
    }
  }

  private loadBindingsFromStorage(): void {
    try {
      const saved = localStorage.getItem('jamblocks_midi_bindings');
      if (saved) {
        const arr = JSON.parse(saved);
        this.bindings = new Map(arr);
      }
    } catch (e) {
      // ignore
    }
  }
}
