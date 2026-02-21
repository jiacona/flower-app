import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/init';
import type { Crop } from '@/db/types';

export function useRecentCrops(searchQuery?: string, limit = 10) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
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
  }, [searchQuery, limit]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const markUsed = useCallback(async (cropId: number) => {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO recent_crops (crop_id, last_used_at) VALUES (?, datetime('now'))
       ON CONFLICT(crop_id) DO UPDATE SET last_used_at = datetime('now')`,
      cropId
    );
  }, []);

  return { crops, loading, refetch: fetchRecent, markUsed };
}
