# Asset Audit

This document catalogues the visual assets provided alongside the challenge. These files have been placed in `docs/challenge/assets/` and renamed from their system-assigned UUIDs to descriptive names to facilitate programmatic testing and seed loading. 

As per the `reference.json` challenge constraints, the exact artwork specifications are:
- **poster**: Aspect 2:3, Target 600x900 px, Max 200 KB
- **banner**: Aspect 16:9, Target 1280x720 px, Max 200 KB
- **thumbnail**: Aspect 16:9, Target 640x360 px, Max 200 KB

All provided images are simple, solid-color placeholder blocks intentionally designed for testing upload and validation flows, rather than actual production artwork.

---

## Asset Inventory

### 1. `poster_valid.jpg`
- **Original Upload Name:** `media_1787835057251.jpg`
- **Dimensions:** 600 x 900
- **Aspect Ratio:** 2:3
- **Format:** JPEG
- **File Size:** 4.0 KB
- **Likely Purpose:** A valid poster image that perfectly matches the `poster` target spec.
- **Seed Reference:** Used whenever `seed_shows.json` specifies `"poster"` in the `artwork_available` array.

### 2. `thumbnail_valid.jpg`
- **Original Upload Name:** `media_1787835057266.jpg`
- **Dimensions:** 640 x 360
- **Aspect Ratio:** 16:9
- **Format:** JPEG
- **File Size:** 2.1 KB
- **Likely Purpose:** A valid thumbnail image that perfectly matches the `thumbnail` target spec.
- **Seed Reference:** Used whenever `seed_shows.json` specifies `"thumbnail"` in the `artwork_available` array.

### 3. `banner_invalid_size.jpg`
- **Original Upload Name:** `media_1787835057185.jpg`
- **Dimensions:** 1024 x 576
- **Aspect Ratio:** 16:9
- **Format:** JPEG
- **File Size:** 4.2 KB
- **Likely Purpose:** A deliberately incorrectly sized banner. While the aspect ratio is correct (16:9), it does not match the target `1280x720` dimensions. Designed to test CMS validation logic.
- **Seed Reference:** Can be seeded for `banner` artwork to simulate legacy or non-compliant data.

### 4. `banner_invalid_size.png`
- **Original Upload Name:** `media_1787835057207.png`
- **Dimensions:** 1024 x 576
- **Aspect Ratio:** 16:9
- **Format:** PNG
- **File Size:** 14.0 KB
- **Likely Purpose:** A PNG variant of the invalidly sized banner to test format/MIME-type handling and size rules alongside the JPEG variant.

### 5. `poster_invalid_aspect.jpg`
- **Original Upload Name:** `media_1787835057260.jpg`
- **Dimensions:** 900 x 600
- **Aspect Ratio:** 3:2 (Landscape instead of Portrait)
- **Format:** JPEG
- **File Size:** 4.0 KB
- **Likely Purpose:** A deliberately malformed poster image. The target is 2:3 (vertical), but this image is 3:2 (horizontal). Designed to test strict aspect ratio validation in the CMS upload flow.

---

## Usage Directives

1. **Strict Seeding:** When our backend seed logic encounters `artwork_available: ["poster"]`, it must link the episode to `poster_valid.jpg`. The CMS and Viewer must display this exact image (served via our storage layer).
2. **Missing Artwork:** The challenge explicitly forbids inventing or generating AI artwork to fill gaps. If a published episode in `seed_shows.json` lists an empty `artwork_available` array (e.g., `ep_0036`), it must remain empty in the database, resulting in a **publish-blocking validation error** in the CMS.
3. **Upload Testing:** The intentionally invalid assets (`poster_invalid_aspect.jpg`, `banner_invalid_size.jpg`) will be used during manual or automated testing to ensure the CMS correctly rejects uploads that violate `reference.json` constraints.
