import type { ReactNode } from "react";

/**
 * Wraps every floating HUD element over the full-bleed scene. The
 * wrapper itself is click-through (pointer-events-none) so the world
 * stays interactive underneath; individual docks opt back in with
 * pointer-events-auto.
 */
export function HudLayer({ children }: { children: ReactNode }) {
  return <div className="pointer-events-none absolute inset-0 z-20">{children}</div>;
}
