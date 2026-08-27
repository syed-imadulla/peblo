# Peblo TV Mini

A miniature Netflix-style content platform featuring an internal CMS, a backend API with publishing pipeline, and a viewer-facing frontend.

## Running the Project

To start the entire stack (API, DB, CMS, Viewer) seeded and working:
```bash
docker-compose up --build -d
```
- **Viewer**: http://localhost:3001
- **CMS**: http://localhost:3000 (Login with `admin` / `admin` for publish rights, or `editor` / `editor` for CRUD-only)
- **API**: http://localhost:8000

---

## Architecture & Decisions

### 1. Atomic Publishing
The catalogue is generated entirely in memory as a JSON string during the publish run. Instead of overwriting the live file in place (which could expose a partial file if interrupted), we write to a temporary file (`catalogue_temp_uuid.json`) on disk, and then perform an atomic rename (`os.replace`) to the final `catalogue.json`. 
**Failure Scenario:** If the process dies mid-publish, the temporary file is left orphaned, but the live catalogue remains completely untouched and safe. The failed run is recorded in the `PublishRun` logs for auditing.

### 2. Storage Abstraction
File storage uses a simple `LocalStorageProvider` implementing a unified `StorageProvider` interface (`read`, `write`, `rename`). 
**Cloudflare R2 Migration Strategy:** Since the interface is purely string/byte driven, migrating to R2 requires only implementing an `R2StorageProvider` using `boto3` (configured for R2's S3 compatibility). The atomic rename operation would translate to an S3 `copy` (with new key) and `delete` (of temp key). Because the application only ever references `storage.read()` and `storage.write()`, no business logic would need to change.

### 3. Search Implementation & Scaling
Search is currently implemented in-memory on the backend. When `GET /catalog/search` is called, the backend reads the pre-published JSON into memory and filters the shows linearly by text matching on title/synopsis and inspecting grouped language arrays.
**Scaling Limitations:** This is fast for a catalogue of 100-1000 shows, but will break down (memory usage, slow response) at scale (10k+ shows) or under high concurrent load. 
**Next Steps:** At scale, search should be offloaded to a dedicated search index like Elasticsearch/OpenSearch or Algolia. The publish step would sync the validated catalogue objects directly to the search index rather than relying on in-memory linear scans.

### 4. Pre-published Catalogue Trade-offs
**Why not query the DB per request?** Pre-publishing the catalogue creates an ultra-fast, highly cacheable static artifact. The Viewer UI can read this file directly (via CDN) without touching the database, completely shielding the operational DB from viewer traffic spikes.
**The Bite:** The downside is latency/staleness. Changes in the CMS are not instantly visible; an explicit publish step is required. It also makes real-time personalized sorting/recommendations harder, as everyone sees the exact same static catalogue file.

### 5. Health & Alerting
We expose a `GET /health` endpoint that runs `SELECT 1` against Postgres.
**Alerting Reasoning:** We would alert on the `/health` endpoint returning a 5xx status. This verifies both that the API server is up AND that the database is reachable. If this fails, the CMS cannot operate. Since the Viewer only depends on the static catalogue JSON, we would also separately alert on CDN edge errors.

### 6. What was left out & AI Usage
- **Stretch Goals:** Versioned catalogues and dry-runs were omitted to prioritize core operability, clean code, and solid Docker boundaries.
- **Redux/Context API:** Omitted in favor of simple prop drilling and React Router state, keeping the app lightweight and readable.
- **AI Usage:** Used for scaffolding Docker files, generating boilerplate React components, writing tests, and planning workflows. AI output was heavily directed to enforce the strict separation of concerns (Viewer -> read-only) and avoid unnecessary abstractions.

*Time Spent: ~6-8 hours.*
