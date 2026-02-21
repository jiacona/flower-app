import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/init';
import type { Crop } from '@/db/types';

export function useCrops(searchQuery?: string) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      let rows: Crop[];
      if (searchQuery && searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        rows = await db.getAllAsync<Crop>(
          'SELECT * FROM crops WHERE name LIKE ? ORDER BY name',
          [q]
        );
      } else {
        rows = await db.getAllAsync<Crop>('SELECT * FROM crops ORDER BY name');
      }
      setCrops(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load crops');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const addCrop = useCallback(
    async (name: string, pricePerStem = 0) => {
      const db = await getDatabase();
      const result = await db.runAsync(
        'INSERT INTO crops (name, price_per_stem) VALUES (?, ?)',
        name.trim(),
        pricePerStem
      );
      await fetchCrops();
      return result.lastInsertRowId;
    },
    [fetchCrops]
  );

  const updateCrop = useCallback(
    async (id: number, updates: { name?: string; price_per_stem?: number }) => {
      const db = await getDatabase();
      if (updates.name !== undefined) {
        await db.runAsync('UPDATE crops SET name = ? WHERE id = ?', updates.name.trim(), id);
      }
      if (updates.price_per_stem !== undefined) {
        await db.runAsync('UPDATE crops SET price_per_stem = ? WHERE id = ?', updates.price_per_stem, id);
      }
      await fetchCrops();
    },
    [fetchCrops]
  );

  const deleteCrop = useCallback(
    async (id: number) => {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM crops WHERE id = ?', id);
      await fetchCrops();
    },
    [fetchCrops]
  );

  return { crops, loading, error, refetch: fetchCrops, addCrop, updateCrop, deleteCrop };
}
