---
name: project-idea
description: Core concept for Radify - mixing Spotify/YouTube Music playlists into a single radio stream
metadata:
  type: project
---

Radify lets a user pull in playlists or "liked songs" folders from Spotify and YouTube Music, mix multiple sources together, and play the blend back as one continuous radio-style stream.

**Why:** the user wants a way to combine playlists across services into a single listening session instead of switching between apps or manually building one combined playlist.

**How to apply:** when discussing features or architecture, keep in mind this is fundamentally a multi-source aggregation + playback problem, not a music-hosting problem — Radify orchestrates existing platform playback (Spotify Web Playback SDK, YouTube IFrame Player) rather than storing or serving audio itself. See [[design-direction]] for the visual language this should be wrapped in.
