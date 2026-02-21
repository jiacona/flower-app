import { useState, useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/useTheme';
import { useVarieties } from '@/hooks/useVarieties';
import { useHarvestRecords, today } from '@/hooks/useHarvestRecords';
import { useSQLiteContext } from 'expo-sqlite';
import type { Crop } from '@/db/types';

type StemEntry = { varietyId: number | null; varietyName: string; count: number };

const QUICK_ADD = [1, 5, 10];

export default function StemEntryScreen() {
  const db = useSQLiteContext();
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { cropId, cropName } = useLocalSearchParams<{
    cropId: string;
    cropName: string;
  }>();
  const id = cropId ? parseInt(cropId, 10) : 0;
  const harvestDate = today();

  const { varieties, loading } = useVarieties(id);
  const { addRecordsBatch } = useHarvestRecords({
    cropId: id,
    date: harvestDate,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cropTotal, setCropTotal] = useState(0);
  const [entries, setEntries] = useState<StemEntry[]>([]);
  const [crop, setCrop] = useState<Crop | null>(null);

  useEffect(() => {
    (async () => {
      const row = await db.getFirstAsync<Crop>('SELECT * FROM crops WHERE id = ?', id);
      setCrop(row ?? null);
    })();
  }, [id, db]);

  useEffect(() => {
    if (varieties.length > 0 && entries.length === 0) {
      setEntries(
        varieties.map((v) => ({
          varietyId: v.id,
          varietyName: v.name,
          count: 0,
        }))
      );
    }
  }, [varieties, entries.length]);

  const addToCount = (delta: number) => {
    if (selectedId === null) {
      setCropTotal((prev) => Math.max(0, prev + delta));
    } else {
      setEntries((prev) => {
        const next = [...prev];
        const idx = next.findIndex((e) => e.varietyId === selectedId);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            count: Math.max(0, next[idx].count + delta),
          };
        }
        return next;
      });
    }
  };

  const totalVariety = entries.reduce((s, e) => s + e.count, 0);
  const totalAll = totalVariety + cropTotal;

  const handleSave = async () => {
    const items: Array<{
      cropId: number;
      varietyId?: number | null;
      stemsCut: number;
      stemsWasted?: number;
    }> = [];

    for (const e of entries) {
      if (e.count > 0) {
        items.push({ cropId: id, varietyId: e.varietyId, stemsCut: e.count });
      }
    }
    if (cropTotal > 0) {
      items.push({ cropId: id, varietyId: null, stemsCut: cropTotal });
    }

    if (items.length === 0) return;

    await addRecordsBatch(items, harvestDate);

    await db.runAsync(
      `INSERT INTO recent_crops (crop_id, last_used_at) VALUES (?, datetime('now'))
       ON CONFLICT(crop_id) DO UPDATE SET last_used_at = datetime('now')`,
      id
    );

    router.back();
  };

  const getCountForId = (vid: number) => {
    const e = entries.find((x) => x.varietyId === vid);
    return e?.count ?? 0;
  };

  const isSelected = (vid: number) => selectedId === vid;
  const cardBg = (vid: number) => {
    const hasCount = getCountForId(vid) > 0;
    const sel = isSelected(vid);
    return sel || hasCount ? colors.primaryBg : colors.surfaceElevated;
  };
  const cardBorder = (vid: number) =>
    isSelected(vid) ? colors.primary : colors.cardBorder;

  if (!crop) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Record harvest',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={colors.primary}
              />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cropName}>{cropName}</Text>
        <Text style={[styles.date, { color: colors.text, opacity: 0.7, marginBottom: spacing.lg }]}>
          {harvestDate}
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.text} />
        ) : (
          <>
            {entries.map((e) => (
              <Pressable
                key={e.varietyId ?? 'mixed'}
                style={[
                  styles.varietyCard,
                  {
                    backgroundColor: cardBg(e.varietyId!),
                    borderColor: cardBorder(e.varietyId!),
                  },
                ]}
                onPress={() => setSelectedId(e.varietyId!)}
              >
                <Text style={styles.varietyCardName}>{e.varietyName}</Text>
                {e.count > 0 && (
                  <Text style={[styles.varietyCardCount, { color: colors.text }]}>
                    {e.count}
                  </Text>
                )}
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Fixed bottom section */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            padding: spacing.lg,
            paddingBottom: Math.max(32, insets.bottom + 16),
          },
        ]}
      >
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              borderRadius: radius.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total Harvested</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{totalAll}</Text>
        </View>

        <View style={styles.quickBtnRow}>
          {QUICK_ADD.map((n) => (
            <Pressable
              key={n}
              style={({ pressed }) => [
                styles.quickBtn,
                { backgroundColor: colors.primary, borderRadius: radius.sm },
                pressed && styles.quickBtnPressed,
              ]}
              onPress={() => addToCount(n)}
            >
              <Text style={[styles.quickBtnText, { color: colors.onPrimary }]}>+{n}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.saveBtn,
            totalAll === 0 && styles.saveBtnDisabled,
            { borderColor: totalAll > 0 ? colors.primary : colors.muted, borderRadius: radius.sm },
          ]}
          onPress={handleSave}
          disabled={totalAll === 0}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: totalAll > 0 ? colors.primary : colors.muted },
            ]}
          >
            Save & next
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  cropName: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  date: {},
  loader: { marginVertical: 24 },
  varietyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  varietyCardName: { fontSize: 16, fontWeight: '500' },
  varietyCardCount: { fontSize: 16, fontWeight: '600' },
  footer: { borderTopWidth: 1 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 16, fontWeight: '500' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnPressed: { opacity: 0.8 },
  quickBtnText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { paddingVertical: 14, alignItems: 'center', borderWidth: 2 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
});
