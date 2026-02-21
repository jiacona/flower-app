import { useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { getDatabase } from '@/db/init';
import { parseCropVarietyCSV } from '@/utils/csv';

export interface ImportResult {
  cropsAdded: number;
  varietiesAdded: number;
  skipped: number;
  error?: string;
}

export function useImport() {
  const importCropsFromCSV = useCallback(async (): Promise<ImportResult> => {
    const result: ImportResult = { cropsAdded: 0, varietiesAdded: 0, skipped: 0 };

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/csv',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) {
        return result;
      }

      const file = new File(pickerResult.assets[0].uri);
      const content = await file.text();

      const rows = parseCropVarietyCSV(content);
      if (rows.length === 0) {
        result.error = 'No data found. CSV should have Species and Variety columns.';
        return result;
      }

      const db = await getDatabase();

      // Build crop name -> varieties map (dedupe)
      const cropVarieties = new Map<string, Set<string>>();
      for (const row of rows) {
        const species = row.species.trim();
        if (!species) continue;

        if (!cropVarieties.has(species)) {
          cropVarieties.set(species, new Set());
        }
        if (row.variety?.trim()) {
          cropVarieties.get(species)!.add(row.variety.trim());
        }
      }

      // Insert crops and varieties
      for (const [species, varieties] of cropVarieties) {
        let cropId: number | null = null;

        // Get or create crop
        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM crops WHERE name = ?',
          species
        );
        if (existing) {
          cropId = existing.id;
        } else {
          const insert = await db.runAsync(
            'INSERT INTO crops (name, price_per_stem) VALUES (?, 0)',
            species
          );
          cropId = Number(insert.lastInsertRowId);
          result.cropsAdded++;
        }

        for (const varietyName of varieties) {
          const existingVar = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM varieties WHERE crop_id = ? AND name = ?',
            cropId,
            varietyName
          );
          if (existingVar) {
            result.skipped++;
          } else {
            await db.runAsync(
              'INSERT INTO varieties (crop_id, name) VALUES (?, ?)',
              cropId,
              varietyName
            );
            result.varietiesAdded++;
          }
        }
      }

      return result;
    } catch (e) {
      result.error = e instanceof Error ? e.message : 'Import failed';
      return result;
    }
  }, []);

  return { importCropsFromCSV };
}
