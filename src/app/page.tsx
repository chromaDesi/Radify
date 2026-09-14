import { DinerScene } from "@/components/scene/DinerScene";
import { HudLayer } from "@/components/hud/HudLayer";
import { HudTopBar } from "@/components/hud/HudTopBar";
import { PlaylistPanel } from "@/components/hud/PlaylistPanel";
import { TransportBar } from "@/components/hud/TransportBar";

export default function Home() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <DinerScene />
      <HudLayer>
        <HudTopBar />
        <PlaylistPanel />
        <TransportBar />
      </HudLayer>
    </div>
  );
}
