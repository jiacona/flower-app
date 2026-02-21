import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/init';
import type { Variety } from '@/db/types';

export function useVarieties(cropId: number | null) {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVarieties = useCallback(async () => {
    if (!cropId) {
      setVarieties([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const db = await getDatabase();
      const rows = await db.getAllAsync<Variety>(
        'SELECT * FROM varieties WHERE crop_id = ? ORDER BY name',
        [cropId]
      );
      setVarieties(rows);
    } catch {
      setVarieties([]);
    } finally {
      setLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    fetchVarieties();
  }, [fetchVarieties]);

  const addVariety = useCallback(
    async (cropId: number, name: string, pricePerStem?: number) => {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO varieties (crop_id, name, price_per_stem) VALUES (?, ?, ?)',
        cropId,
        name.trim(),
        pricePerStem ?? null
      );
      await fetchVarieties();
    },
    [fetchVarieties]
  );

  const updateVariety = useCallback(
    async (id: number, updates: { name?: string; price_per_stem?: number | null }) => {
      const db = await getDatabase();
      if (updates.name !== undefined) {
        await db.runAsync('UPDATE varieties SET name = ? WHERE id = ?', updates.name.trim(), id);
      }
      if (updates.price_per_stem !== undefined) {
        await db.runAsync('UPDATE varieties SET price_per_stem = ? WHERE id = ?', updates.price_per_stem, id);
      }
      await fetchVarieties();
    },
    [fetchVarieties]
  );

  const deleteVariety = useCallback(
    async (id: number) => {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM varieties WHERE id = ?', id);
      await fetchVarieties();
    },
    [fetchVarieties]
  );

  return { varieties, loading, refetch: fetchVarieties, addVariety, updateVariety, deleteVariety };
}
