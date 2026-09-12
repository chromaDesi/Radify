export type Provider = "spotify" | "youtube" | "mock";

export interface Track {
  id: string;
  provider: Provider;
  title: string;
  artistPrimary: string;
  durationMs: number;
  playable: boolean;
  /** Precomputed if known; otherwise derived via computeDedupeKey. */
  dedupeKey?: string;
}

export interface SourcePlaylist {
  id: string;
  tracks: Track[];
}

export type WeightingMode = "equal" | "proportional";

export interface MixSettings {
  seed: string;
  weightingMode?: WeightingMode;
  /** Base run length per source before the scheduler picks again (clamped 1-4). Default 3. */
  stickiness?: number;
  /** How many recently-emitted tracks must not share an artist. Default 5. */
  artistSpacing?: number;
  /** How far to look ahead within a source for an artist-spacing-compliant track. Default 10. */
  lookahead?: number;
}
