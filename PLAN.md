# Flower App – Planning & Context

Context document for future iterations. Use this to onboard or resume work: stack, data model, navigation, hooks, patterns, and next steps.

---

## Project Overview

Offline-first mobile app for flower farm harvest record keeping. Record stems by crop and variety, track daily totals, and manage crops. Data stays on device; export/import via CSV.

**Design goals:**
1. Works with poor/no signal (fully offline)
2. Export/import via CSV or sheets (no cloud backend)
3. Cross-platform (Android + iOS)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo (React Native), Expo Router (file-based routing) |
| Database | **expo-sqlite** – single SQLite DB, no backend |
| DB access | **SQLiteProvider** in root layout; all screens/hooks use **useSQLiteContext()** from `expo-sqlite` (no `getDatabase()` or `db/init.ts`) |
| Schema init | `db/schema.ts` exports `INIT_SQL`; root `_layout.tsx` passes it to `SQLiteProvider`’s `onInit` so the DB is created/migrated when the app opens |
| Theming | Design tokens in `constants/theme.ts`; `components/useTheme.ts` for current theme |
| Icons | `@expo/vector-icons` (Ionicons used in app) |

**Important:** There is no `db/init.ts`. All DB usage is via `useSQLiteContext()` inside the `SQLiteProvider` tree. Hooks and screens that need the DB must call `const db = useSQLiteContext();` and use `db` in callbacks (and include `db` in dependency arrays where relevant).

---

## Data Model

- **crops** – Species (e.g. Helianthus, Aquilegia). Fields: `id`, `name`, `price_per_stem`, `created_at`
- **varieties** – Per-crop cultivars. Fields: `id`, `crop_id`, `name`, `price_per_stem`, `created_at`. Unique on `(crop_id, name)`
- **harvest_records** – One row per harvest entry. Fields: `id`, `crop_id`, `variety_id` (nullable; null = crop-level / “Mixed”), `harvest_date`, `stems_cut`, `stems_wasted`, `created_at`
- **recent_crops** – Tracks last-used crops for “Recent crops” on Record tab. Fields: `crop_id` (PK), `last_used_at`

Schema SQL: `db/schema.ts` (`INIT_SQL`). TypeScript types: `db/types.ts` (`Crop`, `Variety`, `HarvestRecord`).

---

## Navigation Structure

**Pattern:** Detail screens live in root-level stacks (`record/`, `plan/`, `analyze/`). Tabs show list/content only; tapping an item pushes to the relevant stack. Do not nest a Stack inside a Tab (causes duplicate screen errors in Expo Router).

```
app/
├── _layout.tsx              # SQLiteProvider + RootLayoutNav (Stack)
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Record tab – daily totals + crop picker + search
│   ├── analyze.tsx          # Analyze tab – list of days with harvests
│   └── plan.tsx             # Plan tab – crops list, export CSV
├── record/
│   ├── _layout.tsx          # Stack
│   └── stem-entry.tsx       # Record harvest (crop + varieties, stems)
├── plan/
│   ├── _layout.tsx
│   └── crop-detail.tsx      # Crop + varieties, CSV import
├── analyze/
│   ├── _layout.tsx
│   └── day-detail.tsx       # Day breakdown by species/variety
├── modal.tsx
└── +not-found.tsx
```

**Routes:**
- Record tab → tap crop → `/record/stem-entry` with `cropId`, `cropName`
- Record tab → search with exactly one result → auto-navigate to `/record/stem-entry` for that crop (search cleared)
- Analyze tab → tap day → `/analyze/day-detail` with `date`
- Plan tab → tap crop → `/plan/crop-detail` with `cropId`

---

## Implemented Features

### Record tab (`app/(tabs)/index.tsx`)
- Daily totals card (date + stems cut today); tap → day detail for today
- Search box at bottom (keyboard pushes content; clear button when non-empty; theme-aware)
- Recent crops list: search, infinite scroll, refetch on tab focus (`useFocusEffect`)
- **Single-result search:** If search has exactly one result, app navigates directly to stem-entry for that crop, clears search, and marks crop as used (ref prevents double navigation)

### Stem entry (`app/record/stem-entry.tsx`)
- Loads crop by `cropId`; uses `useVarieties(cropId)` and `useHarvestRecords({ cropId, date })`
- Variety cards with quick-add (+1/+5/+10); crop-level “Mixed” when no variety; Save & Next writes via `addRecordsBatch`, updates `recent_crops`, then `router.back()`
- Custom back button in header (`Stack.Screen` `headerLeft` → `router.back()`)
- Bottom safe area for Android (`useSafeAreaInsets`)
- Uses design tokens

### Analyze tab (`app/(tabs)/analyze.tsx`)
- List of days with harvests (cards: MON DD + stems cut); tap → day detail
- Refetch on tab focus

### Day detail (`app/analyze/day-detail.tsx`)
- Groups records by species (crop); each group is a card with crop name and variety breakdown
- **Variety display:** `variety_id` null shown as **“Mixed”** (not “—”)
- **Only-Mixed case:** If a species has only one “row” and it’s Mixed, show a single card with no variety list and no bottom border on the header (`onlyMixed`)

### Plan tab (`app/(tabs)/plan.tsx`)
- Crops list, search, add crop; tap crop → crop detail
- **Export to CSV** – Harvest data (harvest_date, species, variety, stems_cut, stems_wasted) via share sheet; uses `useExport()`
- Crop detail: varieties CRUD, **CSV import** (Species + Variety columns) via `useImport()`

---

## Design Tokens & Theming

Use **design tokens** so styling is consistent and theme-aware. No component library; tokens are the single source of truth.

| What | Path |
|------|------|
| Theme (colors, spacing, radius, typography) | `constants/theme.ts` |
| Hook for current theme | `components/useTheme.ts` |
| Base colors (light/dark) | `constants/Colors.ts` |

**Usage:** `const { colors, spacing, radius, typography } = useTheme();` then e.g. `colors.cardBg`, `colors.primary`, `spacing.lg`, `radius.md`, `typography.sectionTitle`. Semantic color keys: `cardBg`, `cardBorder`, `inputBg`, `primary`, `onPrimary`, `muted`, `mutedSoft`, `destructive`, `rowBorder`, `primaryBg`, `surfaceElevated`, `inputBorder`.

---

## Key Paths & Hooks

| Purpose | Path |
|--------|------|
| Daily totals (today) | `hooks/useDailyTotals.ts` |
| All days with harvests | `hooks/useDailySummaries.ts` |
| Day breakdown by crop/variety | `hooks/useDayBreakdown.ts` |
| Harvest records CRUD + filters | `hooks/useHarvestRecords.ts` |
| Crop list for Record (search, pagination) | `hooks/useCropsForRecord.ts` |
| Crops CRUD (Plan tab) | `hooks/useCrops.ts` |
| Varieties for a crop | `hooks/useVarieties.ts` |
| Recent crops (short list) | `hooks/useRecentCrops.ts` |
| CSV import (crops/varieties) | `hooks/useImport.ts` |
| CSV export (harvest) | `hooks/useExport.ts` |
| Debounced search | `hooks/useDebounce.ts` |

All data hooks use **useSQLiteContext()** and pass `db` into async logic; include `db` in `useCallback` dependency arrays where the callback uses the DB.

---

## Patterns to Reuse

1. **Back button on first screen of a pushed stack** – Use `Stack.Screen` with `headerLeft` calling `router.back()` (tabs don’t provide a back button).
2. **Bottom safe area (Android)** – `useSafeAreaInsets()`; apply `paddingBottom: insets.bottom + 16` (or similar) on fixed bottom content.
3. **Daily summary card** – Blue date box (MON DD) on left, stems on right; reuse `dateBox` + `stemsSection` style pattern.
4. **Tab data refresh** – Wrap refetch in `useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]))` to avoid max update depth.
5. **Search debouncing** – `useDebounce(query, 300)` to avoid stale requests and list flicker.
6. **Single DB connection** – Never call `getDatabase()`; use `useSQLiteContext()` in components/hooks that need the DB.

---

## Potential Next Steps

- [ ] Season summary on Analyze tab (total stems, value, etc.)
- [x] CSV export (harvest data) – Plan tab “Export to CSV”
- [x] Record tab: single search result → direct to stem-entry
- [ ] Stem value display where `price_per_stem` is set
- [ ] EAS build polish for production
- [ ] Backup to Google Sheets (see below)

---

## Backup to Google Sheets – What It Entails

Backing up harvest data to a **Google Sheet** means the app would create or update a spreadsheet in the user’s Google Drive. Summary of what’s involved:

1. **Google Cloud** – Project, enable Sheets API (and optionally Drive API). OAuth 2.0 client IDs for Android + iOS (and optionally web for Expo).
2. **OAuth in app** – User signs in with Google; store tokens (e.g. `expo-secure-store`). Use `expo-auth-session` or native Google Sign-In. Scope e.g. `spreadsheets` or `drive.file`.
3. **Flow** – Tap “Back up to Google Sheet” → sign in if needed → create or find spreadsheet → append/update rows (same columns as CSV: harvest_date, species, variety, stems_cut, stems_wasted).
4. **Offline** – Backup only when online; queue or show “no connection” otherwise.
5. **Libraries** – `expo-auth-session`, `expo-secure-store`, REST or `googleapis` for Sheets API.

Fuller notes were in an earlier version of this doc; the above is enough to restart. Implementing is on the order of a few hours once the Google project and OAuth clients are set up.
