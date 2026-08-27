# Phase 5 Implementation Plan: Operability & Final Verification

## Exact Phase 5 Objective
Complete the final requirements of the challenge focused on operability, deployment, CI/CD, and documentation (Parts D and E of `challenge.md`), followed by a final repository cleanup and verification.

## Requirements Extracted from the Challenge
1. **Docker Compose**: `docker-compose up` must bring up the API, database, CMS UI, and Viewer UI, fully seeded and working.
2. **GitHub Actions**: Create a CI workflow for linting, testing, and building images. Explain the deployment step (mocked).
3. **Secrets Management**: Update `.env.example` with all variables and include a paragraph explaining the production secret management strategy.
4. **Health & Alerting**: Expose a `/health` endpoint (already exists). Document one thing to alert on and the reasoning.
5. **Written Responses (README.md)**:
   - How atomic publishing was achieved and failure scenarios.
   - Storage abstraction details and Cloudflare R2 transition strategy.
   - Search implementation details, scaling limits, and next steps.
   - Pre-published catalogue architecture trade-offs.
   - What was left out, AI usage, and general time spent.
6. **Code Cleanup**: Remove dead code, redundant files, and unnecessary dependencies.

## Existing Implementation Relevant to Phase 5
- **Docker Compose**: Currently only contains the Postgres database (`db_data` volume is defined). Needs `backend`, `cms`, and `viewer` services.
- **Backend Health Check**: `GET /health` is implemented in `backend/app/main.py`.
- **Database Migrations & Seeding**: Scripts exist (`migrations/`, `seed.py`). Need to be wired into the docker startup.
- **Testing**: Pytest for backend and Vitest for Viewer exist. Need to wire them into GitHub Actions.
- **Linter**: Oxlint configured for JS, Ruff (or similar) needed for Python if not already used.

## Files that need to be created/modified
### Created
- `backend/Dockerfile`
- `cms/Dockerfile`
- `viewer/Dockerfile`
- `backend/entrypoint.sh` (To run alembic migrations, seed, and start uvicorn)
- `.github/workflows/ci.yml` (GitHub Actions CI pipeline)
- `README.md` (Root documentation)

### Modified
- `docker-compose.yml` (Add `api`, `cms`, `viewer` services)
- `backend/.env.example` (Add secrets strategy explanation)

## Component/Service/API Changes
- No API or core business logic changes are needed. This phase is purely structural and operational.
- CMS and Viewer Dockerfiles will likely use a multi-stage build (Node builder -> Nginx server) to serve static production builds, or simply expose the Vite dev server depending on the fastest robust implementation for "docker-compose up". We will use a standard Nginx serving approach for a production-like representation.

## Data-flow Changes
- None.

## Testing Strategy
- **CI Pipeline Verification**: The GitHub Action will run `pytest` and `vitest`.
- **Docker Composition Verification**: We will run `docker-compose up --build -d` and verify that all containers are healthy, the database is seeded, and the UI can fetch the catalog.
- **Local Verification**: The seed verification script and pipeline trace will be run as final safety checks.

## Verification Commands
```bash
# 1. CI Simulation
cd backend && pytest tests/
cd viewer && npm run test

# 2. Docker Compose
docker-compose up --build -d
curl http://localhost:8000/health
# Verify CMS at http://localhost:3000
# Verify Viewer at http://localhost:3001
docker-compose down -v
```

## Challenge Scoring Checklist
- [ ] Pipeline & operability (10 pts): `docker-compose up` works first try, CI meaningful, secrets & alerting reasoned.
- [ ] Written reasoning (5 pts): Real trade-offs discussed in README.
- [ ] Final penalty check: Verify no live file overwrites (atomic rename is implemented), artwork is size validated (implemented), roles are enforced (implemented), viewer doesn't call admin endpoints (implemented).

## Potential Risks
- **Docker Networking**: Ensuring Vite API proxies map correctly within the Docker bridge network. The CMS/Viewer will run in the browser, so their API calls (`localhost:8000`) must resolve to the host port mapped to the backend container, or we inject the API URL via environment variables during the build.
- **Seed Idempotency**: The entrypoint script will run `seed.py` on every container start. We must ensure `seed.py` gracefully skips or updates without duplicating data or crashing if the database is already seeded.

## Explicit Non-Goals
- Adding new feature stretch goals (e.g., versioned catalogues, dry-runs) unless time permits *after* this phase is fully complete and approved.
- Re-architecting the frontend to use Next.js/SSR. Static React apps are sufficient for the challenge.

## Definition of Done
- `docker-compose up` boots a fully functional environment from scratch.
- CI pipeline is defined in `.github`.
- `.env.example` and `README.md` satisfy all written challenge requirements.
- Final manual click-through of the UI passes.
