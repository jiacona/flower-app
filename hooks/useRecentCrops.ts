import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import type { Crop } from '@/db/types';

export function useRecentCrops(searchQuery?: string, limit = 10) {
  const db = useSQLiteContext();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    try {
      setLoading(true);
      const q = searchQuery?.trim();
      let rows: Crop[];
      if (q) {
        rows = await db.getAllAsync<Crop>(
          `SELECT c.* FROM crops c
           INNER JOIN recent_crops rc ON c.id = rc.crop_id
           WHERE c.name LIKE ?
           ORDER BY rc.last_used_at DESC
           LIMIT ?`,
          `%${q}%`,
          limit
        );
      } else {
        rows = await db.getAllAsync<Crop>(
          `SELECT c.* FROM crops c
           INNER JOIN recent_crops rc ON c.id = rc.crop_id
           ORDER BY rc.last_used_at DESC
           LIMIT ?`,
          limit
        );
      }
      setCrops(rows);
    } catch {
      setCrops([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, limit, db]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const markUsed = useCallback(
    async (cropId: number) => {
      await db.runAsync(
        `INSERT INTO recent_crops (crop_id, last_used_at) VALUES (?, datetime('now'))
         ON CONFLICT(crop_id) DO UPDATE SET last_used_at = datetime('now')`,
        cropId
      );
    },
    [db]
  );

  return { crops, loading, refetch: fetchRecent, markUsed };
}
