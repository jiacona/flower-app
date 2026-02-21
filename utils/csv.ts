/**
 * Parse CSV text and extract Species + Variety columns for crop/variety import.
 * Expects header row with "Species" and "Variety" columns (case-insensitive).
 */
export interface ParsedCropRow {
  species: string;
  variety: string | null;
}

export function parseCropVarietyCSV(csvText: string): ParsedCropRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerCols = parseCSVLine(lines[0]);
  const speciesIdx = headerCols.findIndex((c) =>
    c.trim().toLowerCase() === 'species'
  );
  const varietyIdx = headerCols.findIndex((c) =>
    c.trim().toLowerCase() === 'variety'
  );

  if (speciesIdx === -1) return [];

  const rows: ParsedCropRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCSVLine(line);
    const species = cols[speciesIdx]?.trim() ?? '';
    const variety =
      varietyIdx >= 0 && varietyIdx < cols.length
        ? (cols[varietyIdx]?.trim() || null)
        : null;

    if (species) {
      rows.push({ species, variety: variety || null });
    }
  }

  return rows;
}

/**
 * Simple CSV line parser - handles quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ',') {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
