import type { SourcePlaylist } from "./mixing/types";

export interface MockPlaylist extends SourcePlaylist {
  name: string;
}

/**
 * Fictional placeholder catalogue for Phase 0 — no auth, no real
 * platform data yet. Titles/artists are invented, not real songs.
 * Durations are compressed to ~5-7s (not real song lengths) so the demo
 * actually cycles through several tracks quickly.
 */
export const MOCK_PLAYLISTS: MockPlaylist[] = [
  {
    id: "diner-favorites",
    name: "Diner Favorites",
    tracks: [
      { id: "df-1", provider: "mock", title: "Sunset Boulevard", artistPrimary: "The Amber Combo", durationMs: 6000, playable: true },
      { id: "df-2", provider: "mock", title: "Coffee at Midnight", artistPrimary: "The Amber Combo", durationMs: 5500, playable: true },
      { id: "df-3", provider: "mock", title: "Neon Booth", artistPrimary: "Ruby & The Regulars", durationMs: 7000, playable: true },
      { id: "df-4", provider: "mock", title: "Two Cream One Sugar", artistPrimary: "Ruby & The Regulars", durationMs: 6200, playable: true },
      { id: "df-5", provider: "mock", title: "Jukebox Heart", artistPrimary: "Wallace Pinelow", durationMs: 5800, playable: true },
      { id: "df-6", provider: "mock", title: "Grease and Gold", artistPrimary: "Wallace Pinelow", durationMs: 6400, playable: true },
      { id: "df-7", provider: "mock", title: "Last Booth on the Left", artistPrimary: "The Formica Kings", durationMs: 5200, playable: true },
      { id: "df-8", provider: "mock", title: "Milkshake Shuffle", artistPrimary: "The Formica Kings", durationMs: 6800, playable: true },
    ],
  },
  {
    id: "sunday-drive",
    name: "Sunday Drive",
    tracks: [
      { id: "sd-1", provider: "mock", title: "Backroads", artistPrimary: "Marigold Station", durationMs: 6600, playable: true },
      { id: "sd-2", provider: "mock", title: "Windows Down", artistPrimary: "Marigold Station", durationMs: 5900, playable: true },
      { id: "sd-3", provider: "mock", title: "AM Gold", artistPrimary: "Casey & The Overpass", durationMs: 6100, playable: true },
      { id: "sd-4", provider: "mock", title: "Gravel Road Waltz", artistPrimary: "Casey & The Overpass", durationMs: 7200, playable: true },
      { id: "sd-5", provider: "mock", title: "Amber Fields", artistPrimary: "The Slow Fade", durationMs: 5400, playable: true },
      { id: "sd-6", provider: "mock", title: "Two Lane Highway", artistPrimary: "The Slow Fade", durationMs: 6300, playable: true },
      { id: "sd-7", provider: "mock", title: "Radio Static Love", artistPrimary: "Honeydew Sun", durationMs: 5700, playable: true },
    ],
  },
  {
    id: "late-night-vinyl",
    name: "Late Night Vinyl",
    tracks: [
      { id: "lnv-1", provider: "mock", title: "After Hours Glow", artistPrimary: "Velvet Static", durationMs: 7100, playable: true },
      { id: "lnv-2", provider: "mock", title: "Smoke and Vinyl", artistPrimary: "Velvet Static", durationMs: 6900, playable: true },
      { id: "lnv-3", provider: "mock", title: "Quiet Hour", artistPrimary: "Delta Nightlight", durationMs: 6400, playable: true },
      { id: "lnv-4", provider: "mock", title: "Turntable Blues", artistPrimary: "Delta Nightlight", durationMs: 5600, playable: true },
      { id: "lnv-5", provider: "mock", title: "Warm Static", artistPrimary: "Paper Moon Radio", durationMs: 6000, playable: true },
      { id: "lnv-6", provider: "mock", title: "Last Call Lullaby", artistPrimary: "Paper Moon Radio", durationMs: 7300, playable: true },
    ],
  },
  {
    id: "counter-classics",
    name: "Counter Classics",
    tracks: [
      { id: "cc-1", provider: "mock", title: "Nickel in the Slot", artistPrimary: "The Formica Kings", durationMs: 5300, playable: true },
      { id: "cc-2", provider: "mock", title: "Blue Plate Special", artistPrimary: "Ruby & The Regulars", durationMs: 6700, playable: true },
      { id: "cc-3", provider: "mock", title: "Griddle Song", artistPrimary: "Wallace Pinelow", durationMs: 5900, playable: true },
      { id: "cc-4", provider: "mock", title: "Pie Under Glass", artistPrimary: "Honeydew Sun", durationMs: 6200, playable: true },
      { id: "cc-5", provider: "mock", title: "Chrome and Sugar", artistPrimary: "Marigold Station", durationMs: 5500, playable: true },
    ],
  },
];
