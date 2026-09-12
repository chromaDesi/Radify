import { hashString, mulberry32, seededShuffle } from "./prng";
import { dedupeAndFilterSources } from "./dedupe";
import type { MixSettings, SourcePlaylist, Track } from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Deterministically generates a mixed, ordered queue from N source
 * playlists. Same (sources, settings, length) always produces the same
 * output — this is what makes a station resumable from a bare cursor and
 * shareable via its seed. No Math.random() anywhere.
 *
 * To "extend" a station's queue, call again with a larger `length`; the
 * whole prefix is reproduced identically (recomputing a few hundred
 * entries is cheap — there is no incremental state to manage).
 */
export function generateQueue(
  sourcesInput: readonly SourcePlaylist[],
  settings: MixSettings,
  length = 200,
): Track[] {
  const sources = dedupeAndFilterSources(sourcesInput);
  if (sources.length === 0) return [];

  const weightingMode = settings.weightingMode ?? "equal";
  const baseStickiness = clamp(settings.stickiness ?? 3, 1, 4);
  const artistSpacing = settings.artistSpacing ?? 5;
  const lookahead = settings.lookahead ?? 10;

  const totalTracks = sources.reduce((sum, s) => sum + s.tracks.length, 0);
  const weights = new Map<string, number>(
    sources.map((s) => [
      s.id,
      weightingMode === "equal" ? 1 : s.tracks.length / totalTracks,
    ]),
  );

  const schedulerRng = mulberry32(hashString(`${settings.seed}:scheduler`));

  // Per-source cursor into that source's virtual infinite shuffled stream.
  const cursors = new Map<string, number>(sources.map((s) => [s.id, 0]));
  // Smooth weighted round-robin accumulator (nginx-style deficit scheduling).
  const current = new Map<string, number>(sources.map((s) => [s.id, 0]));
  // Memoized per-(source, epoch) shuffles so re-visiting an epoch is O(1).
  const shuffleCache = new Map<string, Track[]>();

  function trackAt(source: SourcePlaylist, n: number): Track {
    const size = source.tracks.length;
    const epoch = Math.floor(n / size);
    const pos = n % size;
    const cacheKey = `${source.id}:${epoch}`;
    let shuffled = shuffleCache.get(cacheKey);
    if (!shuffled) {
      const rng = mulberry32(hashString(`${settings.seed}:${source.id}:${epoch}`));
      shuffled = seededShuffle(source.tracks, rng);
      shuffleCache.set(cacheKey, shuffled);
    }
    return shuffled[pos];
  }

  function pickSource(): SourcePlaylist {
    let totalWeight = 0;
    let best: SourcePlaylist | null = null;
    let bestValue = -Infinity;
    for (const s of sources) {
      const w = weights.get(s.id)!;
      const c = (current.get(s.id) ?? 0) + w;
      current.set(s.id, c);
      totalWeight += w;
      if (c > bestValue || (c === bestValue && schedulerRng() < 0.5)) {
        bestValue = c;
        best = s;
      }
    }
    current.set(best!.id, (current.get(best!.id) ?? 0) - totalWeight);
    return best!;
  }

  const recentArtists: string[] = []; // index 0 = most recently emitted

  function isCompliant(artist: string): boolean {
    return !recentArtists.slice(0, artistSpacing).includes(artist);
  }

  function recordEmitted(track: Track) {
    recentArtists.unshift(track.artistPrimary);
    if (recentArtists.length > artistSpacing) recentArtists.length = artistSpacing;
  }

  /** Find a spacing-compliant track within `source`, without consuming it. */
  function findCompliant(source: SourcePlaylist): { track: Track; consumed: number } | null {
    const start = cursors.get(source.id)!;
    for (let attempt = 0; attempt <= lookahead; attempt++) {
      const candidate = trackAt(source, start + attempt);
      if (isCompliant(candidate.artistPrimary)) {
        return { track: candidate, consumed: attempt + 1 };
      }
    }
    return null;
  }

  /** Emit one track, preferring `preferredSource`, per the spacing/fallback rules. */
  function emitFrom(preferredSource: SourcePlaylist): Track {
    let found = findCompliant(preferredSource);
    let chosen = preferredSource;

    if (!found) {
      for (const alt of sources) {
        if (alt.id === preferredSource.id) continue;
        const altFound = findCompliant(alt);
        if (altFound) {
          found = altFound;
          chosen = alt;
          break;
        }
      }
    }

    if (!found) {
      // All sources violate spacing (e.g. a single-artist station) —
      // accept the violation from the preferred source so generation
      // still terminates.
      const start = cursors.get(preferredSource.id)!;
      const track = trackAt(preferredSource, start);
      cursors.set(preferredSource.id, start + 1);
      recordEmitted(track);
      return track;
    }

    const start = cursors.get(chosen.id)!;
    cursors.set(chosen.id, start + found.consumed);
    recordEmitted(found.track);
    return found.track;
  }

  const queue: Track[] = [];
  while (queue.length < length) {
    const source = pickSource();
    const jitter = Math.floor(schedulerRng() * 3) - 1; // -1, 0, or +1
    const runLength = clamp(baseStickiness + jitter, 1, 4);
    for (let i = 0; i < runLength && queue.length < length; i++) {
      queue.push(emitFrom(source));
    }
  }

  return queue;
}
