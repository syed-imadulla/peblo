# Project Memory

## Current Status

Project initialization.

No production implementation has started.

## Confirmed Requirements

- FastAPI + PostgreSQL
- React + TypeScript
- internal CMS
- separate viewer
- catalogue publishing pipeline
- authentication and roles
- artwork validation
- validation report
- search and filters
- Docker Compose
- GitHub Actions
- health endpoint
- README reasoning
- screen recording

## Confirmed Domain Rules

- Season 0 = trailers
- Season 0 is not a normal viewer season
- content_group identifies language variants
- same content_group collapses into one catalogue episode
- languages must be listed
- published episode requires artwork
- published episode requires duration
- published show requires section
- editor cannot publish
- admin can publish

## Important Architectural Decisions

To be recorded here as implementation progresses.

Format:

### [DATE] Decision

Decision:
...

Reason:
...

Alternatives considered:
...

Consequences:
...

## Known Risks

- catalogue atomicity
- idempotent publishing
- language grouping
- artwork validation
- role enforcement
- seed-data inconsistencies
- search scaling
- Docker reproducibility

## Deferred Work

Stretch goals are intentionally deferred until MVP completion.

## AI Decisions

Record meaningful AI-generated suggestions that were accepted/rejected and why.

## Verification

Do not mark functionality as complete until it has been tested.
