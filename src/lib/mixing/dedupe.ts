import type { SourcePlaylist, Track } from "./types";

/**
 * Normalizes a title/artist pair into a stable key so the same song from
 * two different platforms (e.g. a Spotify copy and a YouTube upload) is
 * recognized as one track rather than played twice back to back.
 */
export function computeDedupeKey(track: Pick<Track, "title" | "artistPrimary">): string {
  const strip = (s: string) =>
    s
      .toLowerCase()
      .replace(/\(feat\.[^)]*\)/g, "")
      .replace(/\(official\s+(video|audio)\)/g, "")
      .replace(/-\s*remaster(ed)?\s*\d{0,4}/g, "")
      .replace(/\[[^\]]*lyrics[^\]]*\]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return `${strip(track.artistPrimary)}::${strip(track.title)}`;
}

/**
 * Filters out unplayable tracks and collapses cross-platform duplicates
 * (same song via Spotify and YouTube) down to a single preferred copy —
 * Spotify wins on collision (cleaner metadata, no embed restrictions).
 * Returns new source lists; never mutates the input.
 */
export function dedupeAndFilterSources(sources: readonly SourcePlaylist[]): SourcePlaylist[] {
  const bestByKey = new Map<string, Track>();

  for (const source of sources) {
    for (const track of source.tracks) {
      if (!track.playable) continue;
      const key = track.dedupeKey ?? computeDedupeKey(track);
      const existing = bestByKey.get(key);
      if (!existing || (existing.provider !== "spotify" && track.provider === "spotify")) {
        bestByKey.set(key, track);
      }
    }
  }

  const keepIds = new Set([...bestByKey.values()].map((t) => t.id));

  return sources
    .map((source) => ({
      id: source.id,
      tracks: source.tracks.filter((t) => t.playable && keepIds.has(t.id)),
    }))
    .filter((source) => source.tracks.length > 0);
}
