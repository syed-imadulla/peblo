# Peblo TV

A full-stack, production-grade streaming media platform built for the **Peblo Full-Stack Platform Engineer Challenge**.

Peblo TV comprises an internal content management system (**CMS**), a **FastAPI** backend with an atomic catalogue publishing pipeline, a **PostgreSQL** database, and a high-performance **Viewer UI** serving a Netflix-style streaming experience to end users.

---

## Challenge Overview

The objective of this challenge is to build a three-tier video streaming architecture:
1. **Internal CMS (React + Vite):** A content operations interface where editors manage shows, seasons, and episodes, upload multi-format artwork, inspect validation reports, and trigger catalogue publication.
2. **Backend API & Publishing Engine (FastAPI + PostgreSQL):** A service providing JWT authentication, server-side RBAC, PIL-based artwork validation, and an in-memory catalogue compiler that outputs an atomic, deterministic `catalogue.json` static artifact.
3. **Viewer UI (React + Vite):** A standalone, read-only OTT streaming client that consumes the static catalogue without database dependencies.

---

## Key Highlights

- **Atomic Publishing Engine:** Catalogue compilation occurs entirely in memory and writes to a temporary file before performing an atomic `os.replace` rename, guaranteeing zero partial reads.
- **Content Grouping & Language Variant Collapsing:** Multi-language episode variants sharing a `content_group` collapse into a single catalogue entry with an interactive language selector (`languages: ["en", "hi"]`).
- **Season 0 Trailer Isolation:** Promotional trailers in Season 0 are extracted from standard season hierarchies into a top-level `trailers` array and rendered in a dedicated UI tab.
- **Server-Side PIL Artwork Validation:** Enforces exact aspect ratios (Poster 2:3, Banner 16:9, Thumbnail 16:9) and a strict 200 KB size ceiling with editor-friendly error messages.
- **Storage Provider Abstraction:** A unified `StorageProvider` interface (`read`, `write`, `rename`, `delete`) decoupling business logic from the underlying storage mechanism (Local Disk vs. Cloudflare R2 / S3).
- **Strict Role-Based Access Control (RBAC):** Server-side gating distinguishing `admin` (full CRUD + publishing) from `editor` (CRUD only, 403 on publish).
- **Zero-DB Viewer Independence:** The Viewer application communicates only with `/catalog` and `/catalog/search`, protecting PostgreSQL from viewer traffic spikes.

---

## Architecture

```mermaid
flowchart TD
    subgraph Clients["Frontend Layer (React + Vite)"]
        CMS["Internal CMS (Port 3000)<br/>Content Editors & Admins"]
        Viewer["Viewer UI (Port 3001)<br/>End-User Streaming Experience"]
    end

    subgraph ReverseProxy["Nginx Reverse Proxies"]
        CMS_Nginx["CMS Nginx Proxy<br/>/api/* & static bundle"]
        Viewer_Nginx["Viewer Nginx Proxy<br/>/catalog & static bundle"]
    end

    subgraph BackendServices["Backend Services"]
        API["FastAPI Backend (Port 8000)<br/>Auth • RBAC • CRUD • Validation"]
        PublishEngine["Publishing Engine<br/>Variant Grouping • Atomic Swap"]
    end

    subgraph StorageLayer["Data & Storage Layer"]
        DB[("PostgreSQL 15<br/>Shows • Seasons • Episodes • Users")]
        Storage["Storage Abstraction<br/>LocalStorageProvider / Cloudflare R2"]
        CatalogFile["catalogue.json<br/>Pre-compiled Static Catalogue"]
        MediaAssets["Media Assets<br/>Posters • Banners • Thumbnails"]
    end

    CMS --> CMS_Nginx --> API
    Viewer --> Viewer_Nginx --> API
    Viewer_Nginx -.->|Direct Static Read| CatalogFile

    API --> DB
    API --> PublishEngine
    PublishEngine -->|1. In-Memory Compile| PublishEngine
    PublishEngine -->|2. Atomic os.replace| CatalogFile
    API --> Storage
    Storage --> MediaAssets
```

### Architectural Decisions

1. **Viewer Isolation:** The Viewer UI never connects to PostgreSQL or Admin API endpoints. It operates purely against the static `/catalog` and `/catalog/search` endpoints.
2. **Server-Side Enforcement:** Validation rules, file size checks, dimension constraints, and permission checks are enforced in Python, preventing bypass via direct API calls.
3. **Deterministic Catalogue:** Shows, seasons, and episodes are deterministically sorted by ID and numeric order, ensuring idempotent output across publish runs.

---

## Technology Stack

| Domain | Technologies |
|---|---|
| **Backend** | Python 3.11/3.14, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Pillow (PIL), Uvicorn |
| **CMS Frontend** | React 19, Vite, TanStack Query (React Query), React Router v7, Axios, Lucide React |
| **Viewer Frontend** | React 19, Vite, TanStack Query, React Router v7, Lucide React |
| **Database & Storage** | PostgreSQL 15, Local Volume Storage (with Cloudflare R2 abstraction) |
| **Infrastructure & CI** | Docker, Docker Compose, Nginx Reverse Proxy, GitHub Actions |
| **Testing & Tooling** | Pytest (Backend), Vitest (Viewer), Oxlint (Linting) |

---

## Project Structure

```text
peblo-tv-mini/
├── backend/
│   ├── alembic/                # Database migrations (versions 001 - 005)
│   ├── app/
│   │   ├── api/                # API routers (auth, admin, catalog, health, settings)
│   │   ├── core/               # Configuration, security (JWT/RBAC), database sessions
│   │   ├── models/             # SQLAlchemy ORM models (Show, Season, Episode, Artwork, PublishRun)
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   ├── scripts/            # Database seeder (loads 95 seed records)
│   │   └── services/           # Business logic (PublishService, StorageProvider, Validation)
│   ├── tests/                  # Pytest automated test suite (28 tests)
│   ├── Dockerfile              # Multi-stage Python container
│   ├── entrypoint.sh           # DB migration runner, seeder, and Uvicorn launcher
│   └── requirements.txt        # Python dependencies
├── cms/
│   ├── src/
│   │   ├── components/         # Layout, Navbar, AuthProvider, ArtworkUploadSlot
│   │   ├── pages/              # Dashboard, ShowsList, ShowEditor, Publish, Settings, Login
│   │   └── api.js              # Axios client with JWT request interceptors
│   ├── nginx.conf              # Reverse proxy routing /api/* to backend
│   └── Dockerfile              # Multi-stage build (Node -> Nginx)
├── viewer/
│   ├── src/
│   │   ├── components/         # Header, HeroBanner, ContentRow, ShowCard, LanguageContext
│   │   ├── pages/              # Home, Browse, ShowDetails, EpisodePlayer, Search
│   │   └── api.js              # Read-only catalog API client
│   ├── tests/                  # Vitest component and catalog test suites (33 tests)
│   ├── nginx.conf              # Reverse proxy routing /catalog to backend
│   └── Dockerfile              # Multi-stage build (Node -> Nginx)
├── docs/                       # Contracts, specifications, and challenge seed data
├── guidance/                   # Architecture, rules, memory, and PRD specifications
├── docker-compose.yml          # Multi-container orchestration
└── .github/workflows/ci.yml    # GitHub Actions CI pipeline
```

---

## Core Functionalities

### 1. Multilingual Content Management & Collapsing
Episodes sharing a `content_group` represent language variants of the same episode (e.g. English audio vs. Hindi audio).
- In the CMS, variants are managed as individual episode records with distinct language codes.
- During publication, the engine groups variants by `content_group`, merging distinct language codes into a unified `languages: ["en", "hi"]` array.
- In the Viewer UI, the show details view renders a single episode card with an interactive language selector, eliminating duplicate cards.

### 2. Season 0 / Trailer Isolation
- `Season 0` is designated exclusively for promotional trailers.
- The publishing compiler separates Season 0 entries from standard `seasons` and nests them under `trailers: [...]` on the show object.
- The Viewer UI displays trailers in a dedicated "Trailers & Previews" tab, preventing them from appearing in standard season listings.

### 3. Server-Side Artwork Validation
Artwork uploads are validated server-side in [`backend/app/services/storage.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/services/storage.py) using Pillow:
- **Poster:** 2:3 aspect ratio (~600×900 px)
- **Banner:** 16:9 aspect ratio (~1280×720 px)
- **Thumbnail:** 16:9 aspect ratio (~640×360 px)
- **Size Limit:** 200 KB maximum ceiling.
- **Actionable Feedback:** Errors explicitly inform editors of the detected dimensions and required aspect ratio (e.g. *"Image aspect ratio 1.0 does not match required 16:9 for thumbnail"*).

### 4. Validation Engine & Pre-Flight Checklist
The CMS queries `GET /admin/validation-report` before publication. Issues are categorized into:
- **Critical (Blocks Publish):** Missing artwork or missing duration on published episodes, or published show missing a section.
- **Warning:** Missing artwork/duration on draft episodes.
- **Info:** Informational notes (e.g. missing episode synopses).
- The "Publish" button is automatically disabled with explicit reasons when critical issues exist.

---

## Publishing Pipeline

```text
[ PostgreSQL Database ]
         │
         ▼
[ In-Memory Query & Filter ] ──► (Filter published shows & episodes)
         │
         ▼
[ Structure Transformation ] ──► (Group content_group variants, isolate Season 0 trailers)
         │
         ▼
[ Deterministic Sort ]       ──► (Sort by show ID, season number, episode number)
         │
         ▼
[ Atomic File Swap ]         ──► (Write catalogue_temp_<uuid>.json -> os.replace -> catalogue.json)
         │
         ▼
[ Audit Log Recording ]      ──► (Record run_id, duration, counts, status in publish_runs table)
```

- **Guarantees:** Deterministic ordering, atomic file replacement, and complete audit logging on every run.

---

## Authentication & RBAC

Authentication uses JWT bearer tokens issued via `POST /auth/login`.

| Role | Shows / Episodes CRUD | Image Upload | View Reports | Trigger Publish | Update Settings |
|---|:---:|:---:|:---:|:---:|:---:|
| **Admin** (`admin`/`admin`) | Yes | Yes | Yes | **Yes** | **Yes** |
| **Editor** (`editor`/`editor`) | Yes | Yes | Yes | **No (403 Forbidden)** | **No (403 Forbidden)** |
| **Unauthenticated** | No (401) | No (401) | No (401) | No (401) | No (401) |

---

## Data Model

```text
Show (1) ───< Season (Many) ───< Episode (Many) ───< Artwork (Many)
  │
  ├── id (UUID, PK)
  ├── title, slug, synopsis, section, status, categories
  │
Season
  ├── id (UUID, PK), show_id (FK)
  ├── season_number (Integer)  [0 = Trailers, 1+ = Regular]
  │
Episode
  ├── id (UUID, PK), season_id (FK)
  ├── episode_number, title, synopsis, duration_seconds
  ├── content_group (String, indexed)
  ├── language (String, indexed)
  ├── status ("draft" | "published")
  │
Artwork
  ├── id (UUID, PK), episode_id (FK)
  ├── slot_type ("poster" | "banner" | "thumbnail")
  ├── url, width, height, file_size_bytes
  │
PublishRun
  ├── id (UUID, PK), triggered_by (FK -> User)
  ├── status ("success" | "failed")
  ├── duration_seconds, published_records, blocked_records
```

---

## API Reference

### Authentication & Health
- `POST /auth/login` — Authenticate user and return JWT token.
- `GET /health` — Health check endpoint verifying database connectivity (`SELECT 1`).

### Viewer Endpoints (Static / Read-Only)
- `GET /catalog` — Fetch full published catalogue JSON.
- `GET /catalog/search?q=&category=&language=&section=` — Search catalogue with composable query parameters.

### CMS & Admin Management (Authenticated)
- `GET /admin/shows` — List all shows with pagination and filters.
- `POST /admin/shows` — Create a new show.
- `GET /admin/shows/{id}` — Get show details with seasons and episodes.
- `PUT /admin/shows/{id}` — Update show metadata.
- `DELETE /admin/shows/{id}` — Delete show.
- `POST /admin/episodes` — Create a new episode.
- `PUT /admin/episodes/{id}` — Update episode metadata.
- `DELETE /admin/episodes/{id}` — Delete episode.
- `POST /admin/artwork/upload` — Upload and validate an image file.
- `GET /admin/validation-report` — Retrieve pre-flight validation report.
- `POST /admin/catalog/publish` — Trigger catalogue compilation and atomic publishing (Admin only).
- `GET /admin/publish-history` — Retrieve paginated publish run audit logs.
- `GET /admin/settings` — Get system configuration settings.
- `PUT /admin/settings/site` — Update site settings (Admin only).

---

## Running Locally

### Docker Workflow (Recommended)

1. Clone the repository and copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Build and launch all containers in detached mode:
   ```bash
   docker compose up --build -d
   ```

3. Verify container health:
   ```bash
   docker compose ps
   ```

### Docker Services & Ports

| Service | Container Name | Host Port | Internal Port | Description |
|---|---|---|---|---|
| **CMS** | `peblo-tv-mini-cms-1` | `3000` | `80` | Internal Content Management System |
| **Viewer** | `peblo-tv-mini-viewer-1` | `3001` | `80` | Streaming Browse UI |
| **API** | `peblo-tv-mini-api-1` | `8000` | `8000` | FastAPI Backend & Publishing Engine |
| **Database** | `peblo-tv-mini-db-1` | `5432` | `5432` | PostgreSQL 15 Database |

### Demo Credentials

| Role | Username | Password | Assigned Permissions |
|---|---|---|---|
| **Admin** | `admin` | `admin` | Full CRUD, Artwork Upload, Validation, Publishing, System Settings |
| **Editor** | `editor` | `editor` | Full CRUD, Artwork Upload, Validation (Publishing & Settings blocked with 403) |

---

## Testing & Verification

### Running Automated Tests

#### 1. Backend Pytest Suite (28 Tests)
```bash
cd backend
DATABASE_URL=postgresql://peblo_user:peblo_password@localhost:5432/peblo_db pytest tests/ -v
```
**Result:** `28 passed in 1.72s` (100% pass rate).

#### 2. Viewer Vitest Suite (33 Tests)
```bash
cd viewer
npm test
```
**Result:** `8 test files passed, 33 tests passed` (100% pass rate).

#### 3. Production Builds & Linting
```bash
# CMS Build & Lint
cd cms && npm run build && npm run lint

# Viewer Build & Lint
cd viewer && npm run build && npm run lint
```
**Result:** 0 build errors, 0 lint errors.

---

## Challenge Requirement & Scoring Coverage

| Challenge Area | Scoring Weight | Implementation Details | Evidence Files |
|---|:---:|---|---|
| **Upload & Validation** | 15 pts | Enforces 3 artwork slots (Poster 2:3, Banner 16:9, Thumbnail 16:9), 200 KB size ceiling, Pillow aspect ratio check, and unified `StorageProvider` abstraction. | [`backend/app/services/storage.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/services/storage.py)<br>[`backend/app/api/admin.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/api/admin.py)<br>[`cms/src/components/ArtworkUploadSlot.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/cms/src/components/ArtworkUploadSlot.jsx) |
| **Publish Job** | 20 pts | In-memory catalogue compiler, `content_group` language collapsing, Season 0 trailer extraction, atomic `os.replace` file swap, and audit logging in `publish_runs`. | [`backend/app/services/publish.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/services/publish.py)<br>[`backend/tests/test_publish.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/tests/test_publish.py) |
| **API Design & Auth** | 15 pts | JWT bearer authentication on `/auth/login`, server-side RBAC dependency guards (`admin` vs `editor`), composable `/catalog/search` filters, and honest HTTP status codes. | [`backend/app/api/auth.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/api/auth.py)<br>[`backend/app/core/security.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/core/security.py)<br>[`backend/app/api/catalog.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/api/catalog.py) |
| **Data Modelling** | 10 pts | Normalized relational schema (Show → Season → Episode → Artwork), 5 clean Alembic migrations, indexes on foreign keys and `(content_group, language)`. | [`backend/app/models/models.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/models/models.py)<br>[`backend/alembic/versions/`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/alembic/versions/) |
| **CMS Usability** | 15 pts | Search/filter/pagination tables, 3 labelled artwork upload slots with live previews, multi-tier validation report, pre-flight checklist, and disabled publish button with explicit reasons. | [`cms/src/pages/ShowsList.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/cms/src/pages/ShowsList.jsx)<br>[`cms/src/pages/Publish.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/cms/src/pages/Publish.jsx) |
| **Viewer UI** | 10 pts | Netflix-style dark UI with hero banner (16:9), category rows (2:3 posters), episode thumbnails (16:9), Season 0 trailer tab, language selector, and real-time search. | [`viewer/src/pages/Home.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/viewer/src/pages/Home.jsx)<br>[`viewer/src/pages/ShowDetails.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/viewer/src/pages/ShowDetails.jsx)<br>[`viewer/src/pages/Search.jsx`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/viewer/src/pages/Search.jsx) |
| **Pipeline & Operability** | 10 pts | Single-command Docker Compose setup, automatic 95-record database seeding, `/health` endpoint running `SELECT 1`, `.env.example`, and GitHub Actions CI workflow. | [`docker-compose.yml`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/docker-compose.yml)<br>[`backend/entrypoint.sh`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/entrypoint.sh)<br>[`.github/workflows/ci.yml`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/.github/workflows/ci.yml) |
| **Written Reasoning** | 5 pts | Comprehensive written responses to all 5 Part E trade-off questions documented in the README. | [`README.md`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/README.md) (Section: Written Engineering Decisions) |

---

## Part E: Written Engineering Decisions & Trade-Offs

### 1. How Atomic Publishing Works & Crash Resilience
- **Implementation:** The publishing pipeline compiles the entire catalogue in memory and serializes it to a validated JSON string. It writes the payload to a temporary file (`catalogue_temp_<uuid>.json`) and performs an atomic filesystem rename (`os.replace`) to `catalogue.json`.
- **Failure Scenario:** If the server crashes or the process is killed mid-compilation or mid-write:
  - The temporary file remains orphaned and is ignored.
  - The live `catalogue.json` remains completely untouched and valid.
  - Viewers never observe a partial or malformed file.
  - The failure is logged in the `publish_runs` database table with status `failed`.

### 2. Storage Abstraction & Cloudflare R2 Migration Strategy
- **Implementation:** File operations are decoupled via a `StorageProvider` interface defining `read()`, `write()`, `rename()`, and `delete()`.
- **R2 Migration Plan:**
  1. Implement `R2StorageProvider` using `boto3` configured with Cloudflare R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
  2. Implement atomic swapping via S3 `copy_object` (copy temp key to `catalogue.json`) followed by `delete_object` (delete temp key).
  3. Swap the provider in `app/services/storage.py` via configuration flag (`STORAGE_BACKEND=r2`). No business logic or API endpoints require modification.

### 3. Search Implementation, Scaling Limits & Evolution
- **Implementation:** `GET /catalog/search` reads the compiled `catalogue.json` and evaluates query tokens across show titles, episode titles, synopses, and categories, combined with language and section filters.
- **Scaling Limits:**
  - **Optimal Scale:** 100 to 1,000 shows (sub-millisecond response time).
  - **Bottleneck Threshold:** At 10,000+ shows or high concurrent traffic, linear array scans and repeated in-memory JSON parsing consume excess CPU and memory.
- **Evolution at Scale:**
  1. Offload search to a dedicated search index (**Elasticsearch**, **OpenSearch**, or **Algolia**).
  2. During the publish pipeline, sync compiled catalogue records directly to the search index.
  3. Update `GET /catalog/search` to query the search engine with full-text scoring, typo tolerance, and faceted filtering.

### 4. Pre-Published Catalogue vs. Dynamic Database Queries
- **Why Pre-Publish?**
  - **Read Performance:** Serving static JSON allows edge caching on CDNs with sub-10ms global latency.
  - **Database Protection:** Thousands of concurrent viewers stream content without issuing a single query to PostgreSQL.
- **Trade-Offs & Downsides:**
  - **Publish Latency:** CMS edits are not instantly visible; an explicit publish run is required.
  - **Personalization Constraints:** Because all viewers fetch the same static catalogue artifact, user-specific recommendations and watch progress cannot be baked into the static file and must be layered dynamically on the client.

### 5. Scope Management & AI Tool Usage
- **Scope Decisions:** Prioritized correctness, Docker reproducibility, RBAC security, and atomic publishing over non-essential stretch features (e.g. multi-version catalogue rollback UI).
- **AI Tool Usage & Judgment:** AI assistance was used for scaffolding boilerplate React components, writing test matrix cases, and drafting initial Nginx configs. AI outputs were reviewed and refactored to enforce strict architectural separation (preventing Viewer from accessing CMS/Admin APIs), correct Nginx named-location proxying, and ensure proper PIL aspect ratio validation.

---

## Production Operability, Secrets Management & Alerting

### 1. Secrets Management in Production
In production, sensitive environment variables (`DATABASE_URL`, `JWT_SECRET`, R2 credentials) should **never** be stored in `.env` files or Git repositories:
- Secrets are stored in a managed secrets service (**AWS Secrets Manager**, **HashiCorp Vault**, or **GCP Secret Manager**).
- Container orchestrators (AWS ECS / Kubernetes) inject secrets into environment variables at runtime via IAM role authorization.
- JWT signing keys are rotated periodically using asymmetric keys (RS256 with public/private key pairs).

### 2. Health Monitoring & Alerting Strategy
The backend exposes `GET /health`, which actively executes `SELECT 1` against PostgreSQL:
- **Primary Alert Rule:** Trigger a P1 alert if `GET /health` returns non-200 or fails 3 consecutive health checks over 60 seconds (indicates API outage or database connection pool exhaustion).
- **Edge CDN Alert Rule:** Trigger an alert if CDN error rates (`5xx`) on `/catalog` exceed 0.5% over a 5-minute window.

### 3. Continuous Integration (`.github/workflows/ci.yml`)
The GitHub Actions workflow runs on every push and pull request to `main`:
1. **Backend Test Job:** Boots a PostgreSQL service container, runs Alembic migrations, and executes `pytest`.
2. **Viewer Test Job:** Installs dependencies and runs `vitest` unit/component suites.
3. **CMS Build Job:** Validates TypeScript/JSX compilation and bundles production assets with Vite.
4. **Docker Build Job:** Builds all container images (`backend`, `cms`, `viewer`) to validate build integrity.

---

## Known Limitations & Intentional Scope Boundaries

1. **Static Personalization:** Recommendations and watch progress are managed on the client side because the catalogue is pre-compiled as a static JSON artifact.
2. **Search Scaling:** Search is optimized for catalogues up to ~1,000 shows; scaling beyond this threshold requires transitioning from in-memory array scans to an external search index (e.g. Elasticsearch).
3. **Catalogue Rollback UI:** Rollback to historical catalogue versions was intentionally omitted in favor of solidifying core publish guarantees, atomic file operations, and container reliability.
