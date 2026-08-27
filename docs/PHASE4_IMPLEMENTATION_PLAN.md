# Phase 4 Implementation Plan: Viewer Application

## Goal
Build a read-only, production-quality Viewer application for Peblo TV Mini using the existing published catalogue JSON.

## User Review Required
> [!IMPORTANT]
> The Viewer will be scaffolded as a completely separate React application in the `viewer/` directory using Vite and React, similar to the CMS. It will strictly consume `GET /catalog` and `GET /catalog/search` from the FastAPI backend. Are you aligned with using Vite + React + TanStack Query for the Viewer app?

## Implementation Strategy

### 1. Scaffolding & Setup
- Initialize the `viewer/` directory with Vite + React.
- Install standard, lightweight dependencies: `react-router-dom`, `lucide-react`, `axios`, and `@tanstack/react-query`.
- Configure `vite.config.js` to proxy `/catalog` to the `localhost:8000` backend to avoid CORS issues and share the local network environment.
- No Redux or complex global state managers will be used. Data fetching and caching will be handled exclusively by TanStack Query.

### 2. Styling (Follow `DESIGN.md`)
- Create `index.css` implementing the exact design tokens specified in `guidance/DESIGN.md`.
- Ensure the UI feels like a "lightweight Netflix-style browse experience" with a child-facing, friendly aesthetic (large radii, soft shadows, warm yellow/orange interactions, purple branding).

### 3. Core Pages & Routing
- **`Home (/)`**: Fetches `GET /catalog`. Renders the top-level structure (`featured`, `series`, `minisodes`, `songs`) as horizontal scrolling rows of shows.
- **`Show Details (/show/:slug)`**: Displays the selected show's metadata (`title`, `synopsis`, `categories`).
  - Renders Season 0 items explicitly in a "Trailers" section.
  - Renders standard Seasons and their Episodes in order.
  - Correctly surfaces grouped episode variants and languages.
- **`Search (/search)`**: Uses `GET /catalog/search` to implement the search interface.

### 4. Component Architecture
- **`CatalogueRow`**: A reusable horizontal scroll component for sections.
- **`ShowCard`**: Displays show artwork and title. Handles missing artwork safely with a branded placeholder fallback.
- **`EpisodeCard`**: Displays episode metadata, duration, and language badges.
- **`LoadingSpinner` / `ErrorState`**: Clear visual indicators for API latency or failures.
- **`EmptyState`**: Friendly UI for "No results found" in search.

### 5. Architectural Boundaries & Data Rules
- The Viewer will make **ZERO** calls to `/admin/*`, `/auth/*`, or PostgreSQL.
- The UI will render the catalogue exactly as returned by the backend. It will not duplicate the backend's grouping, sorting, or variant-collapsing logic.
- If a record is missing artwork, the UI will degrade gracefully without crashing.

## Verification Plan

### Automated Tests (Vitest + React Testing Library)
- **Catalogue Loading**: Verify the `Home` page renders the section structure correctly when mocking `GET /catalog`.
- **Search States**: Verify search handles empty input, "no results", and successful API responses correctly.
- **Resilience**: Verify UI does not crash if an episode is missing artwork.

### Manual Verification
- Start the backend and the Viewer UI.
- Verify that `Season 0` items display distinctly as trailers.
- Verify network tabs confirm only public `/catalog` endpoints are being hit.
- Ensure visual compliance with `DESIGN.md` guidelines across mobile and desktop widths.
