# Flower Farm Record App

Offline-first mobile app for flower farm harvest record keeping. Record stems by crop and variety, track daily totals, and manage crops. Data stays on device; export/import via CSV.

## Expo Setup (Quick Reference)

You have an Expo account. To run and build:

### 1. Log in to EAS (for builds)
```bash
npx eas login
```
Enter your Expo credentials. Verify with `npx eas whoami`.

### 2. Run locally
```bash
npm start
# or
npx expo start
```
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go on a physical device

### 3. Build for devices (when ready)
```bash
npx eas build:configure   # creates eas.json
npx eas build --platform android   # or ios, or both
```

### 4. Development builds (optional)
For testing on a real device with native modules (expo-sqlite), use a development build:
```bash
npx eas build --profile development --platform android
```
Expo Go supports most libraries, but some native modules may need a dev build.

## Project structure
- `app/(tabs)/` – Record, Analyze, Plan tabs
- `app/record/` – Stem entry screen
- `app/plan/` – Crop detail screen
- `db/` – SQLite schema and init
- `hooks/` – Data hooks (useCrops, useVarieties, useHarvestRecords, etc.)

## Data model
- **Crops** – Species (e.g. Helianthus). Have price_per_stem.
- **Varieties** – Under crops (optional for harvests).
- **Harvest records** – Per date; variety optional (crop-level “mixed” recording).
