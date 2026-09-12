import { describe, expect, it } from "vitest";
import { hudClearsStage, MIN_VIEWPORT } from "./sceneConfig";

describe("HUD dock geometry never overlaps the jukebox stage", () => {
  it("clears at the minimum supported viewport (1280x720)", () => {
    expect(hudClearsStage(MIN_VIEWPORT.width, MIN_VIEWPORT.height)).toBe(true);
  });

  it("clears at a large desktop viewport (2560x1440)", () => {
    expect(hudClearsStage(2560, 1440)).toBe(true);
  });

  it("clears at a mid-size desktop viewport (1920x1080)", () => {
    expect(hudClearsStage(1920, 1080)).toBe(true);
  });
});
