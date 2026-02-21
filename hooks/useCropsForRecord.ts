import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '@/db/init';
import type { Crop } from '@/db/types';

const PAGE_SIZE = 30;

/**
 * Returns crops for the Record tab: recent first, filtered by search.
 * Supports infinite scroll pagination.
 */
export function useCropsForRecord(searchQuery?: string) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchPage = useCallback(
    async (offset: number): Promise<{ page: Crop[]; gotFullPage: boolean }> => {
      const db = await getDatabase();
      const q = searchQuery?.trim();
      const limit = PAGE_SIZE + 1; // fetch one extra to detect hasMore

      let rows: Crop[];
      if (q) {
        rows = await db.getAllAsync<Crop>(
          `SELECT c.* FROM crops c
           LEFT JOIN recent_crops rc ON c.id = rc.crop_id
           WHERE c.name LIKE ?
           ORDER BY rc.last_used_at IS NOT NULL DESC, rc.last_used_at DESC, c.name ASC
           LIMIT ? OFFSET ?`,
          `%${q}%`,
          limit,
          offset
        );
      } else {
        rows = await db.getAllAsync<Crop>(
          `SELECT c.* FROM crops c
           LEFT JOIN recent_crops rc ON c.id = rc.crop_id
           ORDER BY rc.last_used_at IS NOT NULL DESC, rc.last_used_at DESC, c.name ASC
           LIMIT ? OFFSET ?`,
          limit,
          offset
        );
      }

      const page = rows.length > PAGE_SIZE ? rows.slice(0, PAGE_SIZE) : rows;
      const gotFullPage = rows.length > PAGE_SIZE;

      return { page, gotFullPage };
    },
    [searchQuery]
  );

  const fetch = useCallback(async () => {
    const id = ++fetchIdRef.current;
    try {
      setLoading(true);
      setHasMore(true);
      const { page, gotFullPage } = await fetchPage(0);
      if (id !== fetchIdRef.current) return; // stale, ignore
      setCrops(page);
      setHasMore(gotFullPage);
    } catch {
      if (id !== fetchIdRef.current) return;
      setCrops([]);
    } finally {
      if (id !== fetchIdRef.current) return;
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const { page, gotFullPage } = await fetchPage(crops.length);
      setCrops((prev) => [...prev, ...page]);
      setHasMore(gotFullPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, crops.length, loadingMore, hasMore]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markUsed = useCallback(async (cropId: number) => {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO recent_crops (crop_id, last_used_at) VALUES (?, datetime('now'))
       ON CONFLICT(crop_id) DO UPDATE SET last_used_at = datetime('now')`,
      cropId
    );
  }, []);

  return { crops, loading, loadingMore, hasMore, refetch: fetch, loadMore, markUsed };
}
