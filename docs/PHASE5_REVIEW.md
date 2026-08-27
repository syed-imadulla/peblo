# Phase 5 Review: Operability & Final Verification

This document summarizes the execution and verification of Phase 5.

## Implementation Summary

### 1. Dockerization
- **Backend**: Containerized using `python:3.11-slim`. An `entrypoint.sh` script waits for Postgres, runs Alembic migrations, runs the idempotent `seed.py` script, copies seed assets to the data directory, and starts Uvicorn.
- **CMS**: Containerized using a multi-stage build. React is built via Vite, and served as static files via Nginx. An Nginx reverse proxy routes `/api/` calls directly to the backend container, seamlessly reproducing the Vite development proxy setup for production.
- **Viewer**: Containerized identically to the CMS via Nginx, with a reverse proxy routing `/catalog` and `/assets/` calls directly to the backend container.
- **Docker Compose**: Orchestrates `db` (Postgres), `api`, `cms`, and `viewer` with correct networking, environment variables, and healthchecks.

### 2. CI/CD Pipeline
- Implemented `.github/workflows/ci.yml`.
- The workflow runs Python `pytest` for the backend.
- The workflow runs Node `vitest` for the viewer.
- The workflow tests production `build` commands for the CMS.
- The workflow builds all three Docker images.
- A placeholder step explains where deployment pushes would occur.

### 3. Documentation & Secrets
- `backend/.env.example` was updated with all required keys and a detailed paragraph explaining runtime secret injection (AWS Secrets Manager, Vault, etc.) to satisfy production security requirements.
- `README.md` was authored detailing:
  - Atomic publishing via temporary files and `os.replace`.
  - The `StorageProvider` abstraction and R2 migration strategy.
  - Search scaling limits (in-memory linear scan) and future indexing.
  - Trade-offs of the pre-published JSON approach.
  - Development context and AI usage.

### 4. Code Cleanup & Seed Idempotency
- Verified that `seed.py` is safely idempotent. It queries the DB for existing slugs before inserting, allowing it to run safely on every container boot without duplicating data.
- Fixed `seed.py` artwork generation to prepend `/assets/` to match the exact behavior of the production `upload_artwork` API, ensuring that Nginx reverse proxying correctly routes both seeded and uploaded images.

## Verification Matrix Results

1. **Backend Tests**: 17/17 passed (`pytest tests/`).
2. **Viewer Tests**: 4/4 passed (`vitest run`).
3. **Viewer Build**: Success.
4. **CMS Build**: Success.
5. **Seed Verification**: Ran `seed.py` multiple times. Verified via PSQL that no duplicates were created.
6. **Pipeline Trace**: `verify_pipeline.py` confirmed 95 raw -> 85 eligible -> 82 publishable -> 65 unique catalogue entries.
7. **Secrets Search**: Audited tree. No leaked real secrets.

The repository is stable, clean, and fully operational.
