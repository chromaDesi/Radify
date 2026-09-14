"use client";

import { create } from "zustand";

export type PixelScale = 4 | 8 | 12;
export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "radify-theme";

interface UiStoreState {
  settingsOpen: boolean;
  pixelScale: PixelScale;
  theme: Theme;
  openSettings: () => void;
  closeSettings: () => void;
  setPixelScale: (scale: PixelScale) => void;
  setTheme: (theme: Theme) => void;
}

function applyPixelScale(scale: PixelScale): void {
  if (typeof document === "undefined") return;
  // Hero tier stays 2x the world tier at every scale, matching the
  // default 4px/8px pair.
  document.documentElement.style.setProperty("--px", `${scale}px`);
  document.documentElement.style.setProperty("--px-hero", `${scale * 2}px`);
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

function readInitialTheme(): Theme {
  if (typeof localStorage === "undefined") return "light";
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

const initialTheme = readInitialTheme();
applyTheme(initialTheme);

/**
 * UI chrome state — kept separate from useStationStore, which owns the
 * playback/mixing singletons and shouldn't grow settings-panel state.
 */
export const useUiStore = create<UiStoreState>((set) => ({
  settingsOpen: false,
  pixelScale: 4,
  theme: initialTheme,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  setPixelScale: (scale) => {
    applyPixelScale(scale);
    set({ pixelScale: scale });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },
}));
