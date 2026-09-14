import { FLOOR_BAND_TEXELS, HERO_TEXELS } from "@/lib/scene/sceneConfig";
import { SceneSprite } from "./SceneSprite";
import { Tonearm, VinylRecord } from "./JukeboxMechanism";

const WAINSCOT_TEXELS = 32; // 2 tiles tall
const RAIL_TEXELS = 6;
const BASEBOARD_TEXELS = 4;

const WINDOW_TEXELS = { width: 56, height: 88 };
const BOOTH_TEXELS = { width: 56, height: 48 };

const floorBand = `calc(${FLOOR_BAND_TEXELS} * var(--px))`;

/**
 * The full-bleed diner background: tiled wall/wainscot/floor bands fill
 * any viewport with zero stretching, while props and the jukebox hero
 * are fixed-size sprites anchored to the floor line from the bottom.
 * Stays a server component — see JukeboxMechanism for the only
 * client-rendered (animated, playback-aware) piece.
 */
export function DinerScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-wood-dark">
      {/* world tile bands */}
      <div className="absolute inset-0 flex flex-col">
        <div className="tile-wall flex-1" />
        <div className="trim-rail" style={{ height: `calc(${RAIL_TEXELS} * var(--px))` }} />
        <div
          className="tile-wainscot"
          style={{ height: `calc(${WAINSCOT_TEXELS} * var(--px))` }}
        />
        <div
          className="trim-baseboard"
          style={{ height: `calc(${BASEBOARD_TEXELS} * var(--px))` }}
        />
        <div className="tile-floor" style={{ height: floorBand }} />
      </div>

      <div className="scene-vignette pointer-events-none absolute inset-0" />

      {/* props, bottom-anchored to the floor line */}
      <SceneSprite
        src="/scene/window-group.png"
        texelWidth={WINDOW_TEXELS.width}
        texelHeight={WINDOW_TEXELS.height}
        priority
        className="absolute"
        style={{ left: "10%", bottom: floorBand }}
      />
      <SceneSprite
        src="/scene/booth.png"
        texelWidth={BOOTH_TEXELS.width}
        texelHeight={BOOTH_TEXELS.height}
        className="absolute"
        style={{ left: "calc(4 * var(--px))", bottom: floorBand }}
      />

      {/* jukebox hero group, centered, bottom-anchored */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: floorBand,
          width: `calc(${HERO_TEXELS.width} * var(--px-hero))`,
          height: `calc(${HERO_TEXELS.height} * var(--px-hero))`,
        }}
      >
        <SceneSprite
          src="/scene/jukebox-back.png"
          texelWidth={HERO_TEXELS.width}
          texelHeight={HERO_TEXELS.height}
          hero
          priority
          className="absolute inset-0"
        />

        <VinylRecord />

        <SceneSprite
          src="/scene/jukebox-front.png"
          texelWidth={HERO_TEXELS.width}
          texelHeight={HERO_TEXELS.height}
          hero
          priority
          className="absolute inset-0"
        />

        <Tonearm />

        <SceneSprite
          src="/scene/jukebox-glow.png"
          texelWidth={HERO_TEXELS.width}
          texelHeight={HERO_TEXELS.height}
          hero
          className="absolute inset-0 animate-glow-flicker"
        />
      </div>

      <div className="tile-dust animate-dust-drift pointer-events-none absolute inset-0" />
    </div>
  );
}
