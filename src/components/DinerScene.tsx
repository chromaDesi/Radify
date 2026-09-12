import Image from "next/image";

// Native render resolution of every layer, from scripts/gen-scene.py.
const NATIVE_W = 320;
const NATIVE_H = 180;
// Integer-only scale — fractional scaling blurs pixel art.
const SCALE = 2;

const LAYERS = [
  "wall",
  "floor",
  "window-light",
  "booth",
  "jukebox",
  "dust-motes",
  "glow-overlay",
] as const;

export function DinerScene() {
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-wood-dark"
      style={{ width: NATIVE_W * SCALE, height: NATIVE_H * SCALE }}
    >
      {LAYERS.map((name) => (
        <Image
          key={name}
          src={`/scene/${name}.png`}
          alt=""
          width={NATIVE_W * SCALE}
          height={NATIVE_H * SCALE}
          unoptimized
          priority
          className={
            name === "dust-motes"
              ? "absolute inset-0 [image-rendering:pixelated] animate-dust-drift"
              : name === "glow-overlay"
                ? "absolute inset-0 [image-rendering:pixelated] animate-glow-flicker"
                : "absolute inset-0 [image-rendering:pixelated]"
          }
        />
      ))}
    </div>
  );
}
