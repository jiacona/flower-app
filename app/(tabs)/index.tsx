import React, { useState, useEffect, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { View, Text } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';
import { useCropsForRecord } from '@/hooks/useCropsForRecord';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useDebounce } from '@/hooks/useDebounce';
import type { Crop } from '@/db/types';

export default function RecordScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { crops, loading, loadingMore, hasMore, refetch, loadMore, markUsed } =
    useCropsForRecord(debouncedSearch);
  const { stemsCut, refetch: refetchDaily } = useDailyTotals();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const didAutoNavigateForSearch = useRef(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchDaily();
    }, [refetch, refetchDaily])
  );

  // When searching, if exactly one result, go directly to record harvest for that crop
  useEffect(() => {
    if (debouncedSearch.trim() === '') {
      didAutoNavigateForSearch.current = false;
      return;
    }
    if (didAutoNavigateForSearch.current || loading || crops.length !== 1) return;
    const crop = crops[0];
    didAutoNavigateForSearch.current = true;
    markUsed(crop.id);
    setSearch('');
    router.push({
      pathname: '/record/stem-entry',
      params: { cropId: crop.id, cropName: crop.name },
    });
  }, [debouncedSearch, loading, crops, markUsed]);

  const handleSelectCrop = (crop: Crop) => {
    markUsed(crop.id);
    router.push({
      pathname: '/record/stem-entry',
      params: { cropId: crop.id, cropName: crop.name },
    });
  };

  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayLabel = now.toLocaleDateString('en-US', { day: 'numeric' });

  const handlePressTodaySummary = () => {
    router.push({
      pathname: '/analyze/day-detail',
      params: { date: todayDate },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { padding: spacing.lg, paddingBottom: keyboardHeight }]}>
      <Text style={[styles.sectionTitle, { ...typography.sectionTitle, marginBottom: spacing.md, color: colors.text }]}>
        Daily totals
      </Text>
      <Pressable
        onPress={handlePressTodaySummary}
        style={({ pressed }) => [
          styles.dailyCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          pressed && styles.dailyCardPressed,
        ]}
      >
        <View style={[styles.dateBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.dateMonth, { color: colors.onPrimary }]}>{monthLabel}</Text>
          <Text style={[styles.dateDay, { color: colors.onPrimary }]}>{dayLabel}</Text>
        </View>
        <View style={[styles.stemsSection, { borderLeftColor: colors.cardBorder }]}>
          <Text style={[styles.stemsLabel, { color: colors.text }]}>
            Stems cut
          </Text>
          <Text style={[styles.stemsValue, { color: colors.text }]}>
            {stemsCut}
          </Text>
        </View>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md, color: colors.text }]}>
        Recent crops
      </Text>

      <View style={styles.listArea}>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : crops.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>
            No crops yet. Add crops in the Plan tab.
          </Text>
        ) : (
          <FlatList
          data={crops}
          keyExtractor={(item) => String(item.id)}
          onEndReached={() => hasMore && loadMore()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.loadMoreSpinner} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.rowBorder },
                pressed && styles.rowPressed,
              ]}
              onPress={() => handleSelectCrop(item)}
            >
              <Text style={[styles.cropName, { color: colors.text }]}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
          />
        )}
      </View>

      <View style={[styles.searchFooter, { backgroundColor: colors.background }]}>
        <View style={[styles.searchRow, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.muted}
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={spacing.sm}
              style={({ pressed }) => [pressed && styles.clearPressed]}
            >
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  sectionTitle: {},
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dailyCardPressed: { opacity: 0.8 },
  dateBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 64,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  stemsSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 1,
  },
  stemsLabel: { fontSize: 16 },
  stemsValue: { fontSize: 20, fontWeight: '700' },
  listArea: { flex: 1, minHeight: 0 },
  searchFooter: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearPressed: { opacity: 0.6 },
  loader: { marginTop: 24 },
  loadMoreSpinner: { paddingVertical: 16 },
  empty: {
    marginTop: 24,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  rowPressed: { opacity: 0.6 },
  cropName: { fontSize: 16 },
});
