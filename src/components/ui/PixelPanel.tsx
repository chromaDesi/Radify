import type { ReactNode } from "react";

/**
 * The Minecraft inventory-window frame: a flat, hard-edged double
 * bevel (light inset top/left, dark inset bottom/right, then a solid
 * drop shadow), not the soft glassmorphism memory/design-direction.md
 * warns against — every stop here is a flat color, zero blur.
 */
export function PixelPanel({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`border-4 border-ink bg-cream-dark p-4 ${className}`}
      style={{
        boxShadow:
          "inset 2px 2px 0 var(--color-cream), inset -2px -2px 0 var(--color-wood-dark), 6px 6px 0 0 var(--color-ink)",
      }}
    >
      {title && (
        <div className="-mx-4 -mt-4 mb-3 border-b-4 border-ink bg-ink px-4 py-1.5">
          <span className="font-ui text-[10px] tracking-wide text-gold">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
