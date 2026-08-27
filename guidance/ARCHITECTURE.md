# Architecture

## Architecture Style

Use a modular monolithic backend with two React applications.

Do not introduce microservices.

## System

                    ┌─────────────────┐
                    │   CMS React     │
                    │ Internal        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ FastAPI         │
                    │                 │
                    │ Auth            │
                    │ CRUD            │
                    │ Validation      │
                    │ Publishing      │
                    │ Search          │
                    └───────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │ PostgreSQL      │   │ Storage         │
        │                 │   │                 │
        │ Content         │   │ Artwork         │
        │ Users           │   │ Catalogue       │
        │ Publish runs    │   │                 │
        └─────────────────┘   └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Viewer React    │
                              │ Published data  │
                              └─────────────────┘

## Technology

### Backend

- Python
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL
- Alembic
- Pydantic
- JWT authentication
- pytest

### Frontend

- React
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- React Router

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions

## Backend Modules

backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── storage/
│   ├── auth/
│   └── main.py
├── migrations/
├── tests/
└── Dockerfile

## Important Service Boundaries

### ValidationService

Owns business validation.

### ArtworkService

Owns artwork validation and upload handling.

### StorageService

Abstract interface for file storage.

Implement:

- LocalStorage

Design so Cloudflare R2 can later be implemented without changing business logic.

### CatalogueService

Builds the published catalogue from publishable database content.

### PublishService

Coordinates:

1. validation
2. catalogue generation
3. deterministic serialization
4. atomic storage replacement
5. publish-run recording

### SearchService

Searches published catalogue data server-side.

The browser must not download the entire catalogue and perform the authoritative search itself.

---

# Database

Core entities:

User
Show
Season
Episode
Artwork
PublishRun

Relationships:

User
  └── publish runs

Show
  └── Seasons
       └── Episodes
            └── Artwork

Artwork should support:
- owner/entity association
- artwork type
- storage key
- dimensions
- file size
- metadata

---

# Catalogue

The database is the internal source of truth.

The catalogue is the published read model.

Flow:

Database
→ validate
→ build catalogue
→ serialize deterministically
→ write temporary object/file
→ atomically switch live catalogue
→ record publish run

The viewer reads the published catalogue, not PostgreSQL.

---

# Atomic Publishing

Never truncate or directly overwrite the live catalogue.

Use:

1. generate complete catalogue
2. write temporary/new object
3. ensure write succeeds
4. atomically replace/switch the live reference

For local filesystem storage, use an atomic same-filesystem replacement strategy.

If publishing fails before the switch:

- old catalogue remains live
- failed publish run is recorded

A reader must always see either the previous complete catalogue or the new complete catalogue.

---

# Idempotency

Publishing the same database state repeatedly must not create duplicate catalogue entries or inconsistent results.

Catalogue generation must be deterministic.

Use a stable serialization strategy and content hash where useful.

Repeated publication of unchanged content should result in the same logical catalogue.

---

# Language Grouping

Database may contain:

Episode A
content_group = xyz
language = en

Episode B
content_group = xyz
language = hi

Catalogue must contain one logical episode:

languages = ["en", "hi"]

Do not group merely by title.

Use content_group as the grouping key.

---

# Season 0

Season 0 is trailer-only.

The viewer must not render Season 0 as a normal season.

Catalogue design may expose trailer information separately if needed.

---

# Search

Endpoint:

GET /catalog/search

Parameters:

- q
- category
- language
- section

`q` must match:

- show title
- episode title
- category

Filters compose using AND semantics.

Search is performed server-side.

For the challenge-sized catalogue, an in-memory/server-side catalogue search is acceptable if documented.

The README must explain the scaling boundary and the next approach.

---

# Authentication

Use JWT-based authentication.

Backend determines the user's role.

Never trust frontend role state.

Authorization:

editor:
- CRUD
- no publish

admin:
- CRUD
- publish

Viewer:
- catalogue endpoints only

---

# API Surface

Minimum:

POST /auth/login

GET/POST/PATCH/DELETE show resources
GET/POST/PATCH/DELETE season resources
GET/POST/PATCH/DELETE episode resources

POST /admin/artwork

POST /admin/catalog/publish

GET /catalog

GET /catalog/search

GET /admin/validation-report

GET /admin/publish-runs

GET /health

Exact REST structure may be refined during implementation, but must remain sensible and documented.

---

# Frontend Boundaries

CMS:
- authenticated
- talks to admin/API endpoints

Viewer:
- public
- reads published catalogue
- never calls admin endpoints

Keep CMS and Viewer independently understandable.

---

# Testing Priority

Highest priority:

1. publish atomicity
2. language grouping
3. idempotent publishing
4. validation rules
5. artwork validation
6. role enforcement
7. search/filter composition
