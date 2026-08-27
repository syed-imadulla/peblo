# Phase 3 Review Report

### Overall Result
**PASS WITH FIXES**

The Phase 3 implementation correctly establishes the CMS architecture and features. A minor bug in the frontend React import path (`AuthProvider.jsx`) and missing test database isolation were fixed during the review. The core architecture remains clean, properly scoped, and fully compliant with the challenge rules.

### Contract Compliance
- **Architecture**: PASS. The CMS backend is modularized (`crud.py`, `auth.py`, `artwork.py`). The Viewer API boundary is entirely separate.
- **Database design**: PASS. Uses the locked schema. `(content_group, language)` application-level uniqueness guarantees clean data ingestion while allowing invalid seed data to persist.
- **Catalogue contract**: PASS. Output schema remains unchanged.
- **Publish algorithm**: PASS. The algorithm remains deterministic and atomic.
- **API contract**: PASS.
- **Design system**: PASS. Follows `guidance/DESIGN.md` explicitly with exact token definitions mapped into `index.css`.

### Functional Verification
- **Authentication**: PASS. Dummy JWT (`/auth/login`) correctly returns tokens with hardcoded `admin`/`editor` roles. Endpoints are appropriately protected with `Depends(get_current_user)`.
- **Authorization**: PASS. Only the admin role can trigger the `/admin/catalog/publish` endpoint.
- **CRUD**: PASS. Implemented standard Create, Read, Update for Shows, Seasons, and Episodes. `content_group` + `language` uniqueness is verified strictly at the application boundary for episodes.
- **Artwork validation**: PASS. Uses Pillow to restrict posters to 2:3 and other artwork to 16:9, enforcing a `<200KB` size limit.
- **Publishing**: PASS. Preserved the 95 → 85 → 82 → 65 pipeline logic perfectly.
- **Seed idempotency**: PASS. `seed.py` dynamically handles duplicate entries cleanly. Seed tests are now isolated to prevent cross-test pollution.
- **Publish determinism**: PASS. 
- **Viewer/API separation**: PASS. Static generation holds strong.

### Test Results
**Command**:
```bash
cd backend && PYTHONPATH=. venv/bin/pytest tests/
```
**Result**:
```bash
======================= 18 passed in 1.64s =======================
```
**Tests Executed**:
- Auth: `test_login_success`, `test_login_failure`, `test_admin_can_publish`, `test_editor_cannot_publish`
- CRUD: `test_crud_shows`, `test_episode_uniqueness`
- Artwork: `test_artwork_upload`
- Legacy: `test_publish_determinism`, `test_validation_report_api`, `test_seed`, etc.

### Issues Found

1. **Test Suite Cross-Pollination (Medium)**
   - *Why it matters*: Testing CRUD operations over the DB polluted the expected initial state (95 rows) required by `test_seed.py`. 
   - *Fix applied*: Updated `test_seed.py` to truncate and re-seed the DB dynamically before asserting counts, ensuring total isolation.

2. **Python-Multipart Missing (Low)**
   - *Why it matters*: Without `python-multipart`, FastAPI throws a `500 Internal Server Error` on multipart form data, making artwork uploads impossible.
   - *Fix applied*: Installed and added `python-multipart` to `requirements.txt`.

3. **Frontend Build Error (Low)**
   - *Why it matters*: Vite's production build failed because `Login.jsx` referenced `./AuthProvider` instead of `../components/AuthProvider`.
   - *Fix applied*: Corrected the relative import path. Build now succeeds in 523ms.

### Unnecessary Code/Dependencies
- **Retained dependencies**: `@tanstack/react-query`, `react-router-dom`, `lucide-react`, `axios`, `python-multipart`, `pillow`. All represent the simplest, least-abstracted way to achieve the required routing, state management, form-data, and image validation needs. No complex state libraries (Redux) or ORM libraries for the frontend were used.
- **Removed**: A temporary `test_temp.py` debugging script was completely removed. 

### Final Git Diff Review
- The git diff is perfectly clean. 
- No temporary scripts, unnecessary boilerplate, or accidental file uploads reside in the working directory.
- `DATA_DIR` successfully isolates runtime assets from the static `docs/challenge/assets` directory.
