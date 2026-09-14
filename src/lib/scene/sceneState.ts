import type { PlaybackState } from "@/lib/playback/PlayerController";

export interface DerivedSceneState {
  /** Should the vinyl be spinning right now? */
  spinning: boolean;
  /** Should the tonearm be resting on the record (vs. parked)? */
  armDown: boolean;
}

/**
 * PlayerController sets playbackState to "loading" on every advance(),
 * not just the very first start — so a naive "not playing -> pull the
 * needle" would yank the arm up on every ordinary track change. armDown
 * stays true through "loading" so the needle only actually lifts on a
 * real pause or when the queue ends.
 */
export function deriveSceneState(
  playbackState: PlaybackState,
  started: boolean,
): DerivedSceneState {
  return {
    spinning: playbackState === "playing",
    armDown: started && (playbackState === "playing" || playbackState === "loading"),
  };
}

export type NeedlePhase = "parked" | "dropping" | "down" | "pulling";

export type NeedleAction =
  | { type: "none" }
  | { type: "drop" }
  | { type: "pull" }
  /** Skip mid-play: the needle visibly lifts and re-lands, purely as a
   * cosmetic flourish — not synced to real audio timing. This is the
   * moment most likely to actually be seen, since skip is the most
   * common interaction, which is why it gets its own visible response
   * instead of the arm silently staying down through every track change. */
  | { type: "redrop" };

export interface NeedleTransitionInput {
  currentPhase: NeedlePhase;
  armDown: boolean;
  armDownChanged: boolean;
  trackChanged: boolean;
}

/**
 * Pure decision function for the needle's phase machine — kept separate
 * from the imperative timer sequencing (see useNeedlePhase) so the
 * actual decision logic is unit-testable without a DOM.
 */
export function decideNeedleTransition(input: NeedleTransitionInput): NeedleAction {
  const { currentPhase, armDown, armDownChanged, trackChanged } = input;

  if (armDownChanged) {
    return armDown ? { type: "drop" } : { type: "pull" };
  }
  if (armDown && trackChanged && currentPhase === "down") {
    return { type: "redrop" };
  }
  return { type: "none" };
}
