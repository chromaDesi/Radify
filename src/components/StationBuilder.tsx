"use client";

import { useStationStore } from "@/lib/store/useStationStore";
import { MOCK_PLAYLISTS } from "@/lib/mockData";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";
import { PixelIcon } from "@/components/ui/PixelIcon";

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
      <PixelPanel title="Pick your playlists">
        <ul className="flex flex-col gap-2">
          {MOCK_PLAYLISTS.map((playlist) => (
            <li key={playlist.id}>
              <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-soft">
                <PixelCheckbox
                  checked={selectedIds.includes(playlist.id)}
                  onChange={() => toggleSource(playlist.id)}
                  disabled={started}
                  ariaLabel={playlist.name}
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
          <PixelButton
            size="sm"
            disabled={started}
            onClick={() => setWeightingMode("equal")}
            className={weightingMode === "equal" ? "bg-gold" : "bg-cream"}
          >
            Equal
          </PixelButton>
          <PixelButton
            size="sm"
            disabled={started}
            onClick={() => setWeightingMode("proportional")}
            className={weightingMode === "proportional" ? "bg-gold" : "bg-cream"}
          >
            Proportional
          </PixelButton>
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
        <PixelPanel title="Now playing">
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
                <PixelButton variant="icon" ariaLabel="Previous track" onClick={() => void prev()}>
                  <PixelIcon name="prev" />
                </PixelButton>
                <PixelButton
                  variant="icon"
                  ariaLabel={playbackState === "playing" ? "Pause" : "Play"}
                  onClick={() => void togglePlayPause()}
                >
                  <PixelIcon name={playbackState === "playing" ? "pause" : "play"} />
                </PixelButton>
                <PixelButton variant="icon" ariaLabel="Skip track" onClick={() => void skip()}>
                  <PixelIcon name="next" />
                </PixelButton>
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
