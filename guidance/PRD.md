# Product Requirements Document

## Product

Peblo TV Mini

## Problem

Peblo's content team needs an internal CMS for managing shows, seasons, episodes and artwork.

The system must validate content before publication and generate a published catalogue that the viewer-facing application consumes.

## Target Users

### Primary: Content Editor

A non-engineering internal user who manages content frequently.

They need to:

- browse content
- search and filter
- create/edit shows, seasons and episodes
- upload artwork
- understand validation errors
- know what prevents publication

### Secondary: Admin

An internal user with all editor capabilities plus permission to publish the catalogue.

### Viewer

A child/family-facing user who browses the published catalogue.

The viewer must never access internal admin APIs.

---

# Product Flow

Editor
→ creates/manages content
→ backend validates content
→ Admin reviews validation report
→ Admin publishes
→ catalogue is atomically updated
→ Viewer reads published catalogue

---

# MVP Scope

## Backend

- PostgreSQL database
- migrations
- shows
- seasons
- episodes
- artwork records
- users/roles
- publish runs
- CRUD APIs
- authentication
- authorization
- artwork upload
- server-side validation
- validation report
- catalogue publishing
- atomic catalogue replacement
- idempotent publishing
- catalogue endpoint
- catalogue search
- health endpoint
- tests

## CMS

- login
- content list
- search
- filters
- pagination
- create/edit forms
- artwork upload
- artwork previews
- validation errors
- publish page
- publish history
- permission-denied state
- loading/empty/error states

## Viewer

- featured hero
- section rows
- poster cards
- episode lists
- show detail
- seasons
- grouped language variants
- search
- category filter
- language filter
- empty states
- slow-image handling

## Infrastructure

- Docker Compose
- PostgreSQL
- API
- CMS
- Viewer
- seed data
- GitHub Actions
- lint
- tests
- image builds
- `.env.example`
- health endpoint

---

# Explicit Business Rules

1. Season 0 represents trailers.
2. Season 0 must not appear as a normal season in the viewer.
3. Episodes with the same `content_group` are language variants of one episode.
4. Language variants must collapse into one catalogue entry.
5. `(content_group, language)` must be unique.
6. Published episodes require artwork and duration.
7. Published shows require a section.
8. Only published shows and episodes enter the catalogue.
9. Catalogue ordering must be deterministic.
10. Viewer uses published catalogue data only.
11. Editor can CRUD but cannot publish.
12. Admin can CRUD and publish.

---

# Artwork Requirements

| Type | Aspect | Target | Maximum |
|---|---|---|---|
| Poster | 2:3 | 600×900 | 200 KB |
| Banner | 16:9 | 1280×720 | 200 KB |
| Thumbnail | 16:9 | 640×360 | 200 KB |

Backend validation is authoritative.

---

# Success Criteria

The system should allow a reviewer to:

1. start the application with Docker Compose
2. access the CMS
3. authenticate as editor/admin
4. inspect seeded data
5. see validation problems
6. fix content
7. publish as admin
8. inspect publish history
9. open the viewer
10. browse the published catalogue
11. search/filter
12. inspect grouped language variants

---

# Non-Goals

Do not build:

- video streaming
- payments
- subscriptions
- recommendations
- analytics dashboards
- social features
- mobile applications
- real Cloudflare deployment
- unnecessary microservices
- unnecessary AI functionality

Stretch goals are deferred until the complete MVP is stable.
