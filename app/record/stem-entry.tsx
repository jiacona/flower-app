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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useVarieties } from '@/hooks/useVarieties';
import { useHarvestRecords, today } from '@/hooks/useHarvestRecords';
import { getDatabase } from '@/db/init';
import type { Crop } from '@/db/types';

type StemEntry = { varietyId: number | null; varietyName: string; count: number };

const QUICK_ADD = [1, 5, 10];

export default function StemEntryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
      const db = await getDatabase();
      const row = await db.getFirstAsync<Crop>('SELECT * FROM crops WHERE id = ?', id);
      setCrop(row ?? null);
    })();
  }, [id]);

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

    const db = await getDatabase();
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
    if (colorScheme === 'dark') {
      return sel || hasCount ? '#1a3a52' : '#222';
    }
    return sel || hasCount ? '#e3f2fd' : '#fff';
  };
  const cardBorder = (vid: number) =>
    isSelected(vid) ? '#2f95dc' : colorScheme === 'dark' ? '#333' : '#eee';

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
                color={colors.tint}
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
        <Text style={[styles.date, { color: colors.text, opacity: 0.7 }]}>
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
            borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
            paddingBottom: Math.max(32, insets.bottom + 16),
          },
        ]}
      >
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: colorScheme === 'dark' ? '#222' : '#f8f8f8',
              borderColor: colorScheme === 'dark' ? '#333' : '#eee',
            },
          ]}
        >
          <Text style={styles.totalLabel}>Total Harvested</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{totalAll}</Text>
        </View>

        <View style={styles.quickBtnRow}>
          {QUICK_ADD.map((n) => (
            <Pressable
              key={n}
              style={({ pressed }) => [
                styles.quickBtn,
                pressed && styles.quickBtnPressed,
              ]}
              onPress={() => addToCount(n)}
            >
              <Text style={styles.quickBtnText}>+{n}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.saveBtn,
            totalAll === 0 && styles.saveBtnDisabled,
            { borderColor: totalAll > 0 ? '#2f95dc' : '#999' },
          ]}
          onPress={handleSave}
          disabled={totalAll === 0}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: totalAll > 0 ? '#2f95dc' : '#999' },
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
  date: { marginBottom: 16 },
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
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    backgroundColor: '#2f95dc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBtnPressed: { opacity: 0.8 },
  quickBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
});
