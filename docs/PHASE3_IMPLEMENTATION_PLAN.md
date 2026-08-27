# Phase 3 Implementation Plan: Internal CMS

## 1. Current Backend Capabilities
- Database schema (Shows, Seasons, Episodes, Artwork, Users, PublishRuns).
- Seed loader and basic data integrity.
- Validation logic (`ValidationService.validate_for_publish`).
- Catalogue publishing and deterministic JSON generation (`PublishService`).
- Public Viewer APIs (`GET /catalog`, `GET /catalog/search`).
- Admin APIs for publishing and validation reports (`POST /admin/catalog/publish`, `GET /admin/validation-report`).

## 2. Missing Requirements (Backend Gap Check)
To support the CMS, the backend currently lacks:
- **Authentication/Role Enforcement**: No `/auth/login` endpoint, no middleware to enforce Editor vs Admin roles.
- **CRUD APIs**: No endpoints to list, create, edit, or delete Shows, Seasons, or Episodes.
- **CRUD Validation**: No enforcement of `(content_group, language)` uniqueness during episode creation.
- **Artwork Upload**: No endpoint to accept multipart file uploads, validate file sizes (<200KB), validate dimensions, or save to `DATA_DIR`.

## 3. CMS Architecture
- **Frontend Framework**: React (Vite).
- **Routing**: React Router (SPA).
- **Styling**: Vanilla CSS utilizing design tokens specified in `DESIGN.md` (no Tailwind to avoid bloat, strict adherence to clean, information-dense UX).
- **Backend Communication**: Axios or native `fetch` via TanStack Query.
- **State Management**: TanStack Query for server state. React Context for simple auth state.

## 4. API Inventory Required by CMS
**Authentication:**
- `POST /api/auth/login` (Accepts username/password, returns a dummy JWT and role `editor` or `admin`).

**CRUD:**
- `GET /api/admin/shows` (with search, category, section filtering, pagination)
- `POST /api/admin/shows`
- `PUT /api/admin/shows/{id}`
- `DELETE /api/admin/shows/{id}`
- (Same standard CRUD for `seasons` and `episodes`)

**Artwork:**
- `POST /api/admin/artwork` (Accepts `file` and `type` [poster, banner, thumbnail]. Returns saved file URL/path).

## 5. Component Structure
- `App.jsx` (Router and Auth Provider)
- `components/`
  - `Layout/` (Sidebar, Header)
  - `UI/` (Button, Input, Card, Badge, Modal, Pagination)
  - `Forms/` (ShowForm, EpisodeForm, ArtworkUploadSlot)
- `pages/`
  - `Login.jsx`
  - `Dashboard.jsx` (Stats)
  - `ShowsList.jsx` (Table, Filters)
  - `ShowEdit.jsx` / `ShowCreate.jsx`
  - `EpisodeEdit.jsx`
  - `Publish.jsx` (Validation report & Publish button)

## 6. State/Data-Fetching Strategy
- **TanStack Query** will be used exclusively for fetching lists, fetching single entities, and mutating data. It handles loading, error, and caching states out of the box, fulfilling UX requirements cleanly.

## 7. Artwork Upload Flow
1. User selects image in `ArtworkUploadSlot`.
2. Frontend reads file size. If > 200KB, immediately rejects with a human-readable message.
3. If valid, frontend displays local `FileReader` preview.
4. User clicks "Upload" (or it auto-uploads).
5. Frontend `POST`s multipart form to `POST /api/admin/artwork`.
6. Backend validates size again, reads image dimensions using `Pillow`, verifies against required aspect ratio/dimensions, saves via `StorageProvider`, and returns the URL.
7. Frontend attaches URL to the Show/Episode form state.

## 8. Permission Flow
- User logs in and receives a token + role (`admin` or `editor`).
- Token is stored in `localStorage` and attached as `Authorization: Bearer <token>` to all API requests.
- **Frontend**: The "Publish" button on the Publish page is disabled or hidden with a tooltip if role is `editor`.
- **Backend**: A FastAPI dependency `get_current_admin` verifies the token. If an editor tries to `POST /api/admin/catalog/publish`, backend returns `403 Forbidden`.

## 9. Validation UX
- **Publish Page**: Calls `GET /api/admin/validation-report`. Displays blocking issues in a structured, actionable format (What is wrong, Where is it wrong). The actual "Publish" button is disabled if `blocked_records_count > 0`.
- **Form UX**: API 400 errors from CRUD (e.g. duplicate content group + language) are caught by TanStack Query and displayed via toast notifications or inline form errors.

## 10. Testing Strategy
- **Backend Tests**: 
  - Test role enforcement (Editor gets 403 on publish).
  - Test `(content_group, language)` uniqueness on episode creation.
  - Test artwork validation logic (size & dimension limits).
- **Frontend Tests**: (If required by phase scope, otherwise manual verification of UX states: loading, empty, error, success).

## 11. Exact Implementation Order
1. **Backend Auth & Middleware**: Implement dummy login and role dependencies.
2. **Backend CRUD**: Implement Shows, Seasons, Episodes endpoints.
3. **Backend Artwork**: Implement upload endpoint + validation.
4. **Frontend Setup**: Scaffold React + Vite + TanStack Query.
5. **Frontend UI/Routing**: Build layout, login page, navigation.
6. **Frontend List/CRUD**: Build `ShowsList` and Forms.
7. **Frontend Publish**: Build the validation report and publish view.
8. **Testing & Hardening**: Run end-to-end verifications.

## 12. Files to Create/Modify
- `backend/app/api/auth.py`
- `backend/app/api/crud.py`
- `backend/app/api/artwork.py`
- `backend/app/core/security.py` (for basic JWT/token handling)
- `backend/app/main.py` (mount new routers)
- `backend/tests/test_crud.py`
- `backend/tests/test_auth.py`
- `cms/` (entire React application tree)

## 13. Challenge Scoring Alignment
- **Correctness**: Backend enforces rules; frontend prevents bad submissions. 
- **Usability**: Human-readable errors, live image previews, disabled buttons with explanations.
- **Architecture**: Clear separation of concerns; backend remains authoritative.
- **Operability**: Minimal dependencies (no complex auth setups like Auth0, just simple JWT).

## 14. Risks
- Implementing complete CRUD for a nested data structure (Shows -> Seasons -> Episodes) can become complex on the frontend. *Mitigation: Keep routing flat (e.g., `/episodes/:id`) and rely on searchable select inputs.*
- Image dimension validation in Python requires `Pillow`. *Mitigation: Add `Pillow` to `requirements.txt`.*

## 15. Explicit Out-of-Scope Items
- Viewer UI (Phase 7).
- Caching / Redis / Celery.
- True secure authentication (using hardcoded users or simple JWT is sufficient).
- Complex analytics or dashboard charts.
