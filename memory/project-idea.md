---
name: project-idea
description: Core concept for Radify - mixing Spotify/YouTube Music playlists into a single radio stream
metadata:
  type: project
---

Radify lets a user pull in playlists or "liked songs" folders from Spotify and YouTube Music, mix multiple sources together, and play the blend back as one continuous radio-style stream.

**Why:** the user wants a way to combine playlists across services into a single listening session instead of switching between apps or manually building one combined playlist.

**How to apply:** when discussing features or architecture, keep in mind this is fundamentally a multi-source aggregation + playback problem, not a music-hosting problem — Radify orchestrates existing platform playback (Spotify Web Playback SDK, YouTube IFrame Player) rather than storing or serving audio itself. See [[design-direction]] for the visual language this should be wrapped in.

**Scope constraint (confirmed 2026-09-11):** Radify is built for the user + up to 4 friends, not public signup — a new Spotify Developer app caps Development Mode at 5 allowlisted users, and the app owner must hold Spotify Premium for Spotify playback to work at all. Escaping that cap requires a registered business + 250k MAU, which is out of scope for a hobby project. Desktop-only for now (Chrome/Edge) — Spotify's Web Playback SDK doesn't work on iOS Safari. A guest/demo mode with mock data is planned (Phase 4) so the app can still be shown to people outside the 5-user allowlist.
