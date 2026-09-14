import { useEffect, useRef, useState } from "react";
import { decideNeedleTransition, type NeedlePhase } from "@/lib/scene/sceneState";

// Matches the 420ms steps(6) durations for --animate-needle-drop/pull.
const DROP_MS = 420;
const PULL_MS = 420;

/**
 * Drives the tonearm's phase machine off armDown/track-id changes.
 * The decision logic itself (decideNeedleTransition) is pure and
 * unit-tested; this hook is just the imperative timer sequencing on
 * top of it.
 */
export function useNeedlePhase(armDown: boolean, trackId: string | undefined): NeedlePhase {
  const [phase, setPhase] = useState<NeedlePhase>("parked");
  const phaseRef = useRef(phase);

  // Keep phaseRef in sync after each commit — the effect below reads it
  // to get the latest phase even on runs where phase itself isn't a
  // dependency, which a ref update during render is not safe to do.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const prevArmDown = useRef(armDown);
  const prevTrackId = useRef(trackId);

  useEffect(() => {
    const armDownChanged = prevArmDown.current !== armDown;
    const trackChanged = prevTrackId.current !== trackId;
    prevArmDown.current = armDown;
    prevTrackId.current = trackId;

    const action = decideNeedleTransition({
      currentPhase: phaseRef.current,
      armDown,
      armDownChanged,
      trackChanged,
    });

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (action.type === "drop") {
      setPhase("dropping");
      timers.push(setTimeout(() => setPhase("down"), DROP_MS));
    } else if (action.type === "pull") {
      setPhase("pulling");
      timers.push(setTimeout(() => setPhase("parked"), PULL_MS));
    } else if (action.type === "redrop") {
      setPhase("pulling");
      timers.push(
        setTimeout(() => {
          setPhase("dropping");
          timers.push(setTimeout(() => setPhase("down"), DROP_MS));
        }, PULL_MS),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [armDown, trackId]);

  return phase;
}
