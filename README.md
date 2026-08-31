# Peblo TV Mini

A production-grade, miniature streaming media platform built for the **Peblo Full-Stack Platform Engineer Challenge**.

Peblo TV comprises an internal content management system (**CMS**), a **FastAPI** backend with an atomic catalogue publishing pipeline, and a high-performance **Viewer UI** serving a Netflix-style streaming experience to end users.

---

## Quick Start

Run the entire platform (PostgreSQL, FastAPI Backend, CMS, and Viewer) using Docker Compose:

```bash
docker compose up --build -d
```

### Access Points & Credentials

| Service | URL | Notes / Credentials |
|---|---|---|
| **Viewer UI** | [http://localhost:3001](http://localhost:3001) | Read-only streaming interface (zero database access) |
| **Internal CMS** | [http://localhost:3000](http://localhost:3000) | **Admin:** `admin` / `admin` (Full CRUD + Publishing)<br>**Editor:** `editor` / `editor` (CRUD only) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | Swagger documentation at `/docs` |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Returns DB connection status |

---

## System Architecture

```mermaid
flowchart TD
    subgraph Clients["Frontend Layer (React + Vite)"]
        CMS["Internal CMS (Port 3000)<br/>Content Editors & Admins"]
        Viewer["Viewer UI (Port 3001)<br/>End-User Streaming Experience"]
    end

    subgraph ReverseProxy["Nginx Reverse Proxies"]
        CMS_Nginx["CMS Nginx Proxy<br/>/api/* & static assets"]
        Viewer_Nginx["Viewer Nginx Proxy<br/>/catalog & static assets"]
    end

    subgraph BackendServices["Backend Services"]
        API["FastAPI Application (Port 8000)<br/>Auth • RBAC • CRUD • Validation"]
        PublishEngine["Publishing Engine<br/>Variant Grouping • Atomic Swap"]
    end

    subgraph DataStorage["Storage Layer"]
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

### Architecture Principles

1. **Strict Viewer Independence:** The Viewer UI reads exclusively from `/catalog` and `/catalog/search`. It does not touch the PostgreSQL database, ensuring complete operational database isolation during viewer traffic spikes.
2. **Server-Side Authorization & RBAC:** Role restrictions (`admin` vs `editor`) and schema validations are enforced strictly on the backend via FastAPI dependency injection and JWT claims.
3. **Atomic Catalogue Updates:** Catalogue publishing is performed in memory and written atomically to disk using temporary file writes and `os.replace`, guaranteeing readers never observe partial or corrupted JSON files.
4. **Storage Abstraction:** Storage operations implement a unified `StorageProvider` interface, allowing seamless switching between local disk and Cloudflare R2 / S3 without modifying business logic.

---

## Key Highlights & Features

### 1. Internal CMS (`/cms`)
- **Show & Episode Management:** Search, multi-criteria filtering (section, status, language), and paginated inventory tables.
- **Three Labelled Artwork Slots:** Dedicated upload inputs for **Poster** (2:3), **Banner** (16:9), and **Thumbnail** (16:9) with live image previews and human-readable aspect ratio and file size error messages.
- **Publishing & Validation Dashboard:** Multi-tier validation engine classifying issues into **Critical** (blocks publish), **Warning** (action recommended), and **Info** (metadata notes).
- **Pre-Flight Checklist:** Interactive checklist displaying publish readiness; the "Publish" button is automatically disabled with explicit reasons when critical issues exist.
- **Audit & Publish History:** Full log of past publish executions with timestamp, executing admin, duration, published/blocked record counts, and status.

### 2. Viewer Streaming UI (`/viewer`)
- **Netflix-Style Browse:** Immersive dark-mode interface featuring a dynamic hero banner, horizontal section carousels (*Featured*, *Minisodes*, *Series*, *Songs*), and show poster cards.
- **Surface-Specific Artwork:** Automatically renders 16:9 banners on hero carousels, 2:3 posters on category rows, and 16:9 thumbnails on episode lists.
- **Multilingual Variant Handling:** Collapses episodes sharing the same `content_group` into a single catalogue entry with an interactive language selector (e.g. English / Hindi).
- **Season 0 Trailer Isolation:** Isolates Season 0 into a dedicated "Trailers & Previews" tab, preventing trailers from appearing as standard viewing seasons.
- **Real-Time Composable Search:** Search across show titles, episode titles, synopses, and categories with multi-language and category filter chips.
- **Simulated Video Player:** Episode player with custom controls, language switching, progress simulation, and up-next recommendations.

### 3. Backend & Publishing Engine (`/backend`)
- **Deterministic Catalogue Generation:** In-memory builder sorts shows, seasons, and episodes deterministically by ID and season/episode number.
- **Atomic File Swapping:** Writes compiled catalogue to a temporary file (`catalogue_temp_<uuid>.json`) before executing an atomic rename (`os.replace`) to `catalogue.json`.
- **Fast Search API:** Composable search endpoint (`GET /catalog/search?q=&category=&language=&section=`) evaluating query tokens against show and episode metadata.
- **Image Validation Engine:** PIL-based backend inspection enforcing dimensions, aspect ratios, and the 200 KB size ceiling.

---

## Technology Stack

| Domain | Technologies |
|---|---|
| **Backend** | Python 3.11/3.14, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Pillow (PIL), Uvicorn |
| **CMS Frontend** | React 19, Vite, TanStack Query (React Query), React Router v7, Axios, Lucide React |
| **Viewer Frontend** | React 19, Vite, TanStack Query, React Router v7, Lucide React |
| **Database & Storage** | PostgreSQL 15, Local Volume Storage (with Cloudflare R2 abstraction) |
| **Orchestration & Web** | Docker, Docker Compose, Nginx Reverse Proxy |
| **Testing & Tooling** | Pytest, Vitest, Testing Library, Oxlint |

---

## Project Structure

```text
peblo-tv-mini/
├── backend/
│   ├── alembic/                # Database migrations (versions 001 - 005)
│   ├── app/
│   │   ├── api/                # Route handlers (auth, admin, catalog, health, settings)
│   │   ├── core/               # App configuration, security (JWT/RBAC), database session
│   │   ├── models/             # SQLAlchemy ORM models (Show, Season, Episode, Artwork, PublishRun)
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   ├── scripts/            # Database seeder (loads 95 seed records)
│   │   └── services/           # Business logic (PublishService, StorageProvider, Validation)
│   ├── tests/                  # Pytest automated test suite (28 tests)
│   ├── Dockerfile              # Production Python container
│   ├── entrypoint.sh           # Migration runner, seeder, and Uvicorn launcher
│   └── requirements.txt        # Python dependencies
├── cms/
│   ├── src/
│   │   ├── components/         # Layout, Navbar, AuthProvider, ArtworkUploadSlot
│   │   ├── pages/              # Dashboard, ShowsList, ShowEditor, Publish, Settings, Login
│   │   └── api.js              # Axios client with JWT request interceptors
│   ├── nginx.conf              # Nginx reverse proxy routing /api/* to backend
│   └── Dockerfile              # Multi-stage build (Node -> Nginx)
├── viewer/
│   ├── src/
│   │   ├── components/         # Header, HeroBanner, ContentRow, ShowCard, LanguageContext
│   │   ├── pages/              # Home, Browse, ShowDetails, EpisodePlayer, Search
│   │   └── api.js              # Read-only catalog API client
│   ├── tests/                  # Vitest component and catalog test suites
│   ├── nginx.conf              # Nginx reverse proxy routing /catalog to backend
│   └── Dockerfile              # Multi-stage build (Node -> Nginx)
├── docs/                       # Specifications, contracts, and challenge seed data
├── guidance/                   # Architecture, rules, memory, and PRD specifications
├── docker-compose.yml          # Multi-container orchestration
└── .github/workflows/ci.yml    # GitHub Actions CI pipeline
```

---

## Core Workflows & Logic

### 1. Multilingual Content Grouping
Episodes sharing the same `content_group` represent language variants of the same content item (e.g. English audio vs. Hindi audio). 
- During publishing, the engine groups variants by `content_group`.
- It aggregates all distinct language codes into a single `languages: ["en", "hi"]` array.
- In the Viewer UI, the show page presents a single episode card with a language selector instead of duplicated entries.

### 2. Season 0 / Trailer Isolation
- `Season 0` is reserved exclusively for promotional trailers and previews.
- The publishing compiler isolates Season 0 items from `seasons` and places them into the top-level `trailers: [...]` array on the show object.
- The Viewer UI renders trailers inside a dedicated "Trailers & Previews" tab on the show details screen, keeping standard viewing seasons clean.

### 3. Server-Side Artwork Validation
Artwork uploads are validated server-side in [`backend/app/services/storage.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/services/storage.py) and [`backend/app/api/admin.py`](file:///home/syed-imadulla/Desktop/peblo-tv-mini/backend/app/api/admin.py):
- **Poster:** 2:3 aspect ratio (~600×900 px)
- **Banner:** 16:9 aspect ratio (~1280×720 px)
- **Thumbnail:** 16:9 aspect ratio (~640×360 px)
- **Size Limit:** 200 KB ceiling strictly enforced.
- **Error Formatting:** Rejections provide clear, actionable feedback (e.g., *"File size 245 KB exceeds the 200 KB maximum"* or *"Image aspect ratio 1.0 does not match required 16:9"*).

---

## Authentication & Role-Based Access Control (RBAC)

Authentication is handled via JWT bearer tokens generated on `/auth/login`.

| Role | Shows / Episodes CRUD | Image Upload | View Reports | Trigger Publish | Update Settings |
|---|:---:|:---:|:---:|:---:|:---:|
| **Admin** (`admin`/`admin`) | Yes | Yes | Yes | **Yes** | **Yes** |
| **Editor** (`editor`/`editor`) | Yes | Yes | Yes | **No (403)** | **No (403)** |
| **Unauthenticated** | No (401) | No (401) | No (401) | No (401) | No (401) |

Role permissions are enforced server-side via FastAPI dependencies (`get_current_admin_user` and `get_current_user`).

---

## API Reference

### Authentication & Public Health
- `POST /auth/login` — Authenticate user and receive JWT access token.
- `GET /health` — System health check (verifies database connectivity).

### Viewer Endpoints (Zero Database Dependency)
- `GET /catalog` — Fetch full static published catalogue.
- `GET /catalog/search?q=&category=&language=&section=` — Search catalogue with composable multi-criteria filtering.

### CMS & Admin Management (Authenticated)
- `GET /admin/shows` — List all shows with pagination, status, and category filters.
- `POST /admin/shows` — Create a new show.
- `GET /admin/shows/{id}` — Get show details with seasons and episodes.
- `PUT /admin/shows/{id}` — Update show metadata.
- `DELETE /admin/shows/{id}` — Delete show.
- `POST /admin/episodes` — Create a new episode.
- `PUT /admin/episodes/{id}` — Update episode metadata.
- `DELETE /admin/episodes/{id}` — Delete episode.
- `POST /admin/artwork/upload` — Upload and validate image asset.
- `GET /admin/validation-report` — Retrieve pre-flight publish validation report.
- `POST /admin/catalog/publish` — Trigger atomic catalogue compilation (Admin only).
- `GET /admin/publish-history` — Retrieve paginated publish run audit history.
- `GET /admin/settings` — Get system configuration settings.
- `PUT /admin/settings/site` — Update site branding and metadata (Admin only).

---

## Written Engineering Decisions & Trade-Offs

### 1. Atomic Publishing Guarantees
**Implementation:**
The publishing pipeline compiles the entire catalogue in memory as a Python dictionary and serializes it to a validated JSON string. Instead of writing directly to `catalogue.json` (which risks exposing a partial file if interrupted), the service writes the payload to a uniquely named temporary file (`catalogue_temp_<uuid>.json`) and performs an atomic filesystem rename (`os.replace`) to `catalogue.json`.

**Failure Handling:**
If the process is killed or encounters a crash mid-compilation or mid-write:
- The temporary file remains orphaned and is ignored.
- The live `catalogue.json` file remains completely unmodified and valid.
- Readers never experience downtime or JSON parsing syntax errors.
- The failure is logged in the `publish_runs` database table with status `failed` for administrator inspection.

### 2. Storage Abstraction & Cloudflare R2 Migration
**Implementation:**
The application uses a `StorageProvider` interface defining `read()`, `write()`, `delete()`, and `rename()` methods. Local storage is implemented via `LocalStorageProvider`.

**Migration to Cloudflare R2:**
1. Implement `R2StorageProvider` using `boto3` configured with Cloudflare R2 S3-compatible endpoints and credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
2. Implement atomic swapping via S3 `copy_object` (copy temp key to `catalogue.json`) followed by `delete_object` (delete temp key).
3. Swap the provider in `app/services/storage.py` via configuration flag (`STORAGE_BACKEND=r2`). Zero application business logic or API routes need to change.

### 3. Search Implementation, Scaling Limits & Evolution
**Implementation:**
Search is currently executed in memory by reading the pre-compiled `catalogue.json` and evaluating query tokens across show titles, episode titles, synopses, and categories, combined with language and section filters.

**Scaling Limits:**
- **Optimal Range:** 100 to 1,000 shows (sub-millisecond latency).
- **Bottleneck Threshold:** At 10,000+ shows or high concurrent traffic, linear array iteration and repeated in-memory JSON parsing consume excess CPU and memory.

**Next Steps at Scale:**
1. Integrate a dedicated search engine (e.g. **Elasticsearch**, **OpenSearch**, or **Algolia**).
2. During the publish pipeline, push the compiled catalogue records directly to the search index.
3. The `GET /catalog/search` endpoint delegates queries directly to the index with full-text scoring, typo tolerance, and faceted filtering.

### 4. Static Catalogue Trade-offs
**Why pre-publish a static catalogue?**
- **Maximum Read Performance:** Serving static JSON enables edge caching on CDNs (Cloudflare / CloudFront) with sub-10ms global response times.
- **Database Protection:** Thousands of concurrent viewers stream content without issuing a single query to the operational PostgreSQL database.

**Where does this choice bite?**
- **Publish Latency:** CMS edits are not instant; content requires an explicit publish run to go live.
- **Personalization Constraints:** Because every viewer fetches the same static catalogue artifact, user-specific recommendations, watch progress, and personalized row ordering cannot be baked into the static file and must be layered dynamically via client state.

### 5. Scope Management & AI Tool Usage
- **Scope Decisions:** Prioritized rock-solid correctness, Docker reproducibility, RBAC security, and atomic publishing over non-essential stretch features (e.g. multi-version catalogue rollback UI).
- **AI Tool Usage & Judgment:** AI assistance was used for scaffolding boilerplate React components, generating test matrix cases, and drafting initial Nginx configs. AI outputs were reviewed and refactored to enforce strict architectural separation (preventing Viewer from accessing CMS/Admin APIs), correct Nginx named-location proxying, and ensure proper PIL aspect ratio validation.

---

## Production Operability, CI/CD & Secrets Management

### 1. Secrets Management in Production
In production, sensitive environment variables (`DATABASE_URL`, `JWT_SECRET`, R2 storage keys) should **never** be stored in `.env` files or Git repositories.
- Secrets are stored in a managed secrets vault (**AWS Secrets Manager**, **HashiCorp Vault**, or **GCP Secret Manager**).
- Container runtimes (e.g. AWS ECS / Kubernetes) inject secrets directly into application environment variables at container startup via IAM role authorization.
- JWT signing keys are rotated periodically using asymmetric keys (RS256 with public/private key pairs).

### 2. Health Monitoring & Alerting Strategy
The backend exposes `GET /health`, which actively runs `SELECT 1` against PostgreSQL:
- **Primary Alert Rule:** Trigger a P1 alert if `GET /health` returns non-200 or fails 3 consecutive probes over 60 seconds (indicates API outage or database connection pool exhaustion).
- **Edge CDN Alert Rule:** Trigger an alert if CDN error rates (`5xx`) on `/catalog` exceed 0.5% over a 5-minute window.

### 3. Continuous Integration (`.github/workflows/ci.yml`)
The GitHub Actions workflow runs on every push and PR to `main`:
1. **Backend Test Job:** Boots PostgreSQL service container, runs Alembic migrations, and executes `pytest`.
2. **Viewer Test Job:** Installs dependencies and runs `vitest` unit/component suites.
3. **CMS Build Job:** Validates TypeScript/JSX compilation and bundles production assets with Vite.
4. **Docker Build Job:** Builds all container images (`backend`, `cms`, `viewer`) and validates container integrity.

---

## Verification & Testing

### Running Tests Locally

#### 1. Backend Pytest Suite (28 Tests)
```bash
cd backend
DATABASE_URL=postgresql://peblo_user:peblo_password@localhost:5432/peblo_db pytest tests/ -v
```

#### 2. Viewer Vitest Suite (33 Tests)
```bash
cd viewer
npm test
```

#### 3. Production Build & Lint Checks
```bash
# CMS
cd cms && npm run build && npm run lint

# Viewer
cd viewer && npm run build && npm run lint
```
