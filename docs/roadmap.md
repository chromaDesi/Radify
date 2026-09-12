# Radify — Backend Build Roadmap (Phases 1–4)

This is the untouched architecture/roadmap content from the original build plan, archived here so it survives past the plan-mode session it was written in (plan files live outside this repo, under `C:\Users\varun\.claude\plans\`, and are not version-controlled). Phase 0 (pixel-art shell, mixing engine, mock playback, deploy) is complete — see `CLAUDE.md` for its current state and the ongoing visual-overhaul work. Everything below is **not yet built**.

## Context recap

Radify pulls playlists and liked-song folders from Spotify and YouTube, mixes them into one blended queue, and plays them back as a continuous radio station. Audience is capped at you + up to 4 friends (Spotify Development Mode's 5-user allowlist), the app owner needs Spotify Premium, and the platform target is desktop-first (Chrome/Edge) — see `CLAUDE.md` for the full rationale on all three.

---

## Architecture

### Auth: identity ≠ connections

**Google is the primary identity** (Auth.js, `openid email profile` only). **Spotify and YouTube are "connections"** in a separate table, linked via explicit OAuth flows. Do *not* model Spotify as a co-equal sign-in provider — Spotify's `email` field is deprecated, so Auth.js's email-based account linking is fragile. Link on Spotify's new `account_id` field (not `id`).

**Split the Google grants.** Request only non-sensitive scopes at sign-in; request `youtube.readonly` separately when the user clicks "Connect YouTube." This matters because a Google OAuth app in Testing status **revokes refresh tokens every 7 days** — splitting the grants means that expiry degrades the YouTube connection but never locks you out of the app.

Consequence: **"Connection expired — reconnect" is a first-class UI state**, not an error toast bolted on later.

**Token custody:** refresh tokens AES-256-GCM encrypted (WebCrypto, not `node:crypto`) with `TOKEN_ENC_KEY`, never leaving the server. The one exception is Spotify's `getOAuthToken` callback, which needs an *access* token in the browser — serve it fresh and short-lived from `/api/spotify/playback-token`.

**Premium detection:** don't gate on the `product` field (deprecated/removed). Attempt SDK init and treat `account_error` as the source of truth.

### Data model

**Phase 0 needs no database at all** (confirmed true — none was built). From Phase 1:

```
users / accounts / sessions   -- Auth.js, Google sign-in only
connections       user_id, provider, external_account_id, *_token_enc,
                  expires_at, status('active'|'expired'|'revoked')
source_playlists  connection_id, external_id, name, snapshot_id, last_synced_at
tracks            provider, external_id, title, artist_primary, duration_ms,
                  artwork_url, playable, dedupe_key
playlist_tracks   playlist_id, track_id, position
stations          user_id, name, seed, weighting_mode, stickiness, cursor
station_sources   station_id, source_playlist_id, weight
```

Two non-obvious calls:

- **Snapshot full track metadata at ingest.** Spotify's Feb 2026 changes removed batch track fetches, so rehydrating from bare IDs would cost N sequential requests. Playlist-items endpoints still return full objects in pages, so ingest is cheap and rehydration is not. This inverts the usual "store IDs, not copies" instinct.
- **No queue table.** The mix is deterministic given `(seed, sources, settings)` (see `src/lib/mixing/generateQueue.ts`, already built), so the queue is recomputable. Persist only an integer `cursor`. Bonus: a seed reproduces an exact ordering, which makes stations shareable.

Use `snapshot_id` (Spotify) / `etag` (YouTube) to skip re-ingesting unchanged sources.

### Mixing engine — already built

`src/lib/mixing/generateQueue.ts` implements this fully, with 14 passing unit tests: seeded per-source shuffle with epoch-based recycling, smooth weighted round-robin (equal/proportional), source stickiness runs (2–4 tracks, jittered), artist-spacing with bounded lookahead, cross-platform dedupe preferring the Spotify copy. Nothing left to design here — Phase 2 just needs to feed it real tracks instead of mock ones.

### Playback orchestration — mostly built

`src/lib/playback/{PlaybackSink,PlayerController,MockSink}.ts` implement the state machine and sink interface, with 7 passing unit tests. What Phase 2/3 still need to add, as real `PlaybackSink` implementations:

1. **Initialize both sinks on the first user gesture and keep them alive and idle.** Autoplay policy silently refuses a Spotify player constructed mid-queue. The existing "Drop the needle" gesture already does this for `MockSink`; `SpotifySink`/`YouTubeSink` need to be constructed in that same handler.
2. **Play Spotify with `uris: [uri]`, never `context_uri`** — a context lets Spotify auto-advance to *its* next track and silently hijack the queue.
3. **End detection differs per platform.** YouTube: `onStateChange → ENDED`, reliable. Spotify: no end event — detect `paused === true && position === 0`, plus a `setTimeout` backstop armed at `duration - position - 250ms` and re-armed on state change. `PlayerController` already has a per-slot latch against duplicate/echo `onEnded` events; a real Spotify sink still needs its own internal debouncing since the SDK fires multiple `player_state_changed` events per real transition.
4. **Errors are skips, not crashes** — `PlayerController` already does this generically. YouTube 101/150 = embedding disabled by rights holder, common for major-label music videos. Pre-filter at ingest with `videos.list?part=status` — that endpoint batches 50 IDs for 1 quota unit, worth exploiting hard.
5. **The 0.5–2s cross-platform handoff gap can't be eliminated. Dress it.** Run a looping low-volume diner room-tone + vinyl crackle bed under the whole station, ducked beneath tracks, started from the same "Drop the needle" gesture (same autoplay-policy requirement as the sinks). Also prefetch: `cueVideoById` the next YouTube track 3–5s before the current one ends.

---

## What you need to provide (Phase 1+)

**Already connected — nothing to do:** Vercel (Hobby, free; non-commercial-use-only), GitHub (connected, auto-deploy on push to `master` works).

**You must set up (all free):**

| Item | For | What's needed from you |
|---|---|---|
| Spotify Developer app | Web API + Playback SDK | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` in `.env.local`; register both redirect URIs; allowlist up to 5 emails |
| Google Cloud project | YouTube Data API v3 + sign-in | Enable YouTube Data API v3; OAuth client; consent screen External/Testing + test users; `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Neon Postgres | Datastore (Phase 1+) | Provision via Vercel Marketplace; auto-injects `DATABASE_URL` |
| `AUTH_SECRET`, `TOKEN_ENC_KEY` | Sessions + token encryption | Generated at implementation time |

**No new MCP connections needed.**

**Deployment gotcha, handle in Phase 1 not Phase 4:** Spotify does not support wildcard redirect URIs, so OAuth cannot complete on Vercel preview deployments. Register exactly two: `http://localhost:3000/...` and the resolved production domain, **https://radify-topaz.vercel.app** (already resolved during Phase 0 deploy — don't re-guess it).

---

## Roadmap

**Phase 1 — Auth + YouTube end-to-end.** YouTube first, deliberately: no Premium gate, no 5-user cap, cheap quota, and Google is the identity provider anyway.
Neon + Drizzle + Auth.js; split Google grants; encrypted `connections`; expired-connection UI; real playlist ingest; embeddable pre-filter; `YouTubeSink` replaces `MockSink`.
**Verify empirically:** does `playlistItems.list` on playlist `LL` return your YouTube Music likes? Docs suggest YTM's "Liked Music" is *not* reachable via Data API v3 — test against your real account rather than theorizing.
→ *Demo: log in, pick real playlists, hear a real mixed station.* Already shippable at this point.

**Phase 2 — Spotify ingest + cross-platform mixing.**
**First, verify which API surface you actually have.** You already had a Spotify Developer account before this project, so your app likely predates the February 2026 changes — migrated pre-existing apps are in a different state from newly-created ones, and some fields (`product`) are reportedly removed for migrated Dev Mode apps specifically. Check the dashboard and confirm live endpoint behaviour before designing against assumed endpoints. This is the one fact in this roadmap that is assumed rather than observed.
Then: Spotify link flow via `account_id`; ingest playlists and liked songs; full metadata snapshot; cross-provider dedupe live; station builder gains weights/mode/stickiness controls in the UI.
→ *Demo: a queue visibly interleaving both services.* Spotify tracks appear but don't play yet.

**Phase 3 — Spotify playback + dual-sink orchestration.**
`SpotifySink`; ephemeral playback-token route; `uris: [uri]`; dual end-detection with timer backstop and echo latch; both sinks warm on first gesture; prefetch; the ambience bed; degradation paths for missing Premium and 101/150.
→ *Demo: one continuous radio spanning both platforms.*

**Phase 4 — Polish & ship.**
Station persistence + resume cursor; `snapshot_id` re-sync; keyboard controls; reduced-motion; guest/demo mode with mock data (so Radify can be shown to people outside the 5-person allowlist); privacy policy page; production env wiring; README documenting the Premium and 5-user constraints.

---

## Verification

- **Phase 1+:** real login flow in a browser; confirm a real playlist ingests and plays continuously; deliberately queue a known non-embeddable video and confirm skip-on-error; let a Google token sit 7+ days (or revoke manually) and confirm the reconnect UI appears instead of a crash.
- **Phase 3:** play a station spanning both platforms end to end; confirm no double-skips (echo latch working) and that the ambience bed covers handoffs.
- Deploy each phase to Vercel and confirm it works at the production domain, since preview URLs can't complete Spotify OAuth.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Spotify 5-user cap blocks sharing | Certain | Guest/demo mode; accept personal-app scope |
| Google 7-day token expiry in Testing | Certain | First-class reconnect UI; split grants so sign-in survives |
| YT Music "Liked Music" unreachable via Data API | High | Use user-created YTM playlists (they are YouTube playlists); verify empirically in Phase 1 |
| Non-embeddable music videos | High | Pre-filter `status.embeddable`; runtime 101/150 skip |
| Audible handoff gap | Certain | Stickiness runs (already built) + prefetch + ambience bed; don't promise gapless |
| Spotify rules change again | Medium | Sink abstraction keeps Spotify removable in one file |

**Rejected:** `ytmusicapi` (cookie-based auth can't be productized, Python runtime awkward on Vercel, explicit ToS risk — a non-starter for a public repo); Upstash Redis (nothing to cache at 5 users); Clerk/Auth0 (solves identity, which isn't the problem; the problem is dual-provider refresh tokens).
