import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/init';

export type DailySummary = { date: string; stemsCut: number };

export function useDailySummaries() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const db = await getDatabase();
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summaries, loading, refetch: fetch };
}
