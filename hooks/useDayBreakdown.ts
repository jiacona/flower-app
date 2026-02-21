import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/init';

export type DayBreakdownItem = {
  cropName: string;
  varietyName: string | null;
  stemsCut: number;
};

export function useDayBreakdown(date: string | undefined) {
  const [items, setItems] = useState<DayBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!date) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        crop_name: string;
        variety_name: string | null;
        total: number;
      }>(
        `SELECT c.name as crop_name, v.name as variety_name, SUM(h.stems_cut) as total
         FROM harvest_records h
         JOIN crops c ON h.crop_id = c.id
         LEFT JOIN varieties v ON h.variety_id = v.id
         WHERE h.harvest_date = ?
         GROUP BY h.crop_id, h.variety_id
         ORDER BY c.name, v.name`,
        date
      );
      setItems(
        rows.map((r) => ({
          cropName: r.crop_name,
          varietyName: r.variety_name,
          stemsCut: r.total,
        }))
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    fetch();
  }, [fetch]);

  return { items, loading };
}
