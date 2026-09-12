# Radify

## What this is
A web app that lets people bring in playlists / liked-song folders from Spotify and YouTube Music, mix them together, and play the result back as a single continuous "radio" stream.

Core idea: multiple source playlists in → one blended, shuffled/curated station out.

## Design direction
The UI should feel **homey**, not corporate. Visual language: Minecraft-style pixel art, evoking a jukebox sitting in a sunlit diner — warm light, blocky pixel-art assets, a pixel font, cozy color palette (warm ambers/oranges, soft wood tones) rather than a typical dark "music app" theme. See `memory/design-direction.md`.

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

## Conventions
Conventions will be added here as patterns emerge during implementation. Keep this file updated as decisions get made rather than letting them live only in chat history.

## Agents
See `.claude/agents/` for project-specific subagents:
- `pixel-ui-designer` — frontend/visual work, keeps the jukebox-diner aesthetic consistent.
- `music-api-integrator` — Spotify/YouTube Music API integration work.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
