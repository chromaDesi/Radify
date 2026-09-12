import type { Track } from "@/lib/mixing/types";

export interface SinkErrorInfo {
  code?: string;
  message: string;
}

export interface SinkEventMap {
  onReady: () => void;
  onEnded: () => void;
  onError: (error: SinkErrorInfo) => void;
  onProgress: (positionMs: number) => void;
}

export type SinkEvent = keyof SinkEventMap;

/**
 * A uniform surface over a platform's embedded player (Spotify Web
 * Playback SDK, YouTube IFrame API, or — for Phase 0 — a plain timer).
 * PlayerController only ever talks to this interface, never to a
 * platform SDK directly, which is what keeps a platform swappable/
 * removable without touching queue or scheduling logic.
 */
export interface PlaybackSink {
  readonly provider: Track["provider"];
  load(track: Track): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(ms: number): Promise<void>;
  setVolume(volume: number): void;
  on<K extends SinkEvent>(event: K, handler: SinkEventMap[K]): void;
  off<K extends SinkEvent>(event: K, handler: SinkEventMap[K]): void;
  /** Releases timers/listeners. Safe to call multiple times. */
  destroy(): void;
}
