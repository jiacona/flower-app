import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback, useRef } from 'react';

export type DailySummary = { date: string; stemsCut: number };

export function useDailySummaries() {
  const db = useSQLiteContext();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedOnce = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasFetchedOnce.current) setLoading(true);
    try {
      const rows = await db.getAllAsync<{ harvest_date: string; total: number }>(
        `SELECT harvest_date, SUM(stems_cut) as total
         FROM harvest_records
         GROUP BY harvest_date
         ORDER BY harvest_date DESC`
      );
      setSummaries(rows.map((r) => ({ date: r.harvest_date, stemsCut: r.total })));
    } catch {
      setSummaries([]);
    } finally {
      hasFetchedOnce.current = true;
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summaries, loading, refetch: fetch };
}
