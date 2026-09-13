# Generate a constraint-aware Hawaii itinerary

Status: Complete
Owner: Primary agent
Last updated: 2026-09-13

## Purpose

Turn the selected Hawaii spots into a deterministic, feasible day-by-day plan before adapting it into the existing Travel-Plan-Page renderer. The visible result explains anchors, transfer costs, optional spots, and dropped spots instead of silently omitting selections.

## Scope

Includes Phase 1 normalization, geographic clustering, anchor selection, day allocation, estimated travel-time injection, time scheduling, daily-load and energy checks, explicit decisions, validation, and a Travel-Plan-Page adapter. Excludes live traffic, live weather/ocean conditions, live opening-hours verification, booking APIs, and LLM-authored routing.

## Requirements and acceptance criteria

- Planning uses the existing selected Spot objects and their v6 detail metadata.
- Island allocation happens before within-island scheduling; each island transition consumes a light day.
- Days use one primary anchor, favor one geographic cluster, and reserve Balanced-mode buffer.
- Hard/full-day activities do not get combined into implausible days.
- Every selected spot receives `planned`, `optional`, or `not_recommended` status.
- The plan validates before it is stored for Travel-Plan-Page.
- The adapter preserves the final page schema, maps ticket requirements, and emits route/drive summaries.
- The final page shows a concise planning summary, anchor badges, and daily summaries without exposing internal scores.

## Existing state

`src/App.vue` currently groups selected spots by island, places at most two per row, truncates to eight rows, and writes Travel-Plan-Page data directly. This can silently omit later selections and has no explicit capacity, energy, clustering, travel-time, or validation model. `public/generated-plan/selection-bridge.js` already supplies the stored data to the open-source renderer.

## Proposed design

Planner domain modules live under `src/planner/`. UI supplies a `PlannerInput` and existing Spot records. The engine normalizes those records with deterministic catalog metadata and an injected travel-time provider. A heuristic allocator builds island-local days, schedules anchors first, checks load/energy, and returns explicit decisions plus validation. `adapter.ts` converts only a valid or partial result into the existing renderer contract. Estimated travel legs are labeled as estimates.

## Milestones

1. Implement types, metadata normalization, travel-time provider, and focused tests.
2. Implement allocation, scheduling, decisions, validation, and adapter.
3. Connect the existing generate action and add minimal final-page explanation UI.
4. Run focused tests and production build; record limitations.

## Progress

- [x] Read the strategy and inspect the existing renderer contract.
- [x] Implement deterministic planner modules and tests.
- [x] Replace the inline grouping projection with the planner and adapter.
- [x] Add minimal final-page summaries and anchor indicators.
- [x] Validate syntax, formatting, and the production build. The focused Vitest process did not complete in this environment and is recorded below.

## Decisions

- 2026-09-13: Use an injected deterministic fallback travel-time provider because no production routing provider is connected; every resulting drive time is marked estimated.
- 2026-09-13: Keep the current fixed travel dates and flight records as P0 constraints; use September 27 through October 4 as the eight full planning days and treat September 26 and October 5 as arrival/departure boundaries.
- 2026-09-13: Default to Balanced pace because no preference form currently exists.

## Risks and mitigations

- Missing coordinates and real travel-time matrix: use explicit cluster metadata and conservative estimated travel penalties, label estimates, and keep the provider replaceable.
- Missing verified opening hours: do not invent them; surface reservation/access notes and warn that current access must be checked.
- Existing local selections may exceed eight-day capacity: preserve every selection in the decision list and expose optional/not-recommended reasons.
- Final renderer compatibility: isolate conversion in one adapter and keep renderer changes additive.

## Validation

Run focused planner tests with `npx vitest run src/planner`, then `npx prettier --check` on touched files and `npx vite build`. Attempt repository typecheck; record the known non-terminating behavior if it recurs.

## Results and follow-ups

The selected-spot flow now passes through a deterministic planner and adapter before opening Travel-Plan-Page. It allocates island days, groups nearby spots, selects daily anchors, reserves transfer/load buffers, marks ticketed items, and records a visible outcome for every selection. The final renderer shows anchor and day summaries plus optional/not-recommended explanations.

Validation completed on 2026-09-13:

- `node --check public/generated-plan/selection-bridge.js` passed.
- `node --check public/generated-plan/app.js` passed.
- Prettier check for all touched files passed.
- `./node_modules/.bin/vite build` passed (21 modules; 2m 41s).
- The focused Vitest command was attempted multiple times but remained silent and non-terminating for more than three minutes, so it was stopped. Four focused test cases are committed for the planner and should be rerun when the repository's Vitest startup issue is resolved.

Live routing, traffic, weather/ocean conditions, opening-hour verification, and booking inventory remain intentionally out of Phase 1. The travel-time provider is injectable; current drive times are conservative cluster estimates and are labeled as such in the output.
