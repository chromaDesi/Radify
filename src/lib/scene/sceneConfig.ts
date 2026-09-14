/**
 * Single source of truth for the two-tier pixel scale and HUD dock
 * geometry. Both scale multipliers must stay multiples of 4 — that's
 * what keeps every sprite landing on a whole device pixel at the common
 * Windows display-scaling factors (125%/150%/175%), see CLAUDE.md.
 */

/** World tier: tiles, trim, props, HUD chrome. */
export const PX = 4;
/** Hero tier: the jukebox group only, so it visually dominates the frame. */
export const PX_HERO = 8;
/** Texels per side of a repeating world tile (wall/floor/wainscot). */
export const TILE = 16;

export const MIN_VIEWPORT = { width: 1280, height: 720 };

/** Jukebox group native size, in hero-tier texels — must match HW/HH in scripts/gen-scene.py. */
export const HERO_TEXELS = { width: 48, height: 64 };

/**
 * Floor-band height, in world-tier texels — how far every bottom-anchored
 * prop/hero sits above the viewport bottom. Also literally the CSS height
 * of the floor tile band in DinerScene, so props' feet land exactly on
 * the floor's top edge. Not a multiple of TILE (16); the floor pattern
 * clips mid-tile at the very bottom edge, which is imperceptible there.
 */
export const FLOOR_BAND_TEXELS = 30;

/** Reserved center-stage rect for the jukebox hero, floor-anchored. */
export const STAGE = {
  widthPx: HERO_TEXELS.width * PX_HERO, // 384
  heightPx: HERO_TEXELS.height * PX_HERO, // 512
  bottomOffsetPx: FLOOR_BAND_TEXELS * PX, // 120
};

/**
 * HUD dock geometry, in world-tier texels — the actual source of truth
 * for both the CSS calc() strings each HUD component uses and the
 * derived-px Rects below (which assume the default PX so the geometry
 * test has fixed numbers to check against).
 */
export const DOCK_TEXELS = {
  topBar: { top: 4, insetX: 4, height: 14 },
  playlistPanel: { left: 4, top: 22, width: 72 },
  transportBar: { bottom: 4, width: 140, height: 22 },
};

const DOCKS = {
  topBar: {
    top: DOCK_TEXELS.topBar.top * PX,
    insetX: DOCK_TEXELS.topBar.insetX * PX,
    height: DOCK_TEXELS.topBar.height * PX,
  },
  playlistPanel: {
    left: DOCK_TEXELS.playlistPanel.left * PX,
    top: DOCK_TEXELS.playlistPanel.top * PX,
    width: DOCK_TEXELS.playlistPanel.width * PX,
  },
  transportBar: {
    bottom: DOCK_TEXELS.transportBar.bottom * PX,
    width: DOCK_TEXELS.transportBar.width * PX,
    height: DOCK_TEXELS.transportBar.height * PX,
  },
};

export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function stageRect(viewportWidth: number, viewportHeight: number): Rect {
  const left = (viewportWidth - STAGE.widthPx) / 2;
  const bottom = viewportHeight - STAGE.bottomOffsetPx;
  const top = bottom - STAGE.heightPx;
  return { left, right: left + STAGE.widthPx, top, bottom };
}

export function topBarRect(viewportWidth: number): Rect {
  const { top, insetX, height } = DOCKS.topBar;
  return { top, bottom: top + height, left: insetX, right: viewportWidth - insetX };
}

export function playlistPanelRect(viewportHeight: number): Rect {
  const { left, top, width } = DOCKS.playlistPanel;
  const { bottom: transportTop } = transportBarRect(0, viewportHeight);
  return { top, bottom: transportTop - 4 * PX, left, right: left + width };
}

export function transportBarRect(viewportWidth: number, viewportHeight: number): Rect {
  const { bottom, width, height } = DOCKS.transportBar;
  const bottomPx = viewportHeight - bottom;
  const left = (viewportWidth - width) / 2;
  return { top: bottomPx - height, bottom: bottomPx, left, right: left + width };
}

/**
 * True when no HUD dock intersects the reserved jukebox stage at the
 * given viewport size. Exercised at the min supported size (1280x720)
 * and a large desktop size (2560x1440) in sceneConfig.test.ts.
 */
export function hudClearsStage(viewportWidth: number, viewportHeight: number): boolean {
  const stage = stageRect(viewportWidth, viewportHeight);
  const docks = [
    topBarRect(viewportWidth),
    playlistPanelRect(viewportHeight),
    transportBarRect(viewportWidth, viewportHeight),
  ];
  return docks.every((dock) => !rectsOverlap(dock, stage));
}
