import * as Tone from 'tone';
import { DrumSound, InstrumentType, MasterEffects, MidiBlock, NoteEvent, ProjectMeta, RootNote, ScaleMode, Track } from '../types/daw';
import { degreeToMidi, midiToNoteName, snapMidiToScale } from '../music/harmonic';
import {
  createBassChannel,
  createDrumChannel,
  createKeysChannel,
  createLeadChannel,
  InstrumentChannel
} from './Instruments';

export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private isPlaying = false;
  private channels: Map<string, InstrumentChannel> = new Map();

  // Master Chain Nodes
  private masterInput!: Tone.Gain;
  private masterFilter!: Tone.Filter;
  private masterSaturation!: Tone.Distortion;
  private masterReverb!: Tone.Freeverb;
  private masterDelay!: Tone.FeedbackDelay;
  private masterLimiter!: Tone.Limiter;
  private masterGain!: Tone.Gain;

  // Active Project Reference
  private projectMeta: ProjectMeta = {
    id: 'default',
    title: 'Untitled Jam',
    bpm: 116,
    rootNote: 'C',
    scale: 'minor',
    scaleLock: true,
    loopEnabled: true,
    loopStartBar: 1,
    loopEndBar: 5,
    totalBars: 16
  };
  private tracks: Track[] = [];
  private blocks: MidiBlock[] = [];
  private masterFx: MasterEffects = {
    volume: 85,
    reverb: 25,
    delay: 20,
    filterCutoff: 95,
    saturation: 15
  };

  // Deterministic 16th-note step counter
  private currentStep: number = 0;
  private scheduleId: number | null = null;
  private onPlayheadTick?: (currentBar: number, currentStep: number) => void;

  private constructor() {
    // Lazy init on first user gesture
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes Web Audio Context & master effects graph
   */
  public async init(): Promise<void> {
    if (!this.isInitialized) {
      if (!this.initializationPromise) {
        this.initializationPromise = (async () => {
          await Tone.start();
          if (Tone.context.state !== 'running') {
            await Tone.context.resume();
          }

          this.masterInput = new Tone.Gain(1.0);
          this.masterFilter = new Tone.Filter(20000, 'lowpass');
          this.masterSaturation = new Tone.Distortion(0.02);
          this.masterDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.15, wet: 0.08 });
          this.masterReverb = new Tone.Freeverb({ roomSize: 0.35, dampening: 3500, wet: 0.1 });
          this.masterLimiter = new Tone.Limiter(-0.1);
          this.masterGain = new Tone.Gain(0.9);

          this.masterInput.connect(this.masterFilter);
          this.masterFilter.connect(this.masterSaturation);
          this.masterSaturation.connect(this.masterDelay);
          this.masterDelay.connect(this.masterReverb);
          this.masterReverb.connect(this.masterLimiter);
          this.masterLimiter.connect(this.masterGain);
          this.masterGain.toDestination();

          Tone.getTransport().bpm.value = this.projectMeta.bpm;
          Tone.getTransport().timeSignature = [4, 4];

          this.isInitialized = true;
          this.applyMasterEffects();
        })();
      }

      try {
        await this.initializationPromise;
      } finally {
        this.initializationPromise = null;
      }
    }

    // Always ensure channels & scheduler exist
    this.syncSession();
  }

  /**
   * Syncs project metadata, tracks, and blocks into the engine
   */
  public updateSession(meta: ProjectMeta, tracks: Track[], blocks: MidiBlock[]): void {
    const previousMeta = this.projectMeta;
    this.projectMeta = { ...meta };
    this.tracks = [...tracks];
    this.blocks = [...blocks];

    if (this.isInitialized) {
      if (this.isPlaying) {
        const loopStartStep = (this.projectMeta.loopStartBar - 1) * 16;
        const loopEndStep = Math.min(this.projectMeta.totalBars * 16, (this.projectMeta.loopEndBar - 1) * 16);

        if (this.projectMeta.loopEnabled && (this.currentStep < loopStartStep || this.currentStep >= loopEndStep)) {
          this.seekToBar(this.projectMeta.loopStartBar);
        } else if (!this.projectMeta.loopEnabled && this.currentStep >= this.projectMeta.totalBars * 16) {
          this.stop();
        }
      } else if (previousMeta.loopEnabled !== this.projectMeta.loopEnabled && this.currentStep >= this.projectMeta.totalBars * 16) {
        this.currentStep = this.projectMeta.loopEnabled ? (this.projectMeta.loopStartBar - 1) * 16 : 0;
      }

      this.syncSession();
    }
  }

  /**
   * Builds/updates instrument channels and configures the step scheduler
   */
  private syncSession(): void {
    if (!this.isInitialized) return;

    Tone.getTransport().bpm.value = this.projectMeta.bpm;

    // Remove deleted channels
    const currentTrackIds = new Set(this.tracks.map(t => t.id));
    for (const [id, channel] of this.channels.entries()) {
      if (!currentTrackIds.has(id)) {
        channel.dispose();
        this.channels.delete(id);
      }
    }

    // Create or update track channels connected to masterInput
    for (const track of this.tracks) {
      let channel = this.channels.get(track.id);
      if (!channel || channel.type !== track.instrumentType) {
        if (channel) channel.dispose();
        channel = this.createChannelForType(track.instrumentType);
        this.channels.set(track.id, channel);
      }

      channel.volumeNode.volume.value = track.muted ? -Infinity : Tone.gainToDb(track.volume);
      channel.pannerNode.pan.value = track.pan;
      channel.setMacro('param1', track.macros.param1);
      channel.setMacro('param2', track.macros.param2);
    }

    if (this.scheduleId === null) this.setupScheduler();
  }

  private createChannelForType(type: InstrumentType): InstrumentChannel {
    switch (type) {
      case 'drums':
        return createDrumChannel(this.masterInput);
      case 'bass':
        return createBassChannel(this.masterInput);
      case 'keys':
        return createKeysChannel(this.masterInput);
      case 'lead':
        return createLeadChannel(this.masterInput);
    }
  }

  /**
   * Deterministic 16th-note step scheduler
   */
  private setupScheduler(): void {
    if (this.scheduleId !== null) {
      Tone.getTransport().clear(this.scheduleId);
      this.scheduleId = null;
    }

    this.scheduleId = Tone.getTransport().scheduleRepeat(
      (time) => {
        const step = this.currentStep;

        // 1. Play all notes matching this step
        this.playNotesAtStep(step, time);

        // 2. Dispatch UI playhead update
        const bar = Math.floor(step / 16) + 1;
        const stepInBar = step % 16;
        Tone.getDraw().schedule(() => {
          if (this.onPlayheadTick) {
            this.onPlayheadTick(bar + stepInBar / 16, stepInBar);
          }
        }, time);

        // 3. Advance step deterministically
        this.currentStep++;
        const loopStartStep = (this.projectMeta.loopStartBar - 1) * 16;
        const loopEndStep = (this.projectMeta.loopEndBar - 1) * 16;

        if (this.projectMeta.loopEnabled && this.currentStep >= loopEndStep) {
          this.currentStep = loopStartStep;
        } else if (!this.projectMeta.loopEnabled && this.currentStep >= this.projectMeta.totalBars * 16) {
          Tone.getTransport().stop(time);
          this.isPlaying = false;
          this.silenceAll();
        }
      },
      '16n',
      '0:0:0'
    );
  }

  /**
   * Plays all notes from active tracks for the given step
   */
  private playNotesAtStep(step: number, time: number): void {
    const hasSolo = this.tracks.some(t => t.soloed);
    const secondsPer16th = (60 / this.projectMeta.bpm) / 4;

    for (const track of this.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.soloed) continue;

      const channel = this.channels.get(track.id);
      if (!channel) continue;

      for (const block of this.blocks) {
        if (block.trackId !== track.id) continue;

        const blockStartStep = (block.startBar - 1) * 16;
        const blockEndStep = blockStartStep + block.durationBars * 16;

        if (step >= blockStartStep && step < blockEndStep) {
          const stepInsideBlock = step - blockStartStep;
          const notesToPlay = block.notes.filter(n => n.step === stepInsideBlock);

          for (const note of notesToPlay) {
            const gateSeconds = Math.max(0.04, Math.min(note.durationSteps * secondsPer16th * 0.85, 1.2));

            if (track.instrumentType === 'drums') {
              if (note.drumSound && channel.triggerDrum) {
                channel.triggerDrum(note.drumSound, time, note.velocity);
              }
            } else {
              let midiNote: number;
              const baseOctave = track.instrumentType === 'bass' ? 2 : (track.instrumentType === 'lead' ? 5 : 4);

              if (note.degree !== undefined) {
                midiNote = degreeToMidi(
                  note.degree,
                  note.octaveOffset || 0,
                  baseOctave,
                  this.projectMeta.rootNote,
                  this.projectMeta.scale
                );
              } else if (note.midi !== undefined) {
                midiNote = this.projectMeta.scaleLock
                  ? snapMidiToScale(note.midi, this.projectMeta.rootNote, this.projectMeta.scale)
                  : note.midi;
              } else {
                continue;
              }

              channel.triggerNote(midiToNoteName(midiNote), gateSeconds, time, note.velocity);
            }
          }
        }
      }
    }
  }

  /**
   * Live auditioning
   */
  public async auditionNote(
    trackId: string,
    rawMidi: number,
    velocity: number = 100,
    duration: number | string = 0.3
  ): Promise<void> {
    await this.init();
    const track = this.tracks.find(t => t.id === trackId);
    const channel = this.channels.get(trackId);
    if (!track || !channel) return;

    if (track.instrumentType === 'drums') {
      let drumSound: DrumSound = 'kick';
      if (rawMidi === 36 || rawMidi === 35) drumSound = 'kick';
      else if (rawMidi === 38 || rawMidi === 40) drumSound = 'snare';
      else if (rawMidi === 39) drumSound = 'clap';
      else if (rawMidi === 42 || rawMidi === 44) drumSound = 'hat_closed';
      else if (rawMidi === 46) drumSound = 'hat_open';
      else drumSound = 'perc';

      if (channel.triggerDrum) channel.triggerDrum(drumSound, undefined, velocity);
      return;
    }

    const snappedMidi = this.projectMeta.scaleLock
      ? snapMidiToScale(rawMidi, this.projectMeta.rootNote, this.projectMeta.scale)
      : rawMidi;

    channel.triggerNote(midiToNoteName(snappedMidi), duration, undefined, velocity);
  }

  public async attackMidiNote(trackId: string, rawMidi: number, velocity: number): Promise<void> {
    await this.init();
    const track = this.tracks.find(t => t.id === trackId);
    const channel = this.channels.get(trackId);
    if (!track || !channel) return;

    if (track.instrumentType === 'drums') {
      await this.auditionNote(trackId, rawMidi, velocity);
      return;
    }

    const midi = this.projectMeta.scaleLock
      ? snapMidiToScale(rawMidi, this.projectMeta.rootNote, this.projectMeta.scale)
      : rawMidi;
    const note = midiToNoteName(midi);
    if (channel.attackNote) channel.attackNote(note, undefined, velocity);
    else channel.triggerNote(note, 0.3, undefined, velocity);
  }

  public async releaseMidiNote(trackId: string, rawMidi: number): Promise<void> {
    await this.init();
    const track = this.tracks.find(t => t.id === trackId);
    const channel = this.channels.get(trackId);
    if (!track || !channel || track.instrumentType === 'drums' || !channel.releaseNote) return;

    const midi = this.projectMeta.scaleLock
      ? snapMidiToScale(rawMidi, this.projectMeta.rootNote, this.projectMeta.scale)
      : rawMidi;
    channel.releaseNote(midiToNoteName(midi));
  }

  public async auditionDrum(trackId: string, sound: DrumSound, velocity: number = 100): Promise<void> {
    await this.init();
    const channel = this.channels.get(trackId);
    if (channel && channel.triggerDrum) {
      channel.triggerDrum(sound, undefined, velocity);
    }
  }

  public async previewPattern(trackId: string, notes: Array<Omit<NoteEvent, 'id'>>): Promise<void> {
    await this.init();
    const track = this.tracks.find(item => item.id === trackId);
    const channel = this.channels.get(trackId);
    if (!track || !channel) return;

    const secondsPerStep = 60 / this.projectMeta.bpm / 4;
    const previewStart = Tone.now() + 0.08;
    const baseOctave = track.instrumentType === 'bass' ? 2 : (track.instrumentType === 'lead' ? 5 : 4);

    [...notes].sort((left, right) => left.step - right.step).forEach(note => {
      const startTime = previewStart + note.step * secondsPerStep;
      if (track.instrumentType === 'drums') {
        if (note.drumSound && channel.triggerDrum) {
          channel.triggerDrum(note.drumSound, startTime, note.velocity);
        }
        return;
      }

      let midiNote: number | undefined;
      if (note.degree !== undefined) {
        midiNote = degreeToMidi(note.degree, note.octaveOffset || 0, baseOctave, this.projectMeta.rootNote, this.projectMeta.scale);
      } else if (note.midi !== undefined) {
        midiNote = this.projectMeta.scaleLock
          ? snapMidiToScale(note.midi, this.projectMeta.rootNote, this.projectMeta.scale)
          : note.midi;
      }
      if (midiNote !== undefined) {
        const duration = Math.max(0.08, note.durationSteps * secondsPerStep * 0.85);
        channel.triggerNote(midiToNoteName(midiNote), duration, startTime, note.velocity);
      }
    });
  }

  public updateMasterEffects(fx: MasterEffects): void {
    this.masterFx = { ...fx };
    if (this.isInitialized) this.applyMasterEffects();
  }

  private applyMasterEffects(): void {
    this.masterGain.gain.value = this.masterFx.volume / 100;
    this.masterReverb.wet.value = (this.masterFx.reverb / 100) * 0.4;
    this.masterDelay.wet.value = (this.masterFx.delay / 100) * 0.3;
    this.masterSaturation.distortion = (this.masterFx.saturation / 100) * 0.25;
    const minF = Math.log(200);
    const maxF = Math.log(20000);
    const scale = (maxF - minF) / 100;
    this.masterFilter.frequency.value = Math.exp(minF + scale * this.masterFx.filterCutoff);
  }

  /**
   * Silences all active voices immediately
   */
  public silenceAll(): void {
    for (const channel of this.channels.values()) {
      channel.silenceAll();
    }
  }

  /**
   * Playback Controls
   */
  public async play(startAtTimestamp?: number): Promise<void> {
    await this.init();

    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }

    const startStep = this.projectMeta.loopEnabled ? (this.projectMeta.loopStartBar - 1) * 16 : 0;
    const endStep = this.projectMeta.loopEnabled ? (this.projectMeta.loopEndBar - 1) * 16 : this.projectMeta.totalBars * 16;

    if (this.currentStep < startStep || this.currentStep >= endStep) {
      this.currentStep = startStep;
    }

    const startTime = startAtTimestamp === undefined
      ? undefined
      : Tone.now() + Math.max(0, (startAtTimestamp - Date.now()) / 1000);
    Tone.getTransport().start(startTime);
    this.isPlaying = true;
  }

  public isReadyForRemotePlayback(): boolean {
    return this.isInitialized && Tone.context.state === 'running';
  }

  public pause(): void {
    Tone.getTransport().pause();
    this.silenceAll();
    this.isPlaying = false;
  }

  public stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = '0:0:0';
    this.currentStep = this.projectMeta.loopEnabled ? (this.projectMeta.loopStartBar - 1) * 16 : 0;
    this.silenceAll();
    this.isPlaying = false;
    if (this.onPlayheadTick) {
      this.onPlayheadTick(this.projectMeta.loopEnabled ? this.projectMeta.loopStartBar : 1, 0);
    }
  }

  public seekToBar(bar: number): void {
    const boundedBar = Math.max(1, Math.min(this.projectMeta.totalBars, bar));
    const maxStep = Math.max(0, this.projectMeta.totalBars * 16 - 1);
    this.currentStep = Math.max(0, Math.min(maxStep, Math.round((boundedBar - 1) * 16)));
    const barInTransport = Math.floor(this.currentStep / 16);
    const beatInBar = Math.floor((this.currentStep % 16) / 4);
    const sixteenthInBeat = this.currentStep % 4;
    Tone.getTransport().position = `${barInTransport}:${beatInBar}:${sixteenthInBeat}`;
    this.silenceAll();
    if (this.onPlayheadTick) {
      this.onPlayheadTick(this.currentStep / 16 + 1, this.currentStep % 16);
    }
  }

  public setPlayheadTickCallback(cb: (currentBar: number, currentStep: number) => void): void {
    this.onPlayheadTick = cb;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
