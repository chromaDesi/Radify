"use client";

import type { CSSProperties } from "react";
import { useStationStore } from "@/lib/store/useStationStore";
import { deriveSceneState } from "@/lib/scene/sceneState";
import { useNeedlePhase } from "./useNeedlePhase";

// Native offsets within the jukebox's 48x64 texel space — found
// empirically in scripts/gen-scene.py's preview compositor, must match
// DinerScene's (now-superseded) static placeholder values.
const VINYL_OFFSET = { x: 7, y: 17 };
const VINYL_SIZE = 32;
const VINYL_FRAMES = 8;

const ARM_OFFSET = { x: 14, y: 19 };
const ARM_FRAME = { width: 28, height: 24 };
const ARM_FRAMES = 7;
const ARM_LANDED_X = `calc(-${(ARM_FRAMES - 1) * ARM_FRAME.width} * var(--px-hero))`;

/**
 * The only client-rendered piece of the jukebox: the spinning vinyl and
 * the tonearm, both driven by real playback state. Sits in DinerScene's
 * DOM between jukebox-back and jukebox-front (vinyl) and between
 * jukebox-front and jukebox-glow (tonearm) — see the two named exports.
 */
function useJukeboxAnimation() {
  const playbackState = useStationStore((s) => s.playbackState);
  const started = useStationStore((s) => s.started);
  const currentTrackId = useStationStore((s) => s.currentTrack?.id);

  const { spinning, armDown } = deriveSceneState(playbackState, started);
  const phase = useNeedlePhase(armDown, currentTrackId);

  return { spinning, phase };
}

export function VinylRecord() {
  const { spinning } = useJukeboxAnimation();

  const style: CSSProperties = {
    position: "absolute",
    left: `calc(${VINYL_OFFSET.x} * var(--px-hero))`,
    top: `calc(${VINYL_OFFSET.y} * var(--px-hero))`,
    width: `calc(${VINYL_SIZE} * var(--px-hero))`,
    height: `calc(${VINYL_SIZE} * var(--px-hero))`,
    backgroundImage: "url(/scene/vinyl-spin.png)",
    backgroundSize: `calc(${VINYL_SIZE * VINYL_FRAMES} * var(--px-hero)) calc(${VINYL_SIZE} * var(--px-hero))`,
    imageRendering: "pixelated",
    animationPlayState: spinning ? "running" : "paused",
  };

  return <div className="animate-vinyl-spin" style={style} />;
}

export function Tonearm() {
  const { phase } = useJukeboxAnimation();

  const base: CSSProperties = {
    position: "absolute",
    left: `calc(${ARM_OFFSET.x} * var(--px-hero))`,
    top: `calc(${ARM_OFFSET.y} * var(--px-hero))`,
    width: `calc(${ARM_FRAME.width} * var(--px-hero))`,
    height: `calc(${ARM_FRAME.height} * var(--px-hero))`,
    backgroundImage: "url(/scene/tonearm-sweep.png)",
    backgroundSize: `calc(${ARM_FRAME.width * ARM_FRAMES} * var(--px-hero)) calc(${ARM_FRAME.height} * var(--px-hero))`,
    imageRendering: "pixelated",
  };

  let className = "";
  let style = base;

  if (phase === "dropping") {
    className = "animate-needle-drop";
  } else if (phase === "pulling") {
    className = "animate-needle-pull";
  } else if (phase === "down") {
    style = { ...base, backgroundPositionX: ARM_LANDED_X };
  } else {
    style = { ...base, backgroundPositionX: "0" };
  }

  return <div className={className} style={style} />;
}
