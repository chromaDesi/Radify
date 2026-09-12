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

/** Jukebox group native size, in hero-tier texels. */
const HERO_TEXELS = { width: 48, height: 64 };

/** Reserved center-stage rect for the jukebox hero, floor-anchored. */
export const STAGE = {
  widthPx: HERO_TEXELS.width * PX_HERO, // 384
  heightPx: HERO_TEXELS.height * PX_HERO, // 512
  /** Clearance between the jukebox's feet and the floor/viewport bottom. */
  bottomOffsetPx: 30 * PX, // 120
};

/** HUD dock geometry, in CSS px (texels * PX), matching the Tailwind classes on each component. */
export const DOCKS = {
  topBar: { top: 4 * PX, insetX: 4 * PX, height: 14 * PX },
  playlistPanel: { left: 4 * PX, top: 22 * PX, width: 72 * PX },
  transportBar: { bottom: 4 * PX, width: 140 * PX, height: 22 * PX },
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
