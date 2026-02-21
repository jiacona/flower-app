import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import type { HarvestRecord } from '@/db/types';

const today = () => new Date().toISOString().slice(0, 10);

export function useHarvestRecords(
  filters?: { cropId?: number; varietyId?: number; date?: string; dateFrom?: string; dateTo?: string }
) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      let sql = 'SELECT * FROM harvest_records WHERE 1=1';
      const args: (string | number)[] = [];

      if (filters?.cropId) {
        sql += ' AND crop_id = ?';
        args.push(filters.cropId);
      }
      if (filters?.varietyId) {
        sql += ' AND variety_id = ?';
        args.push(filters.varietyId);
      }
      if (filters?.date) {
        sql += ' AND harvest_date = ?';
        args.push(filters.date);
      }
      if (filters?.dateFrom) {
        sql += ' AND harvest_date >= ?';
        args.push(filters.dateFrom);
      }
      if (filters?.dateTo) {
        sql += ' AND harvest_date <= ?';
        args.push(filters.dateTo);
      }

      sql += ' ORDER BY harvest_date DESC, id DESC';

      const rows = await db.getAllAsync<HarvestRecord>(sql, ...args);
      setRecords(rows);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.cropId,
    filters?.varietyId,
    filters?.date,
    filters?.dateFrom,
    filters?.dateTo,
    db,
  ]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (
      cropId: number,
      harvestDate: string,
      stemsCut: number,
      stemsWasted: number,
      varietyId?: number | null
    ) => {
      await db.runAsync(
        'INSERT INTO harvest_records (crop_id, variety_id, harvest_date, stems_cut, stems_wasted) VALUES (?, ?, ?, ?, ?)',
        cropId,
        varietyId ?? null,
        harvestDate,
        stemsCut,
        stemsWasted ?? 0
      );
      await fetchRecords();
    },
    [fetchRecords, db]
  );

  const addRecordsBatch = useCallback(
    async (
      items: Array<{
        cropId: number;
        varietyId?: number | null;
        stemsCut: number;
        stemsWasted?: number;
      }>,
      harvestDate: string
    ) => {
      for (const item of items) {
        await db.runAsync(
          'INSERT INTO harvest_records (crop_id, variety_id, harvest_date, stems_cut, stems_wasted) VALUES (?, ?, ?, ?, ?)',
          item.cropId,
          item.varietyId ?? null,
          harvestDate,
          item.stemsCut,
          item.stemsWasted ?? 0
        );
      }
      await fetchRecords();
    },
    [fetchRecords, db]
  );

  const updateRecord = useCallback(
    async (
      id: number,
      updates: { stems_cut?: number; stems_wasted?: number }
    ) => {
      if (updates.stems_cut !== undefined) {
        await db.runAsync('UPDATE harvest_records SET stems_cut = ? WHERE id = ?', updates.stems_cut, id);
      }
      if (updates.stems_wasted !== undefined) {
        await db.runAsync('UPDATE harvest_records SET stems_wasted = ? WHERE id = ?', updates.stems_wasted, id);
      }
      await fetchRecords();
    },
    [fetchRecords, db]
  );

  const deleteRecord = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM harvest_records WHERE id = ?', id);
      await fetchRecords();
    },
    [fetchRecords, db]
  );

  return {
    records,
    loading,
    refetch: fetchRecords,
    addRecord,
    addRecordsBatch,
    updateRecord,
    deleteRecord,
  };
}

export { today };
