import type { Provider, SourcePlaylist, Track } from "./types";

export function makeTrack(
  id: string,
  artistPrimary: string,
  overrides: Partial<Track> = {},
): Track {
  return {
    id,
    provider: (overrides.provider ?? "mock") as Provider,
    title: overrides.title ?? `Song ${id}`,
    artistPrimary,
    durationMs: overrides.durationMs ?? 180_000,
    playable: overrides.playable ?? true,
    dedupeKey: overrides.dedupeKey,
  };
}

/** A source with `count` tracks, each by a distinct artist (artist-<sourceId>-<n>). */
export function makeSource(id: string, count: number): SourcePlaylist {
  const tracks: Track[] = [];
  for (let i = 0; i < count; i++) {
    tracks.push(makeTrack(`${id}-t${i}`, `artist-${id}-${i}`, { provider: "mock" }));
  }
  return { id, tracks };
}
