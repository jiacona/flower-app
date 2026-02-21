import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

export function useDailyTotals() {
  const db = useSQLiteContext();
  const [stemsCut, setStemsCut] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const date = today();
      const row = await db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(stems_cut), 0) as total FROM harvest_records WHERE harvest_date = ?',
        date
      );
      setStemsCut(row?.total ?? 0);
    } catch {
      setStemsCut(0);
    }
  }, [db]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stemsCut, refetch: fetch };
}
