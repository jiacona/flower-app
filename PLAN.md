# Flower App – Planning & Context

Context document for future iterations. Updated as of recent session.

---

## Project Overview

Offline-first mobile app for flower farm harvest record keeping. Record stems by crop and variety, track daily totals, and manage crops. Data stays on device; export/import via CSV.

**Design goals:**
1. Works with poor/no signal (fully offline)
2. Export/import via CSV or sheets (no cloud backend)
3. Cross-platform (Android + iOS)

---

## Data Model

- **Crops** – Species (e.g. Helianthus, Aquilegia) with optional `price_per_stem`
- **Varieties** – Per-crop cultivars with optional `price_per_stem`
- **Harvest records** – `crop_id`, optional `variety_id` (null = crop-level), `harvest_date`, `stems_cut`, `stems_wasted`
- **Recent crops** – Tracks last-used crops for “Recent crops” list on Record tab

Schema: `db/schema.ts`, types: `db/types.ts`

---

## Navigation Structure

**Important:** Avoid nesting a Stack inside a Tab. It causes duplicate/extraneous screen errors in Expo Router.

**Pattern:** Detail screens live in root-level stacks (like `record/`, `plan/`, `analyze/`). Tabs show list/content screens only; tapping an item pushes to the relevant root stack.

```
app/
├── _layout.tsx          # Root Stack: (tabs), record, plan, analyze, modal
├── (tabs)/
│   ├── index.tsx        # Record tab – daily totals + crop picker
│   ├── analyze.tsx      # Analyze tab – list of days with harvests
│   └── plan.tsx         # Plan tab – crops list
├── record/              # Stack (stem-entry)
├── plan/                # Stack (crop-detail)
└── analyze/             # Stack (day-detail)
```

**Flow:**
- Record tab → pick crop → `/record/stem-entry`
- Analyze tab → pick day → `/analyze/day-detail`
- Plan tab → pick crop → `/plan/crop-detail`

---

## Implemented Features

### Record tab (`app/(tabs)/index.tsx`)
- Daily totals card at top (date + stems cut for today)
- Search box fixed at bottom for thumb reach
- Recent crops list with search and infinite scroll
- Refetches on tab focus via `useFocusEffect`

### Stem entry (`app/record/stem-entry.tsx`)
- Variety cards, quick-add (+1/+5/+10), Save & next
- Custom back button in header (iOS; first screen in stack)
- Bottom safe area for Android virtual nav bar (`useSafeAreaInsets`)
- Dark mode support

### Analyze tab (`app/(tabs)/analyze.tsx`)
- List of days with harvests
- Each day: card with date (MON DD) + stems cut (same layout as Record daily card)
- Tap day → `/analyze/day-detail`

### Day detail (`app/analyze/day-detail.tsx`)
- Breakdown by crop and variety
- Custom back button (navigates from root stack)
- Formatted date header

### Plan tab
- Crops list, search, add crop
- Crop detail with varieties and CSV import

---

## Key Paths & Hooks

| Purpose | Path |
|--------|------|
| Daily totals (today) | `hooks/useDailyTotals.ts` |
| All days with harvests | `hooks/useDailySummaries.ts` |
| Day breakdown by crop/variety | `hooks/useDayBreakdown.ts` |
| Harvest records CRUD | `hooks/useHarvestRecords.ts` |
| Crop list for Record (search, pagination) | `hooks/useCropsForRecord.ts` |
| Recent crops | `hooks/useRecentCrops.ts` |

---

## Patterns to Reuse

1. **Back button on first screen of a pushed stack** – Use `Stack.Screen` with `headerLeft` calling `router.back()` (no default back when coming from tabs).
2. **Bottom safe area (Android)** – `useSafeAreaInsets` from `react-native-safe-area-context`; apply `paddingBottom: Math.max(base, insets.bottom + 16)` on fixed bottom content.
3. **Daily summary card** – Blue date box (MON DD) on left, stems/value on right; `dateBox` + `stemsSection` styles.
4. **Tab data refresh** – Wrap refetch in `useFocusEffect` with `React.useCallback` to avoid max update depth.
5. **Search debouncing** – `useDebounce(query, 300)` to avoid stale requests and list flicker.

---

## Potential Next Steps

- [ ] Season summary on Analyze tab (total stems, value, etc.)
- [ ] CSV export (harvest data)
- [ ] Stem value display where `price_per_stem` is set
- [ ] EAS build polish for production
