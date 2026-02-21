import React, { useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { View, Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCropsForRecord } from '@/hooks/useCropsForRecord';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useDebounce } from '@/hooks/useDebounce';
import type { Crop } from '@/db/types';

export default function RecordScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { crops, loading, loadingMore, hasMore, refetch, loadMore, markUsed } =
    useCropsForRecord(debouncedSearch);
  const { stemsCut, refetch: refetchDaily } = useDailyTotals();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchDaily();
    }, [refetch, refetchDaily])
  );

  const handleSelectCrop = (crop: Crop) => {
    markUsed(crop.id);
    router.push({
      pathname: '/record/stem-entry',
      params: { cropId: crop.id, cropName: crop.name },
    });
  };

  const dailyCardBg = colorScheme === 'dark' ? '#111' : '#f8f8f8';
  const dailyCardBorder = colorScheme === 'dark' ? '#333' : '#eee';
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayLabel = now.toLocaleDateString('en-US', { day: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily totals</Text>
      <View
        style={[
          styles.dailyCard,
          { backgroundColor: dailyCardBg, borderColor: dailyCardBorder },
        ]}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{monthLabel}</Text>
          <Text style={styles.dateDay}>{dayLabel}</Text>
        </View>
        <View style={[styles.stemsSection, { borderLeftColor: dailyCardBorder }]}>
          <Text style={[styles.stemsLabel, { color: colors.text }]}>
            Stems cut
          </Text>
          <Text style={[styles.stemsValue, { color: colors.text }]}>
            {stemsCut}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent crops</Text>

      <View style={styles.listArea}>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : crops.length === 0 ? (
          <Text style={styles.empty}>
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
                pressed && styles.rowPressed,
              ]}
              onPress={() => handleSelectCrop(item)}
            >
              <Text style={styles.cropName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          )}
          />
        )}
      </View>

      <View style={[styles.searchFooter, { backgroundColor: colors.background }]}>
        <View style={[styles.searchRow, colorScheme === 'dark' && styles.searchRowDark]}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateBox: {
    backgroundColor: '#2f95dc',
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
    color: '#fff',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchRowDark: {
    backgroundColor: '#333',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  loader: { marginTop: 24 },
  loadMoreSpinner: { paddingVertical: 16 },
  empty: {
    color: '#666',
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
    borderBottomColor: '#eee',
  },
  rowPressed: { opacity: 0.6 },
  cropName: { fontSize: 16 },
});
