import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MasterEffects, MidiBlock, ProjectMeta, Track, UserPresence } from '../types/daw';

export interface TransportSyncMessage {
  action: 'play' | 'pause' | 'stop' | 'seek';
  bar: number;
  timestamp: number;
}

export type TrackUpdate = Omit<Partial<Track>, 'macros'> & {
  macros?: Partial<Track['macros']>;
};

export class CollaborationManager {
  private static instance: CollaborationManager;
  public doc: Y.Doc;
  public provider: WebrtcProvider | null = null;
  public roomId: string = 'demo-jam';
  public localUser: UserPresence;

  // Shared types
  public yMeta: Y.Map<any>;
  public yTracks: Y.Map<Y.Map<unknown>>;
  public yBlocks: Y.Map<Y.Map<unknown>>;
  public yMasterFx: Y.Map<any>;

  // Callbacks
  private onStateChangeCallbacks: Set<() => void> = new Set();
  private onPeersChangeCallbacks: Set<(peers: UserPresence[]) => void> = new Set();
  private onTransportActionCallbacks: Set<(action: TransportSyncMessage) => void> = new Set();
  private receivedTransportTimestamps: Map<number, number> = new Map();
  private awarenessChangeHandler?: () => void;
  private documentUpdateHandler?: () => void;
  private initialStateTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.doc = new Y.Doc();
    this.yMeta = this.doc.getMap('meta');
    this.yTracks = this.doc.getMap('tracks-v2');
    this.yBlocks = this.doc.getMap('blocks-v2');
    this.yMasterFx = this.doc.getMap('masterFx');

    // Generate user identity
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomId = Math.random().toString(36).substring(2, 9);
    const adjectives = ['Funky', 'Groovy', 'Chill', 'Sunny', 'Cosmic', 'Electric'];
    const animals = ['Panda', 'Fox', 'Otter', 'Badger', 'Dolphin', 'Koala'];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;

    this.localUser = {
      id: randomId,
      name: randomName,
      color: randomColor,
      lastActive: Date.now()
    };
  }

  public static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  /**
   * Initializes the WebRTC connection for the given room
   */
  public connect(roomId: string, initialDefaults?: { meta: ProjectMeta; tracks: Track[]; blocks: MidiBlock[]; masterFx: MasterEffects }): void {
    this.roomId = roomId;

    this.disconnect();
    this.receivedTransportTimestamps.clear();

    // Connect via serverless WebRTC signaling relays
    this.provider = new WebrtcProvider(`jamblocks-room-${roomId}`, this.doc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      password: undefined,
      awareness: undefined,
      maxConns: 20 + Math.floor(Math.random() * 15),
      filterBcConns: true,
      peerOpts: {}
    });

    // Setup Awareness (Peers & Presence)
    const awareness = this.provider.awareness;
    awareness.setLocalStateField('user', this.localUser);
    awareness.setLocalStateField('projectReady', this.yTracks.size > 0);

    this.awarenessChangeHandler = () => {
      const states = awareness.getStates();
      const peers: UserPresence[] = [];
      states.forEach((state, clientId) => {
        if (state.user) {
          peers.push(state.user as UserPresence);
        }

        const action = state.transportAction as TransportSyncMessage | undefined;
        if (!action || state.user?.id === this.localUser.id) return;
        if (!['play', 'pause', 'stop', 'seek'].includes(action.action)) return;
        if (!Number.isFinite(action.timestamp) || Date.now() - action.timestamp > 10000) return;
        if (this.receivedTransportTimestamps.get(clientId) === action.timestamp) return;

        this.receivedTransportTimestamps.set(clientId, action.timestamp);
        this.onTransportActionCallbacks.forEach(cb => cb(action));
      });
      this.onPeersChangeCallbacks.forEach(cb => cb(peers));
    };
    awareness.on('change', this.awarenessChangeHandler);

    // Subscribe to shared state changes
    this.documentUpdateHandler = () => {
      if (this.yTracks.size > 0 && awareness.getLocalState()?.projectReady !== true) {
        awareness.setLocalStateField('projectReady', true);
      }
      this.onStateChangeCallbacks.forEach(cb => cb());
    };
    this.doc.on('update', this.documentUpdateHandler);

    if (initialDefaults && this.yTracks.size === 0) {
      this.initialStateTimer = setTimeout(() => {
        this.initialStateTimer = null;
        if (this.yTracks.size > 0) return;

        const states = Array.from(awareness.getStates().entries());
        const hasReadyPeer = states.some(([clientId, state]) => clientId !== this.doc.clientID && state.projectReady === true);
        if (hasReadyPeer) return;

        const electedSeeder = states
          .filter(([, state]) => Boolean(state.user))
          .map(([clientId]) => clientId)
          .sort((left, right) => left - right)[0];
        if (electedSeeder !== this.doc.clientID) return;

        this.doc.transact(() => {
          Object.entries(initialDefaults.meta).forEach(([key, value]) => this.yMeta.set(key, value));
          Object.entries(initialDefaults.masterFx).forEach(([key, value]) => this.yMasterFx.set(key, value));
          initialDefaults.tracks.forEach(track => this.yTracks.set(track.id, this.createRecord(track)));
          initialDefaults.blocks.forEach(block => this.yBlocks.set(block.id, this.createRecord(block)));
        });
        awareness.setLocalStateField('projectReady', true);
      }, 700);
    }
  }

  public disconnect(): void {
    if (this.initialStateTimer !== null) {
      clearTimeout(this.initialStateTimer);
      this.initialStateTimer = null;
    }
    if (this.provider) {
      if (this.awarenessChangeHandler) {
        this.provider.awareness.off('change', this.awarenessChangeHandler);
      }
      this.provider.destroy();
      this.provider = null;
    }
    if (this.documentUpdateHandler) {
      this.doc.off('update', this.documentUpdateHandler);
    }
    this.awarenessChangeHandler = undefined;
    this.documentUpdateHandler = undefined;
    this.receivedTransportTimestamps.clear();
  }

  public updateLocalPresence(update: Partial<UserPresence>): void {
    if (!this.provider) return;
    this.localUser = { ...this.localUser, ...update, lastActive: Date.now() };
    this.provider.awareness.setLocalStateField('user', this.localUser);
  }

  // --- Transport Broadcast ---
  public broadcastTransport(action: 'play' | 'pause' | 'stop' | 'seek', bar: number): TransportSyncMessage {
    const msg: TransportSyncMessage = {
      action,
      bar,
      timestamp: Date.now() + (action === 'play' ? 250 : 0)
    };
    this.provider?.awareness.setLocalStateField('transportAction', msg);
    return msg;
  }

  // --- Mutators for React Components ---
  public updateMeta(meta: Partial<ProjectMeta>): void {
    this.doc.transact(() => {
      Object.entries(meta).forEach(([k, v]) => this.yMeta.set(k, v));
    });
  }

  public updateMasterEffects(fx: Partial<MasterEffects>): void {
    this.doc.transact(() => {
      Object.entries(fx).forEach(([k, v]) => this.yMasterFx.set(k, v));
    });
  }

  public setTracks(tracks: Track[]): void {
    this.doc.transact(() => {
      this.yTracks.clear();
      tracks.forEach(track => this.yTracks.set(track.id, this.createRecord(track)));
    });
  }

  public addTrack(track: Track): void {
    this.doc.transact(() => {
      this.yTracks.set(track.id, this.createRecord(track));
    });
  }

  public removeTrack(trackId: string): void {
    this.doc.transact(() => {
      this.yTracks.delete(trackId);
      this.yBlocks.forEach((block, blockId) => {
        if (this.readRecord<MidiBlock>(block).trackId === trackId) this.yBlocks.delete(blockId);
      });
    });
  }

  public updateTrack(trackId: string, update: TrackUpdate): void {
    this.updateRecord<Track, TrackUpdate>(this.yTracks, trackId, update);
  }

  public addBlock(block: MidiBlock): void {
    this.doc.transact(() => {
      this.yBlocks.set(block.id, this.createRecord(block));
    });
  }

  public updateBlock(blockId: string, update: Partial<MidiBlock>): void {
    this.updateRecord<MidiBlock, Partial<MidiBlock>>(this.yBlocks, blockId, update);
  }

  public removeBlock(blockId: string): void {
    this.doc.transact(() => {
      this.yBlocks.delete(blockId);
    });
  }

  public getTracks(): Track[] {
    return Array.from(this.yTracks.values(), record => this.readRecord<Track>(record));
  }

  public getBlocks(): MidiBlock[] {
    return Array.from(this.yBlocks.values(), record => this.readRecord<MidiBlock>(record));
  }

  private createRecord<T extends object>(value: T): Y.Map<unknown> {
    const record = new Y.Map<unknown>();
    Object.entries(value).forEach(([key, field]) => {
      if (field && typeof field === 'object' && !Array.isArray(field)) {
        record.set(key, this.createRecord(field));
      } else {
        record.set(key, field);
      }
    });
    return record;
  }

  private setRecordField(record: Y.Map<unknown>, key: string, value: unknown): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      record.set(key, value);
      return;
    }

    const current = record.get(key);
    if (current instanceof Y.Map) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => this.setRecordField(current, nestedKey, nestedValue));
    } else {
      record.set(key, this.createRecord(value));
    }
  }

  private updateRecord<T extends object, U extends object>(map: Y.Map<Y.Map<unknown>>, id: string, update: U): void {
    this.doc.transact(() => {
      const current = map.get(id) as unknown;
      if (!current) return;
      if (current instanceof Y.Map) {
        Object.entries(update).forEach(([key, value]) => this.setRecordField(current, key, value));
      } else {
        const merged = { ...(current as T), ...update } as T;
        const currentMacros = (current as { macros?: object }).macros;
        const updatedMacros = (update as { macros?: object }).macros;
        if (currentMacros && updatedMacros && 'macros' in merged) {
          Object.assign(merged, { macros: { ...currentMacros, ...updatedMacros } });
        }
        map.set(id, this.createRecord(merged));
      }
    });
  }

  private readRecord<T>(record: unknown): T {
    if (record instanceof Y.Map) return record.toJSON() as T;
    return record as T;
  }

  // --- Subscriptions ---
  public onStateChange(cb: () => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  public onPeersChange(cb: (peers: UserPresence[]) => void): () => void {
    this.onPeersChangeCallbacks.add(cb);
    return () => this.onPeersChangeCallbacks.delete(cb);
  }

  public onTransportAction(cb: (action: TransportSyncMessage) => void): () => void {
    this.onTransportActionCallbacks.add(cb);
    return () => this.onTransportActionCallbacks.delete(cb);
  }
}
