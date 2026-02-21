import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { writeAsStringAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function escapeCsvField(value: string): string {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface ExportResult {
  success: boolean;
  error?: string;
  fileUri?: string;
}

/**
 * Export harvest records to CSV and open the system share sheet so the user
 * can save to Files, email, etc. Columns: harvest_date, species, variety, stems_cut, stems_wasted.
 */
const HARVEST_EXPORT_SQL = `SELECT h.harvest_date, c.name as crop_name, v.name as variety_name,
         h.stems_cut, h.stems_wasted
 FROM harvest_records h
 JOIN crops c ON h.crop_id = c.id
 LEFT JOIN varieties v ON h.variety_id = v.id
 ORDER BY h.harvest_date, c.name, v.name`;

export function useExport() {
  const db = useSQLiteContext();

  const exportHarvestToCSV = useCallback(async (): Promise<ExportResult> => {
    try {
      const rows = await db.getAllAsync<{
        harvest_date: string;
        crop_name: string;
        variety_name: string | null;
        stems_cut: number;
        stems_wasted: number;
      }>(HARVEST_EXPORT_SQL);

      const header = 'harvest_date,species,variety,stems_cut,stems_wasted';
      const lines = [
        header,
        ...rows.map(
          (r) =>
            [
              escapeCsvField(r.harvest_date),
              escapeCsvField(r.crop_name),
              escapeCsvField(r.variety_name ?? ''),
              r.stems_cut,
              r.stems_wasted,
            ].join(',')
        ),
      ];
      const csv = lines.join('\r\n');

      const dir = documentDirectory;
      if (!dir) {
        return { success: false, error: 'No document directory available' };
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `flowerfarm_harvest_${dateStr}.csv`;
      const fileUri = `${dir}${filename}`;
      await writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return { success: true, fileUri, error: 'Sharing not available on this device' };
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export harvest data',
      });
      return { success: true, fileUri };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Export failed',
      };
    }
  }, [db]);

  return { exportHarvestToCSV };
}
