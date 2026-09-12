import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerController } from "./PlayerController";
import { MockSink } from "./MockSink";
import type { Track } from "@/lib/mixing/types";

function makeTrack(id: string, durationMs = 1000, playable = true): Track {
  return {
    id,
    provider: "mock",
    title: id,
    artistPrimary: "artist",
    durationMs,
    playable,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PlayerController + MockSink", () => {
  it("plays through a queue end to end, advancing on natural track end", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([makeTrack("a", 300), makeTrack("b", 300), makeTrack("c", 300)]);

    const trackChanges: string[] = [];
    controller.on("onTrackChange", (t) => trackChanges.push(t!.id));

    await controller.start();
    expect(controller.currentTrack?.id).toBe("a");

    await vi.advanceTimersByTimeAsync(300); // "a" ends -> auto-advance to "b"
    expect(controller.currentTrack?.id).toBe("b");

    await vi.advanceTimersByTimeAsync(300); // "b" ends -> auto-advance to "c"
    expect(controller.currentTrack?.id).toBe("c");

    expect(trackChanges).toEqual(["a", "b", "c"]);
  });

  it("emits onQueueEnd after the last track finishes", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([makeTrack("only", 200)]);

    let ended = false;
    controller.on("onQueueEnd", () => (ended = true));

    await controller.start();
    await vi.advanceTimersByTimeAsync(200);

    expect(ended).toBe(true);
    expect(controller.playbackState).toBe("ended");
  });

  it("skip() and prev() move the cursor without waiting for natural end", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([makeTrack("a", 1000), makeTrack("b", 1000), makeTrack("c", 1000)]);

    await controller.start();
    await controller.skip();
    expect(controller.currentTrack?.id).toBe("b");

    await controller.prev();
    expect(controller.currentTrack?.id).toBe("a");

    // prev() at the head of the queue is a no-op, not an error
    await controller.prev();
    expect(controller.currentTrack?.id).toBe("a");
  });

  it("auto-skips a track marked unplayable", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([
      makeTrack("a", 300),
      makeTrack("bad", 300, false),
      makeTrack("c", 300),
    ]);

    const skipped: string[] = [];
    controller.on("onTrackSkipped", (t) => skipped.push(t.id));

    await controller.start();
    expect(controller.currentTrack?.id).toBe("a");

    await vi.advanceTimersByTimeAsync(300); // "a" ends -> "bad" is skipped automatically -> "c"
    expect(controller.currentTrack?.id).toBe("c");
    expect(skipped).toEqual(["bad"]);
  });

  it("auto-skips a track whose provider has no registered sink", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    const spotifyTrack: Track = {
      id: "no-sink",
      provider: "spotify",
      title: "x",
      artistPrimary: "y",
      durationMs: 1000,
      playable: true,
    };
    controller.setQueue([spotifyTrack, makeTrack("a", 300)]);

    const skipped: string[] = [];
    controller.on("onTrackSkipped", (t) => skipped.push(t.id));

    await controller.start();

    expect(skipped).toEqual(["no-sink"]);
    expect(controller.currentTrack?.id).toBe("a");
  });

  it("does not double-advance on a duplicate/echo onEnded from the same slot", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([makeTrack("a", 300), makeTrack("b", 300)]);

    const trackChanges: string[] = [];
    controller.on("onTrackChange", (t) => trackChanges.push(t!.id));

    await controller.start();
    await vi.advanceTimersByTimeAsync(300); // natural end -> advance to "b"

    // Simulate an SDK echo: the same sink instance fires onEnded again
    // for what is now a stale slot. The active-sink/latch guard must
    // absorb this without skipping straight to a third track.
    sink.simulateDuplicateEndedEvent();
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.currentTrack?.id).toBe("b");
    expect(trackChanges).toEqual(["a", "b"]);
  });

  it("pause() stops progress and resume() continues it", async () => {
    const sink = new MockSink({ tickMs: 100 });
    const controller = new PlayerController({ sinks: { mock: sink } });
    controller.setQueue([makeTrack("a", 1000)]);

    const progress: number[] = [];
    controller.on("onProgress", (p) => progress.push(p));

    await controller.start();
    await vi.advanceTimersByTimeAsync(200);
    await controller.pause();
    expect(controller.playbackState).toBe("paused");

    const afterPause = progress.length;
    await vi.advanceTimersByTimeAsync(500); // no timer running — no new progress
    expect(progress.length).toBe(afterPause);

    await controller.resume();
    expect(controller.playbackState).toBe("playing");
    await vi.advanceTimersByTimeAsync(200);
    expect(progress.length).toBeGreaterThan(afterPause);
  });
});
