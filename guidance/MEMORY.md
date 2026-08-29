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

### 2026-08-29 Validation Reporting & Publishing Integrity

Decision:
Implement multi-tier validation reporting (`critical`, `warning`, `info`) in the backend scanning both published and draft episodes, while maintaining strict adherence to challenge.md constraints (blocking issues preventing catalog publishing).

Reason:
Editors and Admins need real-time clarity on what is actively blocking catalog publishing (`missing_artwork`, `missing_duration`, `duplicate_variant` on published episodes) vs upcoming issues on drafts or informational fields.

Consequences:
- `GET /admin/validation-report` and `POST /admin/run-validation` return deterministic, real-time results directly derived from the database.
- The CMS Validation page cleanly renders live metrics, charts, and actionable links without mock or synthetic data.
- Duplicate `content_group` + `language` variants present in seed fixtures (e.g. `motis-many-lives-s01e02 + hi`) are surfaced as critical validation items.

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
