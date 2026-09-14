# Radify

## What this is
A web app that lets people bring in playlists / liked-song folders from Spotify and YouTube Music, mix them together, and play the result back as a single continuous "radio" stream.

Core idea: multiple source playlists in → one blended, shuffled/curated station out.

## Design direction
The UI should feel **homey and like a game**, not corporate, and not like "small pixel art." Visual language: Minecraft-style blocky pixel art — flat color blocks, thick outlines, two-tone block-face shading — evoking a jukebox sitting in a sunlit diner, warm ambers/oranges and wood tones, rather than a typical dark "music app" theme or fine-detail/gradient pixel art (Terraria-style). A full-screen diner scene is the game world; the playlist picker, now-playing, and settings live as floating HUD panels over it, not a centered stacked card. See `memory/design-direction.md` and the "Two-tier pixel scale" convention below.

## Audience & platform (locked)
Radify is scoped to **you + up to 4 friends**, not public signup. This isn't a "for now" placeholder — a new Spotify Developer app is capped at 5 allowlisted users in Development Mode, and Extended Quota Mode requires a registered business + 250k MAU, which is out of reach for a hobby project. The app owner (you) must also hold Spotify Premium for the Spotify integration to function at all — the Web Playback SDK does not play full tracks for free accounts.

Platform target is **desktop only for now** (Chrome/Edge) — the Spotify Web Playback SDK does not work on iOS Safari and is unreliable on mobile browsers generally.

## Stack (locked)
- **Next.js (App Router) + TypeScript (strict) + Tailwind v4**, deployed to Vercel Hobby (free, non-commercial-use-only).
- **Auth.js v5**, self-hosted, no Clerk/Auth0. Google is the primary sign-in identity; Spotify and YouTube are separate "connections," not co-equal sign-in providers (Spotify's `email` field is deprecated, which makes email-based account linking fragile — link on `account_id` instead).
- **Drizzle + Neon Postgres** (free tier via Vercel Marketplace), introduced in Phase 1, not Phase 0.
- **Zustand** for client state (the player controller is a long-lived singleton; Context would cause re-render storms on every progress tick).

## Key technical decisions (resolved — see the full plan for detail)
- Neither Spotify nor YouTube lets a third party re-serve raw audio. Playback stays platform-native via each service's own SDK (Spotify Web Playback SDK, YouTube IFrame Player) behind a shared `PlaybackSink` interface, never a single unified audio stream.
- Mixing uses a deterministic, seeded weighted round-robin scheduler with source "stickiness" (2–4 track runs per source, not per-track alternation) to minimize the audible cross-platform handoff gap, plus artist-spacing and cross-platform track dedupe.
- A Google OAuth app in Testing status revokes refresh tokens every 7 days — sign-in and the YouTube data grant are requested as separate scopes so an expired YouTube connection never locks a user out of the app itself. "Connection expired — reconnect" is a first-class UI state.

## Deployment
- **GitHub**: https://github.com/chromaDesi/Radify (public)
- **Vercel production URL**: https://radify-topaz.vercel.app — plain `radify.vercel.app` was already taken by someone else, confirming the plan's warning not to assume it. **This is the domain to register as the Spotify redirect URI in Phase 1** (alongside `http://localhost:3000/...`) — Spotify doesn't support wildcard redirect URIs, so get this exact value into the Spotify dashboard rather than guessing.
- Vercel project: `varun-parekhs-projects/radify`. GitHub repo is connected (`chromaDesi/Radify`) — auto-deploy-on-push is wired up.
- **Vercel Authentication (the project's viewer-login gate) is turned OFF.** It was on by default and caused every `vercel deploy --prod` after connecting Git to fail with "Deployment Blocked: commit email could not be matched to a GitHub account" — a real Vercel limitation with GitHub's privacy-preserving `@users.noreply.github.com` commit email format (which is intentionally kept, not a bug to fix, since switching to a real email would put it in public commit history). Turning this project-level toggle off resolved it immediately. This is fine at Phase 0 (no sensitive data); real access control for later phases is Radify's own Google/Spotify/YouTube OAuth, not Vercel's viewer gate, so there's no need to re-enable it.

## Roadmap
Phase 0 (this scene/UI, the mixing engine, mock playback, deploy) is done. Everything else — auth, real Spotify/YouTube ingest, real playback, polish — is unbuilt and documented in `docs/roadmap.md`, not here. Read that file before starting Phase 1+ work.

## Conventions

**Two-tier pixel scale.** `--px` (4px, world tier: tiles, trim, props, HUD chrome) and `--px-hero` (8px, jukebox group only) are plain runtime custom properties on bare `:root` in `globals.css` — deliberately *not* inside the `@theme inline` block, because the settings panel's Pixel Scale control overrides them live via an inline style on `<html>` (see `src/lib/store/useUiStore.ts`), which only works on ordinary custom properties, not baked Tailwind theme tokens. Both must stay multiples of 4 — that's what keeps every sprite landing on a whole device pixel at 125%/150%/175% Windows display scaling (fractional multiples don't). The jukebox gets its own larger tier deliberately, so it visually dominates the frame instead of reading as a detail in a correctly-tiled but empty-feeling room — this is the actual fix for "looks like a small pixel art."

**Tiles vs. hero sprites.** "Fill the viewport" and "pixel art only scales by whole integers" aren't in conflict if the background isn't one image stretched to fit. Far background (wall/wainscot/floor/dust) is seamless CSS `background-repeat` tiles sized to an exact integer multiple of their native texel size (`.tile-wall` etc. in `globals.css`) — repetition covers any viewport with zero stretching. Hero/prop sprites (window, booth, the jukebox group) are fixed-size PNGs, bottom-anchored to the floor line via `FLOOR_BAND_TEXELS` in `src/lib/scene/sceneConfig.ts` — the single source of truth for that offset, shared between `DinerScene` and the dock/stage-overlap geometry tests. All art is authored and shipped at **native texel resolution** (`scripts/gen-scene.py`/`gen-ui.py`, no upscale in Python) — CSS does all scaling via `--px`/`--px-hero`, and `image-rendering: pixelated` lives on `html` (inherited) so it reaches background-image tiles too, not just `<img>`.

**Sprite-sheet animation, never CSS `rotate()`/`transform` for pixel art.** `image-rendering: pixelated` governs image scaling, not compositor-level transforms — a rotated or scaled-via-transform pixel sprite is rasterized with bilinear filtering regardless and comes out blurred. The vinyl spin and tonearm drop/pull (`src/components/scene/JukeboxMechanism.tsx`) are pre-rendered per-angle frames in a sprite sheet, scrubbed via `steps()` animating `background-position-x` — same technique as the existing `animate-dust-drift`/`animate-glow-flicker`. A looping N-frame sheet of frame-width `Fw` animates `background-position-x` from `0` to `-(N × Fw)` with `steps(N) infinite`; a one-shot animation across N frames goes from `0` to `-((N−1) × Fw)` with `steps(N−1)` and `animation-fill-mode: forwards` — these differ by one frame and are easy to get subtly wrong (a stutter or a missing final pose, not an obvious break), so follow the existing keyframes in `globals.css` literally rather than re-deriving them.

**Day/Night theming.** Manual toggle in Settings (`src/lib/store/useUiStore.ts`, `theme` state, persisted to `localStorage` under `radify-theme`), applied as `data-theme="dark"` on `<html>`. It's a full night-diner reskin, not a generic dark-mode inversion: wall/wainscot/floor/trim/window tiles swap to a `public/scene-dark/` asset set (deep violet/moonlit palette) via `[data-theme="dark"]` background-image overrides in `globals.css`, and the ambient vignette recenters from the window (day) to the jukebox (night). The jukebox/vinyl/tonearm/booth sprites are deliberately **not** swapped — they read as the room's own light source, lit independently of daylight. New semantic tokens (`--color-panel`, `--color-fg`, `--color-fg-soft`) carry the HUD-panel light/dark split; `--color-ink` (borders, hard shadows, the panel title-strip) is deliberately *not* redefined per-theme since it's overloaded and needs to stay constant. `.prop-window` is a CSS-background `<div>` rather than a `next/image` `SceneSprite`, purely so the one theme-dependent scene prop can swap via pure CSS without turning `DinerScene` into a client component.

Further conventions will be added here as patterns emerge during implementation. Keep this file updated as decisions get made rather than letting them live only in chat history.

## Agents
See `.claude/agents/` for project-specific subagents:
- `pixel-ui-designer` — frontend/visual work, keeps the jukebox-diner aesthetic consistent.
- `music-api-integrator` — Spotify/YouTube Music API integration work.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
