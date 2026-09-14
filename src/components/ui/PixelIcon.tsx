// Must match ICON_NAMES order in scripts/gen-ui.py.
const ICON_ORDER = [
  "play",
  "pause",
  "prev",
  "next",
  "gear",
  "check",
  "cross",
  "google",
] as const;

export type IconName = (typeof ICON_ORDER)[number];

const CELL = 12; // texels per icon cell

export function PixelIcon({ name, className }: { name: IconName; className?: string }) {
  const index = ICON_ORDER.indexOf(name);
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: `calc(${CELL} * var(--px))`,
        height: `calc(${CELL} * var(--px))`,
        backgroundImage: "url(/ui/icons.png)",
        backgroundSize: `calc(${CELL * ICON_ORDER.length} * var(--px)) calc(${CELL} * var(--px))`,
        backgroundPositionX: `calc(-${index * CELL} * var(--px))`,
        backgroundPositionY: "0",
        imageRendering: "pixelated",
      }}
    />
  );
}
