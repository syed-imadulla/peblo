# Implementation Phases

## Phase 0 - Discovery

Goal:
Understand the challenge before coding.

Tasks:

- inspect challenge document
- inspect reference.json
- inspect seed_shows.json
- inspect supplied artwork
- identify all seed inconsistencies
- identify domain rules
- identify catalogue shape
- identify risky areas

Deliverable:

`docs/challenge/DATA_AUDIT.md`

Do not modify seed data.

---

## Phase 1 - Foundation

Build:

- repository structure
- backend project
- database connection
- Docker Compose
- migrations
- frontend projects
- environment configuration

Acceptance:

`docker-compose up` starts the infrastructure.

---

## Phase 2 - Data + Seed

Build:

- models
- migrations
- seed loader
- users
- roles
- shows
- seasons
- episodes
- artwork metadata
- publish runs

Acceptance:

All 95 supplied episode rows can be represented without corrupting source semantics.

---

## Phase 3 - Validation + Artwork

Build:

- artwork upload
- storage abstraction
- image validation
- business validation
- validation report
- human-readable errors

Acceptance:

Invalid artwork is rejected by backend.

Publish-blocking seed problems appear in validation report.

---

## Phase 4 - Authentication + CRUD

Build:

- login
- JWT
- editor authorization
- admin authorization
- show CRUD
- season CRUD
- episode CRUD

Acceptance:

Editor cannot publish.

Admin can publish.

Authorization is enforced server-side.

---

## Phase 5 - Catalogue + Publishing

Highest priority phase.

Build:

- catalogue schema
- deterministic ordering
- content_group grouping
- language aggregation
- Season 0 handling
- publish validation
- atomic storage replacement
- publish run recording
- idempotency
- GET /catalog
- GET /catalog/search

Tests required.

Acceptance:

Publishing twice produces consistent results.

A failed publish never corrupts the currently live catalogue.

---

## Phase 6 - CMS

Build:

- login
- content list
- filters
- pagination
- create/edit forms
- artwork upload UI
- validation messages
- publish page
- publish history
- loading/error/empty/permission states

Acceptance:

A non-engineer can understand what needs fixing without reading backend logs.

---

## Phase 7 - Viewer

Build:

- hero
- section rows
- poster cards
- episode thumbnails
- show detail
- seasons
- language choices
- search
- filters
- empty states
- slow image handling

Acceptance:

Viewer consumes published data only.

Season 0 does not appear as a normal season.

Grouped language variants appear as one episode.

---

## Phase 8 - Operability

Build:

- Docker verification
- seed verification
- GitHub Actions
- lint
- tests
- image builds
- health endpoint
- .env.example
- README
- production secret strategy
- alerting reasoning

Acceptance:

A reviewer can clone and run the project with minimal instructions.

---

## Phase 9 - Final Verification

Run:

- backend tests
- frontend checks
- build
- Docker Compose
- seed
- editor workflow
- admin workflow
- publish workflow
- viewer workflow
- search/filter tests
- permission tests
- artwork tests
- atomic publish test

Then:

- review scoring rubric
- review README
- record demo
- inspect Git history
- remove unnecessary code/dependencies

Only after this consider stretch goals.
