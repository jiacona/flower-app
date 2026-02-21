export const SCHEMA_VERSION = 1;

export const INIT_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS crops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price_per_stem REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS varieties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_stem REAL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(crop_id, name)
);

CREATE TABLE IF NOT EXISTS harvest_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_id INTEGER NOT NULL REFERENCES crops(id),
  variety_id INTEGER REFERENCES varieties(id) ON DELETE SET NULL,
  harvest_date TEXT NOT NULL,
  stems_cut INTEGER NOT NULL DEFAULT 0,
  stems_wasted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_harvest_crop_date ON harvest_records(crop_id, harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_date ON harvest_records(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_variety ON harvest_records(variety_id);
CREATE INDEX IF NOT EXISTS idx_varieties_crop ON varieties(crop_id);

-- Tracks which crops were recently used for "Recent crops" list
CREATE TABLE IF NOT EXISTS recent_crops (
  crop_id INTEGER PRIMARY KEY REFERENCES crops(id) ON DELETE CASCADE,
  last_used_at TEXT DEFAULT (datetime('now'))
);
`;
