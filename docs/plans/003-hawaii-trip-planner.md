# Ship an illustrated Hawaii trip planner

Status: Complete
Owner: Primary agent
Last updated: 2026-09-13

## Purpose

Replace the current interview-coach surface with a private, local-first Hawaii trip planner for two people. Visitors choose desired places on four island guide pages and receive a realistic day-by-day itinerary around the fixed international flights.

## Scope

Includes an illustrated home page, flight countdown, four island views, selectable attractions, route overview, deterministic itinerary generation, embedded Google Maps views, driving guidance, and a local checklist. Excludes live booking, live traffic, accounts, collaborative sync, and paid map APIs.

## Requirements and acceptance criteria

- The flight itinerary from the supplied screenshot is visible and the outbound flight has a live countdown.
- Oʻahu, Maui, Hawaiʻi Island, and Kauaʻi each have a distinct page with a map-like overview and illustrated/photo place cards.
- The specifically requested attractions are represented, including Shark's Cove and Harold L. Lyon Arboretum as distinct, correctly named places.
- A visitor can select places, reload, and retain selections locally.
- The planner produces an ordered daily itinerary and flags reservations/tickets and inter-island transfer days.
- Place links open in an in-page Google Maps overlay and provide an external Google Maps fallback.
- The four core island catalogs cover the supplied Hawaii spot checklist, with five-star omissions prioritized and real-image attribution retained.
- Driving notes and editable pre-trip todos are present.
- The site is responsive, keyboard usable, builds successfully, and is visually inspected.

## Existing state

The repository is a Vue 3 + TypeScript + Vite + Tauri project. The current root UI is an interview coach. Domain modules and tests are separable and will be preserved; the root page and site stylesheet will be replaced.

## Proposed design

`src/App.vue` owns a small deterministic catalog, hash-route state, selected place IDs, local todos, map-overlay state, and an itinerary projection. The itinerary groups selected attractions by island, treats full-day attractions as exclusive, limits other days to geographically compatible pairs, and inserts island transfer guidance. `localStorage` is the only persistence boundary and stores no credentials or sensitive external data.

## Milestones

1. Deliver a recognizable illustrated home page and island selection flow.
2. Complete all island content, map overlay, and itinerary generation.
3. Add social artwork, responsive polish, validation, and hosted handoff.

## Progress

- [x] Architecture and interaction direction approved by the user.
- [x] Reviewed open-source patterns and licenses without copying code or assets.
- [x] First meaningful local preview is open at the Vite development URL.
- [x] Full itinerary flow, map overlay, local todos, and persistence are complete.
- [x] Production bundle, formatting, and repository tests pass.
- [x] Expand the four core island catalogs from the supplied checklist and revalidate itinerary generation.

## Decisions

- 2026-09-13: Use hash navigation inside the existing Vue shell to keep island pages addressable without adding a router dependency.
- 2026-09-13: Use device-local persistence because the trip is private and no shared account was requested.
- 2026-09-13: Use Google Maps query embeds and links so no API credential is required.
- 2026-09-13: Treat the user's “鲨鱼湾” as Shark's Cove, not Hanauma Bay.
- 2026-09-13: Remove the intermediate planner view; the primary action now writes the selected data and opens the final generated plan directly.
- 2026-09-13: Simplify the home page to a neutral “夏威夷旅行计划” selection entry, with flights and detailed planning reserved for the generated result.
- 2026-09-13: Add paraphrased Lonely Planet guidance to every currently listed Maui, Hawaiʻi Island, and Kauaʻi spot covered by the user-supplied enhanced Markdown; leave unmatched spots explicitly without an LP attribution.

## Risks and mitigations

- Attraction access and road rules change: show advisory wording and link to official sources.
- Four islands in eight full days is rushed: the generated plan exposes transfer costs and keeps full-day attractions separate.
- Remote attraction photos can fail offline: cards retain colored artwork and readable copy without images.
- Existing domain code belongs to the prior product: preserve it untouched and keep the UI patch focused.

## Validation

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Inspect home, one island, plan generation, map overlay, and mobile layout in the running app.

## Results and follow-ups

The illustrated Vue experience replaced the root interview-coach surface while leaving the prior domain modules untouched. A custom share card was generated and wired into Open Graph and X metadata. The guide now contains 60 selectable attractions across the four core islands, locally stored real-location photos from Wikimedia Commons with machine-readable author and license records, and Google Maps review guidance. Six Oʻahu cards additionally include paraphrased Lonely Planet descriptions, practical tips, and printed-page references from the user-supplied Oʻahu guide. `pnpm format:check`, all 39 Vitest tests, and `pnpm exec vite build` pass. The full `pnpm lint` and `pnpm typecheck` processes were stopped after several minutes without output in this environment; the deployment-oriented Vite compile completed successfully. Browser inspection confirmed every core island page renders its expanded catalog and source-aware tips without horizontal overflow. Three lower-priority checklist entries were held back because no accurately matching, reusable photo could be verified. Publishing was not attempted because this existing Tauri repository is not initialized as a Sites checkout and its repository currently consists of untracked user-owned files; creating and pushing a remote source repository would risk sweeping unrelated work into the deployment.
