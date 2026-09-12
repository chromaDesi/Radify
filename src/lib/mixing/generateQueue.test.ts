import { describe, expect, it } from "vitest";
import { generateQueue } from "./generateQueue";
import { computeDedupeKey } from "./dedupe";
import { makeSource, makeTrack } from "./testHelpers";

describe("generateQueue: determinism", () => {
  it("produces an identical queue for the same seed and inputs", () => {
    const sources = [makeSource("a", 12), makeSource("b", 12)];
    const settings = { seed: "same-seed" };

    const q1 = generateQueue(sources, settings, 60);
    const q2 = generateQueue(sources, settings, 60);

    expect(q1.map((t) => t.id)).toEqual(q2.map((t) => t.id));
  });

  it("produces a different queue for a different seed", () => {
    const sources = [makeSource("a", 12), makeSource("b", 12)];

    const q1 = generateQueue(sources, { seed: "seed-one" }, 60);
    const q2 = generateQueue(sources, { seed: "seed-two" }, 60);

    expect(q1.map((t) => t.id)).not.toEqual(q2.map((t) => t.id));
  });

  it("extending the length reproduces the original prefix exactly", () => {
    const sources = [makeSource("a", 12), makeSource("b", 12)];
    const settings = { seed: "extend-me" };

    const short = generateQueue(sources, settings, 40);
    const long = generateQueue(sources, settings, 100);

    expect(long.slice(0, 40).map((t) => t.id)).toEqual(short.map((t) => t.id));
  });
});

describe("generateQueue: weighting", () => {
  it("equal mode gives a small source roughly the same share as a big one", () => {
    const sources = [makeSource("small", 5), makeSource("big", 50)];
    const queue = generateQueue(sources, { seed: "weights-equal" }, 400);

    const smallCount = queue.filter((t) => t.id.startsWith("small-")).length;
    const bigCount = queue.filter((t) => t.id.startsWith("big-")).length;

    // Equal weighting: roughly 50/50 regardless of source size.
    expect(smallCount / queue.length).toBeGreaterThan(0.35);
    expect(bigCount / queue.length).toBeGreaterThan(0.35);
  });

  it("proportional mode skews toward the bigger source", () => {
    const sources = [makeSource("small", 5), makeSource("big", 50)];
    const queue = generateQueue(
      sources,
      { seed: "weights-prop", weightingMode: "proportional" },
      400,
    );

    const smallCount = queue.filter((t) => t.id.startsWith("small-")).length;
    const bigCount = queue.filter((t) => t.id.startsWith("big-")).length;

    expect(bigCount).toBeGreaterThan(smallCount * 3);
  });
});

describe("generateQueue: stickiness", () => {
  it("emits multi-track runs per source rather than strict alternation", () => {
    const sources = [makeSource("a", 30), makeSource("b", 30)];
    const queue = generateQueue(sources, { seed: "runs", stickiness: 3 }, 200);

    const sourceSeq = queue.map((t) => t.id.split("-")[0]);
    const runLengths: number[] = [];
    let runLen = 1;
    for (let i = 1; i < sourceSeq.length; i++) {
      if (sourceSeq[i] === sourceSeq[i - 1]) {
        runLen++;
      } else {
        runLengths.push(runLen);
        runLen = 1;
      }
    }
    runLengths.push(runLen);

    const avgRun = runLengths.reduce((a, b) => a + b, 0) / runLengths.length;
    // With stickiness 3 (jittered -1/0/+1), average run length should sit
    // well above 1 (pure alternation) — this is the whole point of runs.
    expect(avgRun).toBeGreaterThan(1.8);
  });
});

describe("generateQueue: artist spacing", () => {
  it("does not repeat an artist within the configured spacing window", () => {
    // One source, many distinct artists — plenty of room to respect spacing.
    const sources = [makeSource("a", 40)];
    const queue = generateQueue(sources, { seed: "spacing", artistSpacing: 5 }, 100);

    for (let i = 5; i < queue.length; i++) {
      const recent = queue.slice(i - 5, i).map((t) => t.artistPrimary);
      expect(recent).not.toContain(queue[i].artistPrimary);
    }
  });

  it("terminates (accepting violations) when spacing is impossible", () => {
    // A single artist across the whole source — spacing cannot be honored.
    const tracks = Array.from({ length: 10 }, (_, i) =>
      makeTrack(`solo-${i}`, "only-artist"),
    );
    const sources = [{ id: "solo", tracks }];

    const queue = generateQueue(sources, { seed: "impossible-spacing" }, 30);
    expect(queue).toHaveLength(30);
    expect(queue.every((t) => t.artistPrimary === "only-artist")).toBe(true);
  });
});

describe("generateQueue: cross-platform dedupe", () => {
  it("collapses the same song from two providers into one, preferring Spotify", () => {
    const spotifyCopy = makeTrack("sp-1", "Artist X", {
      title: "Great Song",
      provider: "spotify",
    });
    const youtubeCopy = makeTrack("yt-1", "Artist X", {
      title: "Great Song (Official Video)",
      provider: "youtube",
    });

    expect(computeDedupeKey(spotifyCopy)).toEqual(computeDedupeKey(youtubeCopy));

    const sources = [
      { id: "spotify-src", tracks: [spotifyCopy, ...makeSource("sp-filler", 10).tracks] },
      { id: "youtube-src", tracks: [youtubeCopy, ...makeSource("yt-filler", 10).tracks] },
    ];

    const queue = generateQueue(sources, { seed: "dedupe" }, 200);

    // The YouTube duplicate must never surface — it's fully collapsed into
    // the Spotify copy, however many times the small source pool recycles.
    expect(queue.some((t) => t.id === "yt-1")).toBe(false);
    expect(queue.some((t) => t.id === "sp-1")).toBe(true);
  });
});

describe("generateQueue: unplayable filtering", () => {
  it("never emits a track marked unplayable", () => {
    const source = makeSource("a", 10);
    source.tracks[3] = { ...source.tracks[3], playable: false };

    const queue = generateQueue([source], { seed: "unplayable" }, 50);
    expect(queue.some((t) => t.id === "a-t3")).toBe(false);
  });
});

describe("generateQueue: source recycling", () => {
  it("keeps producing tracks past a small source's length without crashing", () => {
    const sources = [makeSource("tiny", 4)];
    const queue = generateQueue(sources, { seed: "recycle" }, 50);
    expect(queue).toHaveLength(50);
  });

  it("reshuffles on each recycle instead of repeating the exact same order", () => {
    const sources = [makeSource("tiny", 6)];
    // Disable artist spacing here so the test isolates reshuffle behavior —
    // with spacing on, 6 tracks is small enough that spacing itself forces
    // a near-fixed order regardless of the underlying shuffle.
    const queue = generateQueue(sources, { seed: "recycle-order", artistSpacing: 0 }, 24);

    const firstPass = queue.slice(0, 6).map((t) => t.id);
    const secondPass = queue.slice(6, 12).map((t) => t.id);

    expect(secondPass).not.toEqual(firstPass);
    // still the same six tracks, just reordered
    expect([...secondPass].sort()).toEqual([...firstPass].sort());
  });
});

describe("generateQueue: edge cases", () => {
  it("returns an empty queue when there are no sources", () => {
    expect(generateQueue([], { seed: "empty" }, 10)).toEqual([]);
  });

  it("returns an empty queue when every track is unplayable", () => {
    const source = makeSource("a", 5);
    source.tracks.forEach((t) => (t.playable = false));
    expect(generateQueue([source], { seed: "all-unplayable" }, 10)).toEqual([]);
  });
});
