import type { ReactNode } from "react";

type Variant = "default" | "primary" | "ghost" | "icon";
type Size = "sm" | "md";

interface PixelButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-amber-300 text-ink hover:bg-amber-500",
  primary: "bg-ember text-cream hover:bg-ember-dark",
  ghost: "bg-cream text-ink hover:bg-cream-dark",
  icon: "bg-amber-300 text-ink hover:bg-amber-500",
};

export function PixelButton({
  children,
  onClick,
  disabled,
  variant = "default",
  size = "md",
  className = "",
  ariaLabel,
  type = "button",
}: PixelButtonProps) {
  const sizeClass =
    variant === "icon" ? "p-2" : size === "sm" ? "px-2 py-1 text-[10px]" : "px-4 py-2 text-xs";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`border-2 border-ink font-ui shadow-pixel-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-pixel-sm ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
