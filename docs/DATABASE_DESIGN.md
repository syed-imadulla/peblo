# Database Design

This document details the normalized PostgreSQL database schema for the Peblo TV Mini CMS, strictly adhering to the requirements outlined in the PRD, challenge documents, and the Phase 0 data audit.

## Schema Overview

### 1. `users`
Represents internal users who access the CMS.
- `id`: UUID (Primary Key)
- `email`: VARCHAR (UNIQUE, NOT NULL)
- `role`: VARCHAR (NOT NULL) - e.g., 'admin', 'editor'
- `created_at`: TIMESTAMP (NOT NULL, default NOW)
- `updated_at`: TIMESTAMP (NOT NULL, default NOW)

### 2. `shows`
Represents a top-level show.
- `id`: UUID (Primary Key)
- `title`: VARCHAR (NOT NULL)
- `slug`: VARCHAR (UNIQUE, NOT NULL)
- `section`: VARCHAR (NULLABLE) 
- `categories`: JSONB (NOT NULL, default '[]')
- `synopsis`: TEXT (NULLABLE)
- `created_at`: TIMESTAMP (NOT NULL, default NOW)
- `updated_at`: TIMESTAMP (NOT NULL, default NOW)

### 3. `seasons`
Represents a season within a show.
- `id`: UUID (Primary Key)
- `show_id`: UUID (Foreign Key to `shows.id`, ON DELETE CASCADE, NOT NULL)
- `season_number`: INTEGER (NOT NULL)
- `created_at`: TIMESTAMP (NOT NULL, default NOW)
- `updated_at`: TIMESTAMP (NOT NULL, default NOW)
- **Constraint**: `UNIQUE(show_id, season_number)`

### 4. `episodes`
Represents an individual episode or language variant.
- `id`: UUID (Primary Key)
- `season_id`: UUID (Foreign Key to `seasons.id`, ON DELETE CASCADE, NOT NULL)
- `episode_title`: VARCHAR (NOT NULL)
- `status`: VARCHAR (NOT NULL) - 'draft' or 'published'
- `duration_seconds`: INTEGER (NULLABLE)
- `language`: VARCHAR (NULLABLE)
- `content_group`: VARCHAR (NOT NULL)
- `created_at`: TIMESTAMP (NOT NULL, default NOW)
- `updated_at`: TIMESTAMP (NOT NULL, default NOW)
- **Index**: `INDEX(content_group)`
- **Index**: `INDEX(status)`

### 5. `artwork`
Represents image assets associated with content.
- `id`: UUID (Primary Key)
- `show_id`: UUID (Foreign Key to `shows.id`, ON DELETE CASCADE, NULLABLE)
- `season_id`: UUID (Foreign Key to `seasons.id`, ON DELETE CASCADE, NULLABLE)
- `episode_id`: UUID (Foreign Key to `episodes.id`, ON DELETE CASCADE, NULLABLE)
- `type`: VARCHAR (NOT NULL) - e.g., 'banner', 'thumbnail'
- `url`: VARCHAR (NOT NULL)
- `size_bytes`: INTEGER (NOT NULL)
- `created_at`: TIMESTAMP (NOT NULL, default NOW)
- `updated_at`: TIMESTAMP (NOT NULL, default NOW)
- **Constraint**: `CHECK (num_nonnulls(show_id, season_id, episode_id) = 1)` (Exactly one entity association must exist).

### 6. `publish_runs`
Records the history of publish attempts and their outcomes.
- `id`: UUID (Primary Key)
- `triggered_by`: UUID (Foreign Key to `users.id`, ON DELETE SET NULL, NULLABLE)
- `status`: VARCHAR (NOT NULL) - 'success', 'failed'
- `total_records_processed`: INTEGER (NOT NULL)
- `published_records`: INTEGER (NOT NULL)
- `blocked_records`: INTEGER (NOT NULL)
- `error_log`: JSONB (NULLABLE)
- `created_at`: TIMESTAMP (NOT NULL, default NOW)

---

## Architectural Decisions

### 1. Why `section` belongs to `Show`
In the raw seed JSON, the `section` string is duplicated on every single episode record. In our normalized database, a section (like `featured` or `series`) conceptually categorizes a whole show, not an individual episode. Therefore, `section` resides on the `shows` table.

### 2. How Season 0 is represented
Season 0 is represented simply by inserting `0` into the `season_number` column of the `seasons` table. This allows trailers to be fetched using the exact same relational structures as standard seasons, pushing the special handling strictly to the catalogue generation step (as mandated by the rules).

### 3. How `content_group` is represented
`content_group` is a string column on the `episodes` table. It serves as an aggregation key for the PublishService to group rows together into single catalogue entities.

### 4. How language variants are represented
Multiple `episodes` rows that share the same `content_group` but have different `language` strings represent language variants. 

### 5. Accommodating Invalid Seed Data
The database heavily relies on `NULLABLE` columns for `section`, `duration_seconds`, and `language`. The canonical episode table does NOT enforce `UNIQUE(content_group, language)` because the challenge seed intentionally contains invalid duplicate-language records that must successfully load. The database schema allows all 95 rows to ingest gracefully so that the CMS can render them and surface validation errors to the editor.

### 6. DB Constraints vs Application Validation
- **Database Constraints**: Limited strictly to referential integrity (Foreign Keys), primary keys, structural uniqueness (Show Slug, Season Number per Show), and data types.
- **Application Validation**: The application validation/publish layer enforces business invariants—such as `UNIQUE(content_group, language)`—before publication. Do NOT claim that application validation is equivalent to a database constraint. This pattern is a deliberate tradeoff chosen specifically to satisfy the challenge requirement of loading corrupt seed data into the CMS.

### 7. Artwork Relations
The `artwork` table uses a polymorphic-like pattern via three `NULLABLE` foreign keys. A `CHECK` constraint guarantees that any given artwork row is tied to exactly one entity (Show, Season, or Episode). This is safer than a loose `entity_id` and `entity_type` pattern because it preserves actual Foreign Key referential integrity and cascading deletes.

### 8. Publish Runs
Every time the admin initiates a publish, a row is inserted into `publish_runs`. This provides an auditable history of catalogue updates, noting exactly how many records were successfully published, how many were blocked by validation, and the JSON error log describing the blocks.
