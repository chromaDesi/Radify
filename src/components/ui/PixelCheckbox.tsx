import { PixelIcon } from "./PixelIcon";

export function PixelCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={`flex shrink-0 items-center justify-center border-2 border-ink disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-gold" : "bg-cream"
      }`}
      style={{ width: "calc(12 * var(--px))", height: "calc(12 * var(--px))" }}
    >
      {checked && <PixelIcon name="check" />}
    </button>
  );
}
