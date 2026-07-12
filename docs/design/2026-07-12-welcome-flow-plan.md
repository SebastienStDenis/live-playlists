# Guided welcome flow

*Written 2026-07-12 by Claude (Fable 5).*

## Problem

A new user lands on an empty dashboard and has to discover, via attention
dots and empty-state nudges, that they must open Settings, link a Last.fm
account, set a home city, and run a manual sync before anything appears.
That scattered treasure hunt is replaced by a guided first-login flow, and
the half-set-up states it produced are ruled out entirely.

## Invariant

The dashboard requires a home city and a sync on record - even a failed
one. Anyone short of that is redirected to the welcome flow; there is no
skipping. This lets the dashboard and settings drop every "no home city" and
"never synced" half-state: events are always fetched, the concerts and
playlists tabs lose their set-a-city empty states, the sync gate reduces to
"is Last.fm linked", and the home city becomes a quiet, never-clearable
field in the settings Account section instead of its own alert-bearing
section.

"A sync on record" is read from `GET /me/sync`, with `last_synced_at` as a
fallback: Temporal retention can expire an old run's history, so a stamped
successful sync also counts, and an unknown status (Temporal unreachable)
never bounces. The cost of the invariant: a visitor without a Last.fm
account cannot get past onboarding - accepted, since every dashboard tab is
sync-fed and useless without one.

## Flow

`/welcome` (`frontend/src/app/welcome/`) walks the three requirements in
order, one active step at a time with completed steps collapsing to a
check-marked summary line:

1. **Home City** - the same city search box the settings dialog uses;
   `PUT /me/city`.
2. **Last.fm** - username input; `PUT /me/lastfm` validates the account and
   the flow shows the linked username.
3. **First Sync** - starts automatically once both are set
   (`POST /me/sync`) and shows the four workflow steps live by polling
   `GET /me/sync`, ending in a "Go to dashboard" button (or a retry on
   failure).

Copy and step names follow `docs/wording.md` (Welcome flow section).

## Routing

- The dashboard redirects to `/welcome` whenever the invariant fails. All
  post-login entry points funnel through the dashboard, so no auth redirect
  changes.
- `/welcome` itself bounces fully onboarded users (setup complete and a
  completed sync on record) to the dashboard, so the flow stays resumable
  mid-setup or mid-first-sync but never reappears afterwards.

## Details

- No backend changes: first-run state is inferred from existing endpoints,
  and the sync-start guards (404 without Last.fm or city) are satisfied by
  the step order.
- The sync step list (types, marks, list, status fetch) moved from
  `sync-card.tsx` into `frontend/src/app/dashboard/sync-steps.tsx`, shared
  by the settings sync card and the welcome flow. The card's one-line
  playback (`CurrentStep`) stays in the card; the flow shows the full list.
- A sync already on record is never auto-restarted: a running one is
  attached to and watched, a failed one shows "Try again".
- Corrections during setup reopen a completed step (pencil), but only until
  the first sync starts; after that, changes belong to the settings dialog.
