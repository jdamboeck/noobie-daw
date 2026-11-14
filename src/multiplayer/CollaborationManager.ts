import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MasterEffects, MidiBlock, ProjectMeta, Track, UserPresence } from '../types/daw';

export interface TransportSyncMessage {
  action: 'play' | 'pause' | 'stop' | 'seek';
  bar: number;
  timestamp: number;
}

export class CollaborationManager {
  private static instance: CollaborationManager;
  public doc: Y.Doc;
  public provider: WebrtcProvider | null = null;
  public roomId: string = 'demo-jam';
  public localUser: UserPresence;

  // Shared types
  public yMeta: Y.Map<any>;
  public yTracks: Y.Map<Track>;
  public yBlocks: Y.Map<MidiBlock>;
  public yMasterFx: Y.Map<any>;

  // Callbacks
  private onStateChangeCallbacks: Set<() => void> = new Set();
  private onPeersChangeCallbacks: Set<(peers: UserPresence[]) => void> = new Set();
  private onTransportActionCallbacks: Set<(action: TransportSyncMessage) => void> = new Set();
  private receivedTransportTimestamps: Map<number, number> = new Map();
  private awarenessChangeHandler?: () => void;
  private documentUpdateHandler?: () => void;

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

    // Populate initial state if this is the first peer in room
    this.doc.transact(() => {
      if (this.yTracks.size === 0 && initialDefaults) {
        Object.entries(initialDefaults.meta).forEach(([k, v]) => this.yMeta.set(k, v));
        Object.entries(initialDefaults.masterFx).forEach(([k, v]) => this.yMasterFx.set(k, v));
        initialDefaults.tracks.forEach(track => this.yTracks.set(track.id, track));
        initialDefaults.blocks.forEach(block => this.yBlocks.set(block.id, block));
      }
    });

    // Setup Awareness (Peers & Presence)
    const awareness = this.provider.awareness;
    awareness.setLocalStateField('user', this.localUser);

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
      this.onStateChangeCallbacks.forEach(cb => cb());
    };
    this.doc.on('update', this.documentUpdateHandler);
  }

  public disconnect(): void {
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
      tracks.forEach(track => this.yTracks.set(track.id, track));
    });
  }

  public addTrack(track: Track): void {
    this.doc.transact(() => {
      this.yTracks.set(track.id, track);
    });
  }

  public removeTrack(trackId: string): void {
    this.doc.transact(() => {
      this.yTracks.delete(trackId);
      this.yBlocks.forEach((block, blockId) => {
        if (block.trackId === trackId) this.yBlocks.delete(blockId);
      });
    });
  }

  public updateTrack(trackId: string, update: Partial<Track>): void {
    this.doc.transact(() => {
      const track = this.yTracks.get(trackId);
      if (track) this.yTracks.set(trackId, { ...track, ...update });
    });
  }

  public addBlock(block: MidiBlock): void {
    this.doc.transact(() => {
      this.yBlocks.set(block.id, block);
    });
  }

  public updateBlock(blockId: string, update: Partial<MidiBlock>): void {
    this.doc.transact(() => {
      const block = this.yBlocks.get(blockId);
      if (block) this.yBlocks.set(blockId, { ...block, ...update });
    });
  }

  public removeBlock(blockId: string): void {
    this.doc.transact(() => {
      this.yBlocks.delete(blockId);
    });
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
