# Catalogue JSON Contract

This document defines the exact, deterministic JSON structure output by the `PublishService` and consumed by the Viewer application via `GET /catalog`.

## Top-Level Structure

The top-level structure is an object keyed by the section names defined in `reference.json`. This provides `O(1)` section lookup for the Viewer application and naturally groups the data.

```json
{
  "featured": [],
  "series": [],
  "minisodes": [],
  "songs": []
}
```

## Entity Representations

### Show Representation
Inside each section array, shows are represented as objects containing their metadata, seasons, and a dedicated array for Season 0 (trailers).

```json
{
  "show_id": "uuid",
  "title": "Motis Many Lives",
  "slug": "motis-many-lives",
  "synopsis": "...",
  "categories": ["adventure", "learning"],
  "seasons": [
    {
      "season_number": 1,
      "episodes": [ /* Collapsed episode records */ ]
    }
  ],
  "trailers": [
     /* Collapsed Season 0 records */
  ]
}
```

### Season Representation
Seasons (excluding Season 0) are objects containing the `season_number` and an ordered array of `episodes`.

### Episode Representation
Episodes are aggregated by their `content_group`. The `languages` array combines all uniquely available, publish-valid languages for this content group.

```json
{
  "content_group": "motis-many-lives-s01e01",
  "title": "Moti escapes",
  "duration_seconds": 300,
  "languages": ["en", "hi"],
  "artwork": {
    "thumbnail": "https://storage/moti-s1e1-thumb.jpg"
  }
}
```

## Deterministic Rules

### Ordering
- Sections are fixed keys.
- Shows inside a section are sorted alphabetically by `title`.
- Seasons inside a show are sorted ascending by `season_number`.
- Episodes inside a season are sorted alphabetically by `content_group`.
- Languages inside the `languages` array are sorted alphabetically (e.g., `["en", "hi"]`).

### Content Group Collapsing and Invalid Variants
Episodes sharing a `content_group` must collapse into a single catalogue entry. 

**Transformation Example:**
If the database contains these two publish-eligible rows:
1. `(content_group: motis-s1e1, language: en, title: Moti escapes)`
2. `(content_group: motis-s1e1, language: hi, title: Moti escapes)`

The publishing algorithm aggregates them into ONE catalogue episode:
```json
{
  "content_group": "motis-s1e1",
  "title": "Moti escapes",
  "languages": ["en", "hi"],
  ...
}
```

**Invalid Variant Handling:**
If one language variant violates a publish-blocking rule (e.g., the Hindi row has no artwork or is a duplicate `cg_lang` like `ep_0004` and `ep_9001`), the `ValidationService` completely filters out the invalid Hindi row. The aggregation runs on the remaining valid rows. The catalogue output strictly reflects the surviving valid rows:
```json
{
  "content_group": "motis-s1e2",
  "title": "Moti meets a friend",
  "languages": ["en"],
  ...
}
```
If *all* variants of a `content_group` are invalid, the entire `content_group` is omitted from the catalogue.

### Season 0 Behavior
Season 0 items do not appear in the standard `seasons` array. During generation, any grouped episode that belongs to `season_number == 0` is routed exclusively to the `trailers` array on the Show object.

---

## Complete Example Contract

```json
{
  "series": [
    {
      "show_id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Motis Many Lives",
      "slug": "motis-many-lives",
      "synopsis": "A dog's journey.",
      "categories": ["adventure"],
      "seasons": [
        {
          "season_number": 1,
          "episodes": [
            {
              "content_group": "motis-many-lives-s01e01",
              "title": "Moti escapes",
              "duration_seconds": 300,
              "languages": ["en", "hi"],
              "artwork": {
                "thumbnail": "https://storage/thumb.jpg"
              }
            }
          ]
        }
      ],
      "trailers": [
        {
          "content_group": "motis-trailer-1",
          "title": "Season 1 Trailer",
          "duration_seconds": 60,
          "languages": ["en"],
          "artwork": {
            "thumbnail": "https://storage/trailer.jpg"
          }
        }
      ]
    }
  ],
  "featured": [],
  "minisodes": [],
  "songs": []
}
```
