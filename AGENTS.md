# Peblo TV Mini - Engineering Instructions

## Project

This repository implements the Peblo TV Mini take-home challenge.

The authoritative requirements are:

1. `guidance/PRD.md`
2. `guidance/ARCHITECTURE.md`
3. `guidance/RULES.md`
4. `guidance/PHASES.md`
5. `guidance/DESIGN.md`
6. `guidance/MEMORY.md`
7. `docs/challenge/challenge.md`
8. `docs/challenge/reference.json`
9. `docs/challenge/seed_shows.json`

When instructions conflict, prefer:
challenge requirements → guidance files → implementation preferences.

## Before coding

Always inspect the relevant guidance and challenge source files before implementing.

Never invent requirements that are not supported by the challenge or an explicitly documented engineering decision.

Do not modify the original challenge data to make the application easier to build.

## Engineering priorities

Prioritize in this order:

1. Correctness
2. Backend validation
3. Publish pipeline correctness
4. Security and authorization
5. Data integrity
6. Testability
7. Operability
8. CMS usability
9. Viewer UX
10. Visual polish

Do not sacrifice correctness for visual polish.

## AI behavior

Act as a senior engineer, not a code generator.

Before implementing a major feature:

- inspect existing code
- identify affected modules
- explain the intended approach briefly
- implement only what is required
- run relevant tests/checks
- verify the result
- update `guidance/MEMORY.md` when an important architectural decision changes

Do not silently change architecture.

Do not add unnecessary dependencies.

Do not implement stretch goals before the core challenge is complete.

## Challenge-specific boundaries

The viewer must never depend on admin APIs.

Roles must be enforced server-side.

Validation must be enforced server-side.

Publishing must be atomic.

The live catalogue must never be overwritten in-place in a way that can expose a partial file.

Language variants sharing a `content_group` must collapse into one catalogue entry.

Season 0 is trailer-only and must not appear as a normal viewer season.

Artwork requirements must be enforced by the backend.

## Definition of done

A feature is not complete until:

- implementation exists
- error states are handled
- relevant tests exist
- API/UI integration works
- Docker still works
- documentation is updated where necessary
