"use client";

import { useStationStore } from "@/lib/store/useStationStore";
import { MOCK_PLAYLISTS } from "@/lib/mockData";

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PixelButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border-2 border-ink px-4 py-2 font-ui text-xs shadow-pixel-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-pixel-sm ${
        variant === "primary"
          ? "bg-ember text-cream hover:bg-ember-dark"
          : "bg-amber-300 text-ink hover:bg-amber-500"
      }`}
    >
      {children}
    </button>
  );
}

function PixelPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-ink bg-cream-dark p-4 shadow-pixel">{children}</div>
  );
}

export function StationBuilder() {
  const selectedIds = useStationStore((s) => s.selectedIds);
  const weightingMode = useStationStore((s) => s.weightingMode);
  const started = useStationStore((s) => s.started);
  const currentTrack = useStationStore((s) => s.currentTrack);
  const playbackState = useStationStore((s) => s.playbackState);
  const positionMs = useStationStore((s) => s.positionMs);
  const queue = useStationStore((s) => s.queue);
  const currentIndex = useStationStore((s) => s.currentIndex);
  const lastSkipped = useStationStore((s) => s.lastSkipped);

  const toggleSource = useStationStore((s) => s.toggleSource);
  const setWeightingMode = useStationStore((s) => s.setWeightingMode);
  const drop = useStationStore((s) => s.drop);
  const togglePlayPause = useStationStore((s) => s.togglePlayPause);
  const skip = useStationStore((s) => s.skip);
  const prev = useStationStore((s) => s.prev);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <PixelPanel>
        <h2 className="mb-3 font-ui text-xs text-ink">Pick your playlists</h2>
        <ul className="flex flex-col gap-2">
          {MOCK_PLAYLISTS.map((playlist) => (
            <li key={playlist.id}>
              <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(playlist.id)}
                  onChange={() => toggleSource(playlist.id)}
                  disabled={started}
                  className="h-4 w-4 accent-ember"
                />
                {playlist.name}
                <span className="text-xs text-smoke">
                  ({playlist.tracks.length} tracks)
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-3 font-ui text-xs text-ink">
          <span>Mix:</span>
          <button
            type="button"
            disabled={started}
            onClick={() => setWeightingMode("equal")}
            className={`border-2 border-ink px-2 py-1 disabled:opacity-50 ${
              weightingMode === "equal" ? "bg-gold" : "bg-cream"
            }`}
          >
            Equal
          </button>
          <button
            type="button"
            disabled={started}
            onClick={() => setWeightingMode("proportional")}
            className={`border-2 border-ink px-2 py-1 disabled:opacity-50 ${
              weightingMode === "proportional" ? "bg-gold" : "bg-cream"
            }`}
          >
            Proportional
          </button>
        </div>

        {!started && (
          <div className="mt-4">
            <PixelButton
              variant="primary"
              disabled={selectedIds.length === 0}
              onClick={() => void drop()}
            >
              Drop the needle
            </PixelButton>
          </div>
        )}
      </PixelPanel>

      {started && (
        <PixelPanel>
          <h2 className="mb-2 font-ui text-xs text-ink">Now playing</h2>
          {currentTrack ? (
            <>
              <p className="font-body text-base text-ink">{currentTrack.title}</p>
              <p className="font-body text-sm text-ink-soft">{currentTrack.artistPrimary}</p>
              <p className="mt-1 font-ui text-[10px] text-smoke">
                {formatMs(positionMs)} / {formatMs(currentTrack.durationMs)} · track{" "}
                {currentIndex + 1} of {queue.length}
              </p>
              {lastSkipped && (
                <p className="mt-1 font-ui text-[10px] text-ember-dark">
                  Skipped &ldquo;{lastSkipped.title}&rdquo; ({lastSkipped.reason})
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <PixelButton onClick={() => void prev()}>⏮ Prev</PixelButton>
                <PixelButton onClick={() => void togglePlayPause()}>
                  {playbackState === "playing" ? "⏸ Pause" : "▶ Play"}
                </PixelButton>
                <PixelButton onClick={() => void skip()}>Skip ⏭</PixelButton>
              </div>
            </>
          ) : (
            <p className="font-body text-sm text-ink-soft">Loading first track…</p>
          )}
        </PixelPanel>
      )}
    </div>
  );
}
