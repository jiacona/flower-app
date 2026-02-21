import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export type DayBreakdownVariety = {
  varietyName: string | null;
  stemsCut: number;
};

export type DayBreakdownGroup = {
  cropName: string;
  cropTotal: number;
  varieties: DayBreakdownVariety[];
};

export function useDayBreakdown(date: string | undefined) {
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<DayBreakdownGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!date) {
      setGroups([]);
      setLoading(false);
      return;
    }
    try {
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
      const items = rows.map((r) => ({
        cropName: r.crop_name,
        varietyName: r.variety_name,
        stemsCut: r.total,
      }));
      const byCrop = new Map<string, DayBreakdownVariety[]>();
      for (const item of items) {
        const list = byCrop.get(item.cropName) ?? [];
        list.push({ varietyName: item.varietyName, stemsCut: item.stemsCut });
        byCrop.set(item.cropName, list);
      }
      const grouped: DayBreakdownGroup[] = Array.from(byCrop.entries()).map(
        ([cropName, varieties]) => ({
          cropName,
          cropTotal: varieties.reduce((sum, v) => sum + v.stemsCut, 0),
          varieties,
        })
      );
      setGroups(grouped);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [date, db]);

  useEffect(() => {
    setLoading(true);
    fetch();
  }, [fetch]);

  return { groups, loading };
}
