"use client";

import { useEffect, useRef } from "react";
import { useUiStore, type PixelScale, type Theme } from "@/lib/store/useUiStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon, type IconName } from "@/components/ui/PixelIcon";

const SCALES: PixelScale[] = [4, 8, 12];
const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Day" },
  { value: "dark", label: "Night" },
];

function InertAccountRow({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex w-full cursor-not-allowed items-center gap-2 border-2 border-ink bg-amber-300 px-3 py-2 font-ui text-xs text-ink shadow-pixel-sm"
      >
        {icon && <PixelIcon name={icon} />}
        {label}
      </button>
      <span className="absolute -top-2 -right-2 border-2 border-ink bg-ink px-1 font-ui text-[8px] text-gold">
        COMING SOON
      </span>
    </div>
  );
}

export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen);
  const close = useUiStore((s) => s.closeSettings);
  const pixelScale = useUiStore((s) => s.pixelScale);
  const setPixelScale = useUiStore((s) => s.setPixelScale);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      className="settings-dialog w-80 border-4 border-ink bg-panel p-0 text-fg"
      style={{
        boxShadow:
          "inset 2px 2px 0 var(--color-cream), inset -2px -2px 0 var(--color-wood-dark), 6px 6px 0 0 var(--color-ink)",
      }}
    >
      <div className="p-4">
        <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between border-b-4 border-ink bg-ink px-4 py-1.5">
          <span className="font-ui text-[10px] tracking-wide text-gold">SETTINGS</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close settings"
            className="text-cream"
          >
            <PixelIcon name="cross" className="brightness-0 invert" />
          </button>
        </div>

        <section className="mb-4">
          <h3 className="mb-2 font-ui text-[10px] text-fg">Theme</h3>
          <div className="flex gap-2">
            {THEMES.map(({ value, label }) => (
              <PixelButton
                key={value}
                size="sm"
                onClick={() => setTheme(value)}
                className={theme === value ? "bg-gold" : "bg-cream"}
              >
                {label}
              </PixelButton>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 font-ui text-[10px] text-fg">Pixel scale</h3>
          <div className="flex gap-2">
            {SCALES.map((scale) => (
              <PixelButton
                key={scale}
                size="sm"
                onClick={() => setPixelScale(scale)}
                className={pixelScale === scale ? "bg-gold" : "bg-cream"}
              >
                {scale}×
              </PixelButton>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-ui text-[10px] text-fg">Accounts</h3>
          <InertAccountRow icon="google" label="Sign in with Google" />
          <InertAccountRow label="Connect Spotify" />
          <InertAccountRow label="Connect YouTube" />
          <p className="mt-1 font-body text-xs text-smoke">
            Accounts land in the next update — for now the jukebox runs on house records.
          </p>
        </section>
      </div>
    </dialog>
  );
}
