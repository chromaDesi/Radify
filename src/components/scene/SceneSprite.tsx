import Image from "next/image";
import type { CSSProperties } from "react";

interface SceneSpriteProps {
  src: string;
  /** Native texel dimensions of the source PNG. */
  texelWidth: number;
  texelHeight: number;
  /** Use the --px-hero tier (jukebox group) instead of --px (world tier). */
  hero?: boolean;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}

/**
 * A single pixel-art sprite scaled via CSS custom properties rather
 * than Next's image optimizer (which would resample and blur it).
 * `texelWidth`/`texelHeight` set the intrinsic size next/image expects;
 * the `style` override is what actually drives the displayed size.
 */
export function SceneSprite({
  src,
  texelWidth,
  texelHeight,
  hero,
  className,
  style,
  priority,
}: SceneSpriteProps) {
  const scaleVar = hero ? "var(--px-hero)" : "var(--px)";
  return (
    <Image
      src={src}
      alt=""
      width={texelWidth}
      height={texelHeight}
      unoptimized
      priority={priority}
      className={className}
      style={{
        width: `calc(${texelWidth} * ${scaleVar})`,
        height: `calc(${texelHeight} * ${scaleVar})`,
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
