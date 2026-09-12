import { DinerScene } from "@/components/DinerScene";
import { StationBuilder } from "@/components/StationBuilder";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-cream px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-logo text-2xl text-ink sm:text-3xl">Radify</h1>
        <p className="max-w-md font-ui text-sm text-ink-soft sm:text-base">
          Bring your Spotify and YouTube playlists into one diner jukebox,
          mixed and playing like a radio station.
        </p>
      </div>
      <DinerScene />
      <StationBuilder />
    </div>
  );
}
