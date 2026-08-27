# Peblo TV Mini — Design Specification

> **Purpose:** UI/UX direction for the take-home challenge.  
> **Design principle:** Peblo-inspired, playful and warm, while keeping the CMS practical enough for an editor who uses it many times every week.

---

## 1. Product surfaces

The challenge has two distinct experiences:

1. **Internal CMS**
   - Content editors/admins manage shows, seasons, episodes and artwork.
   - Admins can publish the catalogue.
   - Editors need clear validation feedback without technical knowledge.

2. **Viewer**
   - Child-facing, read-only experience.
   - Reads only the published catalogue.
   - Feels like a lightweight Netflix-style browse experience.
   - Search/filter should be simple and visually inviting.

The backend/API should remain visually invisible to the viewer. The viewer must never call admin endpoints.

---

## 2. Visual direction

### Peblo inspiration from the supplied official-site / YouTube references

Use the supplied references as **visual inspiration**, not as a pixel-for-pixel recreation.

Key characteristics to carry over:

- Friendly rounded typography.
- Strong Peblo purple as the primary brand color.
- Warm yellow/orange for primary actions.
- White/light backgrounds with soft pastel sections.
- Large rounded corners.
- Generous whitespace.
- Playful illustrations and character artwork.
- Soft shadows rather than heavy borders.
- Short, friendly copy.
- Purple/navy text instead of pure black where possible.
- Bright artwork should be the visual focus of the viewer.

The official references also show a useful contrast:
- **Viewer:** immersive, image-led, spacious.
- **CMS:** structured, information-dense, operational.

Do not make the CMS look like a children's app. Keep the personality in the colors, radius, artwork and micro-interactions while preserving professional information hierarchy.

---

## 3. Design tokens

These are implementation starting points inferred from the supplied screenshots, **not claimed official Peblo brand values**.

### Colors

```css
--purple-700: #6B35C8;
--purple-600: #7B45D1;
--purple-100: #F0E8FF;

--navy-900: #29134F;
--navy-700: #42266B;

--yellow-500: #FFB718;
--yellow-100: #FFF3CF;

--green-500: #36A269;
--green-100: #E7F7EE;

--red-500: #D9536F;
--red-100: #FCE8ED;

--blue-100: #EAF5FF;

--surface: #FFFFFF;
--background: #FAF9FD;
--text-muted: #756B82;
--border: #E9E3F1;
```

### Shape

```css
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-pill: 999px;
```

Use larger radii on major viewer cards and hero surfaces. CMS controls should generally stay around 10–16px so the interface remains efficient.

### Shadows

Prefer subtle layered shadows:

```css
box-shadow: 0 8px 30px rgba(50, 30, 90, 0.08);
```

Avoid strong black shadows.

### Typography

Use a rounded, highly readable sans-serif for the interface.

Suggested hierarchy:

- Display: 48–64px, bold
- H1: 32–40px, bold
- H2: 24–30px, bold
- H3: 18–20px, semibold
- Body: 14–16px
- Metadata: 12–13px

The viewer may use a more playful display treatment, while CMS typography should prioritize scanability.

---

## 4. Viewer UI

### Home

Required structure:

```text
┌──────────────────────────────────────────────┐
│ Logo                         Search   Language│
├──────────────────────────────────────────────┤
│                                              │
│              FEATURED HERO                   │
│       banner artwork + title + synopsis      │
│                 [Watch]                      │
│                                              │
├──────────────────────────────────────────────┤
│ Featured / Section name                      │
│ [poster] [poster] [poster] [poster] →        │
│                                              │
│ Another Section                              │
│ [poster] [poster] [poster] [poster] →        │
│                                              │
│ Episodes / minisodes                         │
│ [thumbnail] [thumbnail] [thumbnail] →        │
└──────────────────────────────────────────────┘
```

### Hero

Use the **banner** artwork.

- Large horizontal artwork.
- Gradient/overlay only where needed for text legibility.
- Title and synopsis sit in a readable safe area.
- Primary CTA: `Watch`.
- Secondary metadata: categories and available languages.
- Do not overcrowd the hero.

### Horizontal rows

Use **poster** artwork for show/series rows.

Cards should have:

- Artwork
- Title
- Optional small language badges
- Optional category/metadata
- Hover/focus treatment
- Click target covering the entire card

Rows should scroll horizontally on smaller screens instead of collapsing into an awkward dense grid.

### Episode lists

Use **thumbnail** artwork for episode-level browsing.

Display:

- Episode title
- Season/episode number
- Duration
- Language availability

### Search + filters

Required filters:

- Search query
- Category
- Language

Keep filters visible and simple.

Suggested empty state:

> **Nothing found yet.**  
> Try another title, category or language.

Avoid exposing database/API terminology.

---

## 5. Show detail page

Structure:

```text
Back

[Large banner]
Show title
Synopsis
Categories • Languages

[Season selector]
Season 1

Episodes
┌────────┐  Episode 1
│ thumb  │  Title
└────────┘  08:20 • EN / HI

┌────────┐  Episode 2
│ thumb  │  Title
└────────┘  07:10 • EN
```

### Important catalogue rule

`Season 0` is **trailers only**.

Therefore:

- Never display Season 0 as `Season 0` in the normal season selector.
- If trailers are surfaced, give them a separate `Trailers` area.
- Normal seasons begin at Season 1.

### Language grouping

Episodes sharing the same `content_group` represent language variants.

The viewer should show **one episode entry**, for example:

```text
The Lost Kite
EN  HI
```

Do not render English and Hindi variants as duplicate episode cards.

---

## 6. CMS UI

The CMS should feel like a polished internal tool rather than a marketing site.

### Main navigation

```text
Dashboard
Shows
Seasons & Episodes
Artwork
Validation
Publish
Publish History
Users & Roles
Settings
```

Only expose actions the current role can actually perform.

### Shows / Content Library

Primary screen:

```text
Shows / Content Library
Manage all your shows and their episodes

[Search........................] [Section] [Status] [Language] [Category]
                                                    [+ Add New Show]

Stats:
[ Total Shows ] [ Published ] [ Draft ] [ Validation Issues ]

┌─────────────────────────────────────────────────────────────────────┐
│ Show       Section   Categories   Languages   Episodes   Status ... │
├─────────────────────────────────────────────────────────────────────┤
│ artwork    Moti...   Adventure    EN HI       12         Published  │
│ artwork    ...                                                      │
└─────────────────────────────────────────────────────────────────────┘

Pagination
```

Prioritize:

- Search
- Section filter
- Status filter
- Language filter
- Pagination
- Clear status badges
- Fast actions

Avoid unnecessary charts unless they help the editor.

---

## 7. Create / edit content

### Show form

Group fields into clear sections:

**Basic information**
- Title
- Slug
- Synopsis
- Section
- Categories

**Seasons**
- Season list
- Episode counts
- Add/edit actions

**Publishing readiness**
- Artwork status
- Missing fields
- Validation summary

### Episode form

Include:

- Episode title
- Season
- Episode number
- Duration
- Language
- Content group
- Status
- Artwork

---

## 8. Artwork upload UX

The challenge explicitly requires three artwork slots.

Show them as three distinct cards:

```text
┌──────────────────────┐
│ POSTER               │
│ 2:3 • ~600 × 900     │
│                      │
│   [preview image]    │
│                      │
│ [Choose image]       │
│                      │
│ ✓ Correct size       │
└──────────────────────┘

┌──────────────────────┐
│ BANNER               │
│ 16:9 • ~1280 × 720   │
│       ...            │
└──────────────────────┘

┌──────────────────────┐
│ THUMBNAIL            │
│ 16:9 • ~640 × 360    │
│       ...            │
└──────────────────────┘
```

Errors must be editor-friendly.

Good:

> **This image is too large.**  
> Maximum file size is 200 KB. Please choose a smaller image.

Not:

> `413 Payload Too Large`

Also show client-side previews, but remember that the backend must enforce the actual rules.

---

## 9. Validation experience

Validation should be actionable.

Example:

```text
Publish blocked

3 issues need attention

Artwork
2 episodes are missing required artwork
[View episodes]

Duration
1 episode has no duration
[View episode]

Duplicate language variant
The Lost Kite has two `en` entries in the same content group
[Review]
```

Every issue should answer:

1. What is wrong?
2. Where is it wrong?
3. What should the editor do?

The publish button should remain disabled while blocking validation issues exist.

---

## 10. Publish page

Recommended structure:

```text
Publish Catalogue

Current status
[ BLOCKED ]  3 issues need attention

Validation report
[ issue groups ]

Catalogue preview
8 shows • 71 episodes • 2 languages

[ Publish Catalogue ]

Recent publish runs
#12  SUCCESS
#11  SUCCESS
#10  FAILED
```

The exact counts must come from the API, not hard-coded UI mock data.

For an editor role:

- Show validation results.
- Disable/hide publishing.
- Explain that publishing requires admin permission.

For an admin:

- Show the active publish action.
- Show run history and outcome.

---

## 11. States that must be designed

Every important screen needs:

### Loading
Use skeleton rows/cards instead of a blank page.

### Empty
Explain what happened and provide the next action.

Example:

> No shows match your filters.  
> Try clearing a filter or add a new show.

### Error
Use a friendly message plus retry action.

### Permission denied
Example:

> You can manage content, but only admins can publish the catalogue.

### Validation blocked
Use clear issue counts and direct links to the affected content.

---

## 12. Responsive behavior

### Desktop

CMS:
- Persistent sidebar.
- Wide content table.
- Filters in one or two rows.
- Dense but readable content.

Viewer:
- Full-width hero.
- Horizontal content rows.
- Large artwork.

### Tablet

- Collapse sidebar.
- Keep filters accessible.
- Reduce card sizes.
- Preserve horizontal viewer rows.

### Mobile

CMS:
- Drawer navigation.
- Table becomes stacked cards/list items.
- Filters become a sheet/drawer.

Viewer:
- Compact header.
- Hero text becomes smaller.
- Horizontal rows remain horizontally scrollable.
- Detail page becomes single-column.

---

## 13. Component direction

Suggested shared primitives:

```text
Button
IconButton
Badge
StatusBadge
SearchInput
Select
FilterBar
Card
Modal
Toast
EmptyState
ErrorState
Skeleton
Pagination
ArtworkUploader
```

Viewer-specific:

```text
Hero
ContentRow
ShowCard
EpisodeCard
LanguageBadge
SeasonTabs
```

CMS-specific:

```text
Sidebar
StatsCard
DataTable
ValidationIssue
PublishPanel
RunHistory
ArtworkSlot
```

Keep primitives visually consistent, but do not force the viewer and CMS into the same layout.

---

## 14. Artwork rules

The challenge requires:

| Surface | Asset | Target |
|---|---|---|
| Hero | Banner | 16:9, ~1280×720 |
| Show rows | Poster | 2:3, ~600×900 |
| Episode lists | Thumbnail | 16:9, ~640×360 |

Maximum upload size: **200 KB**.

Use the challenge-provided assets where appropriate, including the intentionally invalid samples to demonstrate validation.

Do not silently stretch or crop an invalid upload to make it pass validation. The API should reject invalid artwork and the CMS should explain why.

---

## 15. Interaction details

Keep motion subtle:

- Card hover: small lift/scale.
- Buttons: short opacity/transform transition.
- Row navigation: smooth horizontal scroll.
- Artwork loading: skeleton or blurred placeholder.
- Publish: show a clear progress/loading state and prevent duplicate submission.

Do not add animations that slow down content management.

---

## 16. Accessibility

Minimum requirements:

- Keyboard-accessible controls.
- Visible focus states.
- Proper button/link semantics.
- Alt text for meaningful artwork.
- Decorative artwork marked appropriately.
- Sufficient text contrast.
- Do not rely only on color for status.
- Labels for all artwork upload slots and form controls.

---

## 17. Design decisions that directly support the rubric

### Upload & validation
The UI makes each artwork requirement visible before upload and gives human-readable errors.

### Publish job
The UI treats publishing as an explicit controlled action and exposes run status/history.

### API/auth
Viewer screens use catalogue endpoints only. CMS permissions mirror enforced backend roles.

### CMS usability
Search, filters, pagination, validation and clear states are first-class interactions.

### Viewer
Hero uses banner, rows use poster, episode lists use thumbnail, and grouped languages appear as one episode.

### Operability
Loading/error/permission states are designed from the beginning rather than added after the happy path.

---

## 18. What NOT to copy from the references

Use the references for visual language, not exact reproduction.

Avoid:

- Pixel-for-pixel copies of the official Peblo website.
- Copying unrelated marketing sections.
- Overusing giant headings inside the CMS.
- Turning every CMS panel into a colorful pastel card.
- Decorative elements that compete with content management.
- Hard-coded sample metrics that don't reflect the API.
- Viewer UI that calls admin endpoints.

The goal is a **Peblo-inspired product surface with our own implementation decisions**.

---

## 19. Implementation priority

Given the challenge's limited time, build in this order:

### P0 — Must work
1. Viewer home + hero + rows
2. Show detail + seasons + grouped languages
3. Viewer search/filter
4. CMS show/episode list
5. CMS create/edit
6. Artwork validation UI
7. Validation report
8. Publish page
9. Role-aware publish action

### P1 — Polish
10. Loading skeletons
11. Empty/error/permission states
12. Responsive layouts
13. Hover/focus motion
14. Publish history refinement

### P2 — Only if time remains
15. Extra dashboard analytics
16. Advanced animations
17. Optional stretch features

Do not sacrifice backend correctness for visual polish.

---

## 20. Final visual goal

The finished product should feel like:

**Peblo's playful visual world + a serious internal content tool + a simple child-friendly streaming catalogue.**

The strongest visual hierarchy is:

**Artwork → title → useful metadata → action**

rather than:

**Decorations → UI controls → content**.
