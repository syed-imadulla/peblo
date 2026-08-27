# Engineering Rules

## General

- Prefer simple solutions.
- Prefer boring, maintainable architecture.
- Do not over-engineer.
- Do not introduce microservices.
- Do not add dependencies without justification.
- Do not create abstractions without a real boundary.
- Keep functions/modules focused.

## Backend

Use:

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- PostgreSQL
- pytest

Do not:

- put business logic inside route handlers
- trust frontend validation
- trust frontend roles
- expose database models directly as API contracts
- silently swallow errors
- return vague internal errors to editors

## Validation

Backend validation is authoritative.

Errors should be actionable.

Bad:

"ValidationError"

Good:

"Banner must use a 16:9 aspect ratio and be no larger than 200 KB."

Validate:

- dimensions
- aspect ratio
- file size
- artwork type
- required artwork
- duration
- language
- content_group uniqueness
- section requirements

## Database

Use migrations.

Do not manually modify production schema.

Add indexes only when they support actual query patterns.

Document meaningful indexes.

Use database constraints where appropriate for integrity.

## Publishing

Never directly overwrite/truncate the live catalogue.

Never expose partial catalogue data.

Publishing must:

- validate
- generate deterministic output
- group language variants
- preserve deterministic ordering
- atomically switch the live catalogue
- record the run
- behave safely when repeated

## Search

Do not download the complete catalogue to the browser for authoritative search.

Search/filtering belongs behind the API.

Do not prematurely introduce Elasticsearch/OpenSearch.

Document when the current approach would stop scaling.

## Frontend

Use TanStack Query for server state.

Do not duplicate server state unnecessarily.

Every important async operation must have:

- loading state
- success state
- error state
- empty state where applicable
- permission-denied state where applicable

Forms must show editor-readable errors.

## Viewer

The Viewer must never call:

- admin CRUD endpoints
- validation-report endpoint
- publish endpoints
- user-management endpoints

Viewer data comes from the published catalogue.

## Artwork

Do not rely on browser validation.

Backend checks are mandatory.

Do not silently resize or modify invalid challenge assets unless the product decision explicitly requires it.

## Docker

`docker-compose up` must provide:

- PostgreSQL
- API
- CMS
- Viewer

and the system must be seeded and usable.

Do not require undocumented manual setup.

## AI Boundaries

AI may:

- generate boilerplate
- suggest implementations
- refactor
- write tests
- explain errors

AI must not:

- invent challenge requirements
- modify supplied seed data
- silently change architectural decisions
- add unrelated features
- claim tests passed without actually running them
- claim something works without verification

When AI makes a non-obvious decision, document it.

## Stretch Goals

Do not implement until MVP is stable.

Priority:

1. versioned catalogue / rollback
2. publish dry-run/diff
3. audit log

Never sacrifice core scoring areas for stretch goals.
