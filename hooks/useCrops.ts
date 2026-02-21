import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Crop } from '@/db/types';

export function useCrops(searchQuery?: string) {
  const db = useSQLiteContext();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedOnce = useRef(false);

  const fetchCrops = useCallback(async () => {
    if (!hasFetchedOnce.current) setLoading(true);
    try {
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
      hasFetchedOnce.current = true;
      setLoading(false);
    }
  }, [searchQuery, db]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const addCrop = useCallback(
    async (name: string, pricePerStem = 0) => {
      const result = await db.runAsync(
        'INSERT INTO crops (name, price_per_stem) VALUES (?, ?)',
        name.trim(),
        pricePerStem
      );
      await fetchCrops();
      return result.lastInsertRowId;
    },
    [fetchCrops, db]
  );

  const updateCrop = useCallback(
    async (id: number, updates: { name?: string; price_per_stem?: number }) => {
      if (updates.name !== undefined) {
        await db.runAsync('UPDATE crops SET name = ? WHERE id = ?', updates.name.trim(), id);
      }
      if (updates.price_per_stem !== undefined) {
        await db.runAsync('UPDATE crops SET price_per_stem = ? WHERE id = ?', updates.price_per_stem, id);
      }
      await fetchCrops();
    },
    [fetchCrops, db]
  );

  const deleteCrop = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM crops WHERE id = ?', id);
      await fetchCrops();
    },
    [fetchCrops, db]
  );

  return { crops, loading, error, refetch: fetchCrops, addCrop, updateCrop, deleteCrop };
}
