import { DOCK_TEXELS } from "@/lib/scene/sceneConfig";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function HudTopBar({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { top, insetX, height } = DOCK_TEXELS.topBar;

  return (
    <div
      className="absolute flex items-center justify-between"
      style={{
        top: `calc(${top} * var(--px))`,
        left: `calc(${insetX} * var(--px))`,
        right: `calc(${insetX} * var(--px))`,
        height: `calc(${height} * var(--px))`,
      }}
    >
      <span
        className="pointer-events-auto font-logo text-sm text-cream"
        style={{ textShadow: "2px 2px 0 var(--color-ink)" }}
      >
        Radify
      </span>
      <PixelButton
        variant="icon"
        ariaLabel="Settings"
        className="pointer-events-auto"
        onClick={onOpenSettings}
      >
        <PixelIcon name="gear" />
      </PixelButton>
    </div>
  );
}
