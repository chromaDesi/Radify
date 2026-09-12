import type { Track } from "@/lib/mixing/types";
import type { PlaybackSink, SinkEvent, SinkEventMap } from "./PlaybackSink";

/**
 * A pure-timer PlaybackSink used in Phase 0 to build and test the whole
 * queue/skip/prev/end-detection/handoff machine before any real platform
 * SDK exists. Ticks position forward on a real interval and fires onEnded
 * exactly once per loaded track, guarded so a stray extra tick can't
 * double-fire it — the same discipline the real Spotify/YouTube sinks
 * will need against SDK echo events.
 */
export class MockSink implements PlaybackSink {
  readonly provider = "mock" as const;

  private track: Track | null = null;
  private positionMs = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private endedForTrackId: string | null = null;
  private readonly tickMs: number;

  private handlers: { [K in SinkEvent]: Set<SinkEventMap[K]> } = {
    onReady: new Set(),
    onEnded: new Set(),
    onError: new Set(),
    onProgress: new Set(),
  };

  constructor(options: { tickMs?: number } = {}) {
    this.tickMs = options.tickMs ?? 250;
  }

  on<K extends SinkEvent>(event: K, handler: SinkEventMap[K]): void {
    this.handlers[event].add(handler);
  }

  off<K extends SinkEvent>(event: K, handler: SinkEventMap[K]): void {
    this.handlers[event].delete(handler);
  }

  private emit<K extends SinkEvent>(event: K, ...args: Parameters<SinkEventMap[K]>): void {
    for (const handler of this.handlers[event]) {
      (handler as (...a: Parameters<SinkEventMap[K]>) => void)(...args);
    }
  }

  async load(track: Track): Promise<void> {
    this.stopTimer();
    this.track = track;
    this.positionMs = 0;
    this.endedForTrackId = null;
    await Promise.resolve(); // simulate async platform init
    this.emit("onReady");
  }

  async play(): Promise<void> {
    if (!this.track) return;
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  async pause(): Promise<void> {
    this.stopTimer();
  }

  async stop(): Promise<void> {
    this.stopTimer();
    this.positionMs = 0;
  }

  async seek(ms: number): Promise<void> {
    this.positionMs = ms;
  }

  setVolume(): void {
    // no-op — nothing to control on a fake sink
  }

  destroy(): void {
    this.stopTimer();
    for (const set of Object.values(this.handlers)) set.clear();
  }

  /**
   * Test-only: fires a duplicate onEnded as a real SDK sometimes does
   * (Spotify's `player_state_changed` echoing), so PlayerController's
   * latch/active-sink guards can be exercised without a real platform.
   */
  simulateDuplicateEndedEvent(): void {
    this.emit("onEnded");
  }

  private tick(): void {
    if (!this.track) return;
    this.positionMs += this.tickMs;
    this.emit("onProgress", this.positionMs);
    if (this.positionMs >= this.track.durationMs) {
      this.stopTimer();
      if (this.endedForTrackId !== this.track.id) {
        this.endedForTrackId = this.track.id;
        this.emit("onEnded");
      }
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
