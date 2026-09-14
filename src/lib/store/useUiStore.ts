"use client";

import { create } from "zustand";

export type PixelScale = 4 | 8 | 12;

interface UiStoreState {
  settingsOpen: boolean;
  pixelScale: PixelScale;
  openSettings: () => void;
  closeSettings: () => void;
  setPixelScale: (scale: PixelScale) => void;
}

function applyPixelScale(scale: PixelScale): void {
  if (typeof document === "undefined") return;
  // Hero tier stays 2x the world tier at every scale, matching the
  // default 4px/8px pair.
  document.documentElement.style.setProperty("--px", `${scale}px`);
  document.documentElement.style.setProperty("--px-hero", `${scale * 2}px`);
}

/**
 * UI chrome state — kept separate from useStationStore, which owns the
 * playback/mixing singletons and shouldn't grow settings-panel state.
 */
export const useUiStore = create<UiStoreState>((set) => ({
  settingsOpen: false,
  pixelScale: 4,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  setPixelScale: (scale) => {
    applyPixelScale(scale);
    set({ pixelScale: scale });
  },
}));
