# API Contract

This document defines the REST API endpoints required for the Peblo TV Mini challenge. It follows a pragmatic, challenge-focused approach, keeping boundaries distinct between public and internal operations.

## PUBLIC API
These endpoints are consumed by the Viewer app (and CI/CD pipelines). They must NOT require authentication and must ONLY interact with published data.

### 1. Health Check
- **Purpose**: Verify that the API and database are alive.
- **Method & Path**: `GET /health`
- **Auth/Role**: Public
- **Request Shape**: None
- **Response Shape**: `{"status": "ok", "db": "connected"}`
- **Status Codes**: `200 OK`, `503 Service Unavailable`
- **Error Shape**: `{"error": "Database disconnected"}`

### 2. Fetch Catalogue
- **Purpose**: Return the full, pre-generated published catalogue file.
- **Method & Path**: `GET /catalog`
- **Auth/Role**: Public
- **Request Shape**: None
- **Response Shape**: The complete JSON structure defined in `CATALOGUE_CONTRACT.md`.
- **Status Codes**: `200 OK`, `404 Not Found` (if never published)
- **Error Shape**: `{"error": "Catalogue not yet generated"}`

### 3. Search Catalogue
- **Purpose**: Search the published catalogue by query, category, language, and section.
- **Method & Path**: `GET /catalog/search`
- **Auth/Role**: Public
- **Request Shape**: Query parameters: `?q=<string>&category=<string>&language=<string>&section=<string>`
- **Response Shape**: Array of matched grouped-episode objects (or matching shows).
- **Status Codes**: `200 OK`
- **Error Shape**: `{"error": "Invalid search parameters"}`

---

## ADMIN API
These endpoints handle system-level publishing and status.

### 4. Validation Report
- **Purpose**: Return a list of all currently publish-blocking issues across the dataset.
- **Method & Path**: `GET /admin/validation-report`
- **Auth/Role**: `editor` or `admin`
- **Request Shape**: None
- **Response Shape**:
  ```json
  {
    "blocked_records_count": 3,
    "issues": [
      {
        "type": "missing_artwork",
        "description": "Episode is missing required artwork",
        "affected_episode_id": "uuid"
      },
      {
        "type": "duplicate_variant",
        "description": "Duplicate language variants exist for this content group",
        "affected_content_group": "group_name"
      }
    ]
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`
- **Error Shape**: `{"error": "Forbidden", "detail": "Insufficient permissions"}`

### 5. Publish Catalogue
- **Purpose**: Atomically generate and store a new `catalogue.json` file.
- **Method & Path**: `POST /admin/catalog/publish`
- **Auth/Role**: `admin` ONLY (strictly enforced server-side)
- **Request Shape**: None
- **Response Shape**:
  ```json
  {
    "status": "success",
    "run_id": "uuid",
    "published_records": 82,
    "blocked_records": 3
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`
- **Error Shape**: `{"error": "Forbidden", "detail": "Only admins can publish the catalogue"}` or `{"error": "Publish Failed", "detail": "Storage write error"}`

---

## CRUD API
RESTful endpoints for the CMS to manage content. Authentication is required.

### 6. Shows
- **Purpose**: Manage top-level shows.
- **Paths**:
  - `GET /admin/shows` (List)
  - `POST /admin/shows` (Create)
  - `GET /admin/shows/{id}` (Read)
  - `PUT /admin/shows/{id}` (Update)
  - `DELETE /admin/shows/{id}` (Delete)
- **Auth/Role**: `editor` or `admin`
- **Request Shape** (POST/PUT): `{"title": "...", "slug": "...", "section": "...", "categories": [...], "synopsis": "..."}`
- **Response Shape**: The serialized Show object.
- **Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`
- **Error Shape**: `{"error": "Validation Error", "detail": "Slug must be unique."}`

### 7. Seasons
- **Purpose**: Manage seasons within a show.
- **Paths**:
  - `GET /admin/shows/{show_id}/seasons` (List)
  - `POST /admin/shows/{show_id}/seasons` (Create)
  - `DELETE /admin/seasons/{id}` (Delete)
- **Auth/Role**: `editor` or `admin`
- **Request Shape** (POST): `{"season_number": 1}`
- **Response Shape**: The serialized Season object.
- **Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`
- **Error Shape**: `{"error": "Validation Error", "detail": "Season number already exists for this show."}`

### 8. Episodes
- **Purpose**: Manage episodes/language variants.
- **Paths**:
  - `GET /admin/seasons/{season_id}/episodes` (List)
  - `POST /admin/seasons/{season_id}/episodes` (Create)
  - `GET /admin/episodes/{id}` (Read)
  - `PUT /admin/episodes/{id}` (Update)
  - `DELETE /admin/episodes/{id}` (Delete)
- **Auth/Role**: `editor` or `admin`
- **Request Shape** (POST/PUT): `{"episode_title": "...", "status": "draft", "duration_seconds": 300, "language": "en", "content_group": "group_name"}`
- **Response Shape**: The serialized Episode object.
- **Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`
- **Error Shape**: `{"error": "Validation Error", "detail": "Status must be 'draft' or 'published'."}`

---

## ARTWORK API

### 9. Upload Artwork
- **Purpose**: Upload and validate an image file against constraints, returning its storage record.
- **Method & Path**: `POST /admin/artwork/upload`
- **Auth/Role**: `editor` or `admin`
- **Request Shape**: `multipart/form-data` containing:
  - `file`: The image file binary.
  - `type`: String ('poster', 'banner', 'thumbnail').
  - `entity_id`: UUID (Show, Season, or Episode ID).
- **Response Shape**: 
  ```json
  {
    "id": "uuid",
    "url": "https://storage/...",
    "type": "poster"
  }
  ```
- **Status Codes**: `201 Created`, `400 Bad Request`, `413 Payload Too Large`
- **Validation/Error Shape**: `{"error": "Validation Error", "detail": "Banner must use a 16:9 aspect ratio and be no larger than 200 KB."}`
