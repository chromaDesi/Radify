# Radify

## What this is
A web app that lets people bring in playlists / liked-song folders from Spotify and YouTube Music, mix them together, and play the result back as a single continuous "radio" stream.

Core idea: multiple source playlists in → one blended, shuffled/curated station out.

## Design direction
The UI should feel **homey**, not corporate. Visual language: Minecraft-style pixel art, evoking a jukebox sitting in a sunlit diner — warm light, blocky pixel-art assets, a pixel font, cozy color palette (warm ambers/oranges, soft wood tones) rather than a typical dark "music app" theme. See `memory/design-direction.md`.

## Stack (tentative — confirm before scaffolding code)
Not yet locked in. Leaning toward Next.js + TypeScript + Tailwind for the frontend (Vercel deploy target), given the tooling already available in this environment. Backend/auth approach for Spotify and YouTube Music OAuth is still TBD — both platforms require server-side token handling.

## Key technical unknowns to resolve early
- Spotify Web API and YouTube Music (unofficial API / YouTube Data API) both need OAuth; scopes and rate limits differ.
- "Mixing" playlists means defining an interleaving/shuffle algorithm across sources of different lengths — needs a concrete spec before building.
- Licensing/playback: neither API lets you serve raw audio directly to a third-party player without going through the respective platform's own playback SDK (Spotify Web Playback SDK, YouTube IFrame Player) — playback will likely stay platform-native per track rather than a single unified audio stream.

## Conventions
No code yet — conventions will be added here as the stack is chosen and patterns emerge. Keep this file updated as decisions get made rather than letting them live only in chat history.

## Agents
See `.claude/agents/` for project-specific subagents:
- `pixel-ui-designer` — frontend/visual work, keeps the jukebox-diner aesthetic consistent.
- `music-api-integrator` — Spotify/YouTube Music API integration work.
