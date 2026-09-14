"use client";

import { useStationStore } from "@/lib/store/useStationStore";
import { MOCK_PLAYLISTS } from "@/lib/mockData";
import { DOCK_TEXELS } from "@/lib/scene/sceneConfig";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";

export function PlaylistPanel() {
  const selectedIds = useStationStore((s) => s.selectedIds);
  const weightingMode = useStationStore((s) => s.weightingMode);
  const started = useStationStore((s) => s.started);
  const toggleSource = useStationStore((s) => s.toggleSource);
  const setWeightingMode = useStationStore((s) => s.setWeightingMode);
  const drop = useStationStore((s) => s.drop);

  const { left, top, width } = DOCK_TEXELS.playlistPanel;
  const { height: transportH, bottom: transportBottom } = DOCK_TEXELS.transportBar;
  // clear the transport dock plus a texel gap, whether or not it's
  // currently rendered (it only appears once started)
  const reservedBottom = transportH + transportBottom + 4;

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        left: `calc(${left} * var(--px))`,
        top: `calc(${top} * var(--px))`,
        width: `calc(${width} * var(--px))`,
        bottom: `calc(${reservedBottom} * var(--px))`,
      }}
    >
      <PixelPanel title="Pick your playlists" className="flex h-full flex-col overflow-hidden">
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {MOCK_PLAYLISTS.map((playlist) => (
            <li key={playlist.id}>
              <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-fg-soft">
                <PixelCheckbox
                  checked={selectedIds.includes(playlist.id)}
                  onChange={() => toggleSource(playlist.id)}
                  disabled={started}
                  ariaLabel={playlist.name}
                />
                {playlist.name}
                <span className="text-xs text-smoke">({playlist.tracks.length} tracks)</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-3 font-ui text-xs text-fg">
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
    </div>
  );
}
