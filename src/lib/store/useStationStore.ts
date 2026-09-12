"use client";

import { create } from "zustand";
import { generateQueue } from "@/lib/mixing/generateQueue";
import type { WeightingMode, Track } from "@/lib/mixing/types";
import { PlayerController, type PlaybackState } from "@/lib/playback/PlayerController";
import { MockSink } from "@/lib/playback/MockSink";
import { MOCK_PLAYLISTS } from "@/lib/mockData";

// Module-level singletons: one sink/controller per browser tab, created
// once on first import. Real platform sinks (Spotify/YouTube) join the
// `sinks` map in a later phase — the controller doesn't change.
const mockSink = new MockSink({ tickMs: 250 });
const controller = new PlayerController({ sinks: { mock: mockSink } });

interface StationStoreState {
  selectedIds: string[];
  seed: string;
  weightingMode: WeightingMode;
  stickiness: number;
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  playbackState: PlaybackState;
  positionMs: number;
  started: boolean;
  lastSkipped: { title: string; reason: string } | null;

  toggleSource: (id: string) => void;
  setWeightingMode: (mode: WeightingMode) => void;
  drop: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skip: () => Promise<void>;
  prev: () => Promise<void>;
}

function buildQueue(
  selectedIds: string[],
  seed: string,
  weightingMode: WeightingMode,
  stickiness: number,
): Track[] {
  const sources = MOCK_PLAYLISTS.filter((p) => selectedIds.includes(p.id)).map((p) => ({
    id: p.id,
    tracks: p.tracks,
  }));
  if (sources.length === 0) return [];
  return generateQueue(sources, { seed, weightingMode, stickiness }, 60);
}

export const useStationStore = create<StationStoreState>((set, get) => {
  controller.on("onTrackChange", (track, index) => {
    set({ currentTrack: track, currentIndex: index, positionMs: 0 });
  });
  controller.on("onStateChange", (state) => set({ playbackState: state }));
  controller.on("onProgress", (positionMs) => set({ positionMs }));
  controller.on("onQueueEnd", () => set({ started: false }));
  controller.on("onTrackSkipped", (track, reason) => {
    set({ lastSkipped: { title: track.title, reason } });
  });

  return {
    selectedIds: MOCK_PLAYLISTS.slice(0, 2).map((p) => p.id),
    seed: "radify-demo",
    weightingMode: "equal",
    stickiness: 3,
    queue: [],
    currentIndex: -1,
    currentTrack: null,
    playbackState: "idle",
    positionMs: 0,
    started: false,
    lastSkipped: null,

    toggleSource: (id) => {
      const { selectedIds } = get();
      set({
        selectedIds: selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id],
      });
    },

    setWeightingMode: (mode) => set({ weightingMode: mode }),

    drop: async () => {
      const { selectedIds, seed, weightingMode, stickiness } = get();
      const queue = buildQueue(selectedIds, seed, weightingMode, stickiness);
      controller.setQueue(queue);
      set({ queue, started: queue.length > 0 });
      if (queue.length > 0) await controller.start();
    },

    togglePlayPause: async () => {
      if (get().playbackState === "playing") {
        await controller.pause();
      } else {
        await controller.resume();
      }
    },

    skip: async () => controller.skip(),
    prev: async () => controller.prev(),
  };
});
