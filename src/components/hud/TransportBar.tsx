"use client";

import { useStationStore } from "@/lib/store/useStationStore";
import { DOCK_TEXELS } from "@/lib/scene/sceneConfig";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TransportBar() {
  const started = useStationStore((s) => s.started);
  const currentTrack = useStationStore((s) => s.currentTrack);
  const playbackState = useStationStore((s) => s.playbackState);
  const positionMs = useStationStore((s) => s.positionMs);
  const queue = useStationStore((s) => s.queue);
  const currentIndex = useStationStore((s) => s.currentIndex);
  const lastSkipped = useStationStore((s) => s.lastSkipped);
  const togglePlayPause = useStationStore((s) => s.togglePlayPause);
  const skip = useStationStore((s) => s.skip);
  const prev = useStationStore((s) => s.prev);

  if (!started) return null;

  const { bottom, width } = DOCK_TEXELS.transportBar;

  return (
    <div
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: `calc(${bottom} * var(--px))`,
        width: `calc(${width} * var(--px))`,
      }}
    >
      <PixelPanel title="Now playing">
        {currentTrack ? (
          <>
            <p className="font-body text-base text-fg">{currentTrack.title}</p>
            <p className="font-body text-sm text-fg-soft">{currentTrack.artistPrimary}</p>
            <p className="mt-1 font-ui text-[10px] text-smoke">
              {formatMs(positionMs)} / {formatMs(currentTrack.durationMs)} · track{" "}
              {currentIndex + 1} of {queue.length}
            </p>
            {lastSkipped && (
              <p className="mt-1 font-ui text-[10px] text-ember-dark">
                Skipped &ldquo;{lastSkipped.title}&rdquo; ({lastSkipped.reason})
              </p>
            )}
            <div className="mt-3 flex justify-center gap-2">
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
          <p className="font-body text-sm text-fg-soft">Loading first track…</p>
        )}
      </PixelPanel>
    </div>
  );
}
