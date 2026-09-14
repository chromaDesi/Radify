import { DinerScene } from "@/components/scene/DinerScene";
import { StationBuilder } from "@/components/StationBuilder";

// Temporary: StationBuilder floats over the full-bleed scene as-is so
// the scene itself is independently reviewable. The HUD layer (top
// bar, docked playlist panel, transport bar, settings) replaces this
// stacked-card layout entirely in a later step.
export default function Home() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <DinerScene />
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <StationBuilder />
      </div>
    </div>
  );
}
