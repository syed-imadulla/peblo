# Phase 2 Engineering Review

## Issue Identified
The previous Phase 2 implementation successfully met the JSON requirements but contained a significant architectural flaw: `catalogue.json` was being written directly into `docs/challenge/assets/`. This mixed generated runtime state with static challenge-provided assets.

## Root Cause
The `LocalStorageProvider` had a hardcoded default `base_path` pointing to the developer's static asset directory.

## Minimal Fix
- Introduced `backend/app/core/config.py` leveraging `pydantic-settings` to define a `DATA_DIR` environment variable defaulting to `data`.
- Updated `LocalStorageProvider` to use `DATA_DIR`, fully isolating the operational JSON from static assets.
- Updated `tests/conftest.py` to auto-inject a `tempfile.TemporaryDirectory()` into the storage provider during testing, completely isolating the test suite from local disk state.

## Files Changed
- `backend/app/core/config.py` (New)
- `backend/app/services/storage.py` (Modified)
- `backend/tests/conftest.py` (Modified)
- `backend/tests/test_publish.py` (Modified)
- `backend/.env.example` (Modified)

## Tests Added/Changed
- Added `test_viewer_api_independence()` to explicitly mock the PostgreSQL database dependency out of the FastAPI application (`app.dependency_overrides`). This proves, strictly and mechanically, that the `/catalog` endpoints cannot query the operational database and read exclusively from the JSON file.

## Verification Results
- **Test Suite**: 10 passed.
- **Seed Idempotency**: Verified. Running `seed.py` sequentially truncates and accurately restores exactly 95 rows without duplicating data.
- **Catalogue Determinism**: Verified. Multiple publish runs produce a byte-for-byte identical `catalogue.json`.
- **Runtime Storage**: Verified. The catalogue is correctly written to `backend/data/catalogue.json` while `assets/` remains untouched.
- **Pipeline Math**: Verified (95 raw -> 85 published -> 82 valid -> 65 catalogue entries + 2 trailer variants).

## Architectural Alignment Confirmation
No unrelated architecture was changed. Authentication, caching, background workers, and CRUD logic remain strictly deferred as required by the challenge bounds. 

**PHASE 2 IS FULLY VERIFIED AND LOCKED.**
