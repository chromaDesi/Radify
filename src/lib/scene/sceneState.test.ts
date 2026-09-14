import { describe, expect, it } from "vitest";
import { decideNeedleTransition, deriveSceneState } from "./sceneState";

describe("deriveSceneState", () => {
  it("is idle before the station starts", () => {
    expect(deriveSceneState("idle", false)).toEqual({ spinning: false, armDown: false });
  });

  it("drops the needle while loading the first track", () => {
    // "Drop the needle" -> idle->loading happens before playing does
    expect(deriveSceneState("loading", true)).toEqual({ spinning: false, armDown: true });
  });

  it("spins while playing", () => {
    expect(deriveSceneState("playing", true)).toEqual({ spinning: true, armDown: true });
  });

  it("keeps the arm down through a loading state mid-queue (ordinary skip), not just the first start", () => {
    // PlayerController sets "loading" on every advance(), not just start —
    // the arm must not yank up on every skip.
    expect(deriveSceneState("loading", true)).toEqual({ spinning: false, armDown: true });
  });

  it("lifts the arm on pause", () => {
    expect(deriveSceneState("paused", true)).toEqual({ spinning: false, armDown: false });
  });

  it("lifts the arm when the queue ends", () => {
    expect(deriveSceneState("ended", true)).toEqual({ spinning: false, armDown: false });
  });
});

describe("decideNeedleTransition", () => {
  it("drops on the first start (armDown false -> true)", () => {
    const action = decideNeedleTransition({
      currentPhase: "parked",
      armDown: true,
      armDownChanged: true,
      trackChanged: false,
    });
    expect(action).toEqual({ type: "drop" });
  });

  it("pulls on pause (armDown true -> false)", () => {
    const action = decideNeedleTransition({
      currentPhase: "down",
      armDown: false,
      armDownChanged: true,
      trackChanged: false,
    });
    expect(action).toEqual({ type: "pull" });
  });

  it("redrops on a skip while already down", () => {
    const action = decideNeedleTransition({
      currentPhase: "down",
      armDown: true,
      armDownChanged: false,
      trackChanged: true,
    });
    expect(action).toEqual({ type: "redrop" });
  });

  it("does nothing for a track change while the arm hasn't landed yet", () => {
    // e.g. two "loading" states firing in quick succession before the
    // drop animation has finished — don't stack a redrop on a drop.
    const action = decideNeedleTransition({
      currentPhase: "dropping",
      armDown: true,
      armDownChanged: false,
      trackChanged: true,
    });
    expect(action).toEqual({ type: "none" });
  });

  it("does nothing when neither armDown nor the track changed", () => {
    const action = decideNeedleTransition({
      currentPhase: "down",
      armDown: true,
      armDownChanged: false,
      trackChanged: false,
    });
    expect(action).toEqual({ type: "none" });
  });
});
