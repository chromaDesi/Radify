import type { Provider, Track } from "@/lib/mixing/types";
import type { PlaybackSink } from "./PlaybackSink";

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "ended";

export interface ControllerEventMap {
  onStateChange: (state: PlaybackState) => void;
  onTrackChange: (track: Track | null, index: number) => void;
  onProgress: (positionMs: number) => void;
  onQueueEnd: () => void;
  onTrackSkipped: (track: Track, reason: "no-sink" | "unplayable" | "error") => void;
}

type ControllerEvent = keyof ControllerEventMap;

export interface PlayerControllerOptions {
  /** One sink per provider the queue might contain. Construct and keep these
   * alive from the very start (see "Drop the needle" note on `start`) —
   * PlayerController never constructs or destroys sinks itself. */
  sinks: Partial<Record<Provider, PlaybackSink>>;
}

/**
 * Owns the queue, the cursor, and playback state. Sinks are interchangeable
 * behind PlaybackSink — this class never talks to a platform SDK directly,
 * which is what keeps a platform swappable/removable in one file.
 *
 * Safety rails baked in here (see the build plan, "Playback orchestration"):
 * - every sink's onEnded is guarded by a per-slot latch, so an echo event
 *   from the underlying SDK can't cause a double-skip
 * - a load/play error or a missing sink for a track's provider is treated
 *   as a skip, never a thrown crash
 * - onEnded/onError from a sink that is no longer the active one (e.g. a
 *   stray event arriving after the user already skipped) are ignored
 */
export class PlayerController {
  private readonly sinks: Partial<Record<Provider, PlaybackSink>>;
  private queue: Track[] = [];
  private index = -1;
  private state: PlaybackState = "idle";
  private endedLatch: string | null = null;

  private listeners: { [K in ControllerEvent]: Set<ControllerEventMap[K]> } = {
    onStateChange: new Set(),
    onTrackChange: new Set(),
    onProgress: new Set(),
    onQueueEnd: new Set(),
    onTrackSkipped: new Set(),
  };

  constructor(options: PlayerControllerOptions) {
    this.sinks = options.sinks;
    for (const [provider, sink] of Object.entries(this.sinks) as [Provider, PlaybackSink][]) {
      sink.on("onEnded", () => this.handleSinkEnded(provider, sink));
      sink.on("onError", () => this.handleSinkError(provider, sink));
      sink.on("onProgress", (positionMs) => {
        if (this.isActiveSink(provider, sink)) this.emit("onProgress", positionMs);
      });
    }
  }

  on<K extends ControllerEvent>(event: K, handler: ControllerEventMap[K]): void {
    this.listeners[event].add(handler);
  }

  off<K extends ControllerEvent>(event: K, handler: ControllerEventMap[K]): void {
    this.listeners[event].delete(handler);
  }

  private emit<K extends ControllerEvent>(
    event: K,
    ...args: Parameters<ControllerEventMap[K]>
  ): void {
    for (const handler of this.listeners[event]) {
      (handler as (...a: Parameters<ControllerEventMap[K]>) => void)(...args);
    }
  }

  get currentTrack(): Track | null {
    return this.queue[this.index] ?? null;
  }

  get currentIndex(): number {
    return this.index;
  }

  get playbackState(): PlaybackState {
    return this.state;
  }

  setQueue(tracks: Track[]): void {
    this.queue = tracks;
  }

  /**
   * Begins playback at the head of the queue. Must be called from a user
   * gesture handler ("Drop the needle") — browser autoplay policy silently
   * refuses to init a real platform sink otherwise, and this is also where
   * both sinks should already have been constructed and sitting idle.
   */
  async start(): Promise<void> {
    this.index = 0;
    await this.loadAndPlayCurrent();
  }

  async pause(): Promise<void> {
    const sink = this.activeSink();
    if (!sink) return;
    await sink.pause();
    this.setState("paused");
  }

  async resume(): Promise<void> {
    const sink = this.activeSink();
    if (!sink) return;
    await sink.play();
    this.setState("playing");
  }

  async skip(): Promise<void> {
    await this.advance(1);
  }

  async prev(): Promise<void> {
    if (this.index <= 0) return;
    await this.advance(-1);
  }

  setVolume(volume: number): void {
    for (const sink of Object.values(this.sinks)) sink?.setVolume(volume);
  }

  destroy(): void {
    for (const sink of Object.values(this.sinks)) sink?.destroy();
    for (const set of Object.values(this.listeners)) set.clear();
  }

  private activeSink(): PlaybackSink | undefined {
    const track = this.currentTrack;
    return track ? this.sinks[track.provider] : undefined;
  }

  private isActiveSink(provider: Provider, sink: PlaybackSink): boolean {
    const track = this.currentTrack;
    return !!track && track.provider === provider && this.sinks[provider] === sink;
  }

  private slotKey(): string {
    return `${this.index}:${this.currentTrack?.id ?? ""}`;
  }

  private setState(state: PlaybackState): void {
    this.state = state;
    this.emit("onStateChange", state);
  }

  private async advance(delta: number): Promise<void> {
    const nextIndex = this.index + delta;
    if (nextIndex < 0) return;
    if (nextIndex >= this.queue.length) {
      this.setState("ended");
      this.emit("onQueueEnd");
      return;
    }
    this.index = nextIndex;
    await this.loadAndPlayCurrent();
  }

  private async loadAndPlayCurrent(): Promise<void> {
    const track = this.currentTrack;
    if (!track) {
      this.setState("ended");
      this.emit("onQueueEnd");
      return;
    }

    const sink = this.sinks[track.provider];
    if (!sink) {
      this.emit("onTrackSkipped", track, "no-sink");
      await this.advance(1);
      return;
    }
    if (!track.playable) {
      this.emit("onTrackSkipped", track, "unplayable");
      await this.advance(1);
      return;
    }

    this.setState("loading");
    this.endedLatch = null;

    try {
      await sink.load(track);
      await sink.play();
    } catch {
      this.emit("onTrackSkipped", track, "error");
      await this.advance(1);
      return;
    }

    this.setState("playing");
    this.emit("onTrackChange", track, this.index);
  }

  private handleSinkEnded(provider: Provider, sink: PlaybackSink): void {
    if (!this.isActiveSink(provider, sink)) return;
    const key = this.slotKey();
    if (this.endedLatch === key) return;
    this.endedLatch = key;
    void this.advance(1);
  }

  private handleSinkError(provider: Provider, sink: PlaybackSink): void {
    if (!this.isActiveSink(provider, sink)) return;
    const track = this.currentTrack;
    if (track) this.emit("onTrackSkipped", track, "error");
    void this.advance(1);
  }
}
