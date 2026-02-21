import React from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDailySummaries } from '@/hooks/useDailySummaries';
import type { DailySummary } from '@/hooks/useDailySummaries';

export default function AnalyzeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { summaries, loading, refetch } = useDailySummaries();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const dailyCardBg = colorScheme === 'dark' ? '#111' : '#f8f8f8';
  const dailyCardBorder = colorScheme === 'dark' ? '#333' : '#eee';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    };
  };

  const handlePressDay = (summary: DailySummary) => {
    router.push({
      pathname: '/analyze/day-detail',
      params: { date: summary.date },
    });
  };

  const renderItem = ({ item }: { item: DailySummary }) => {
    const { month, day } = formatDate(item.date);
    return (
      <Pressable
        onPress={() => handlePressDay(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: dailyCardBg, borderColor: dailyCardBorder },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        <View style={[styles.stemsSection, { borderLeftColor: dailyCardBorder }]}>
          <Text style={[styles.stemsLabel, { color: colors.text }]}>
            Stems cut
          </Text>
          <Text style={[styles.stemsValue, { color: colors.text }]}>
            {item.stemsCut}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} />
      </View>
    );
  }

  if (summaries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.empty, { color: colors.text }]}>
          No harvest records yet. Record some stems in the Record tab.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily totals</Text>
      <FlatList
        data={summaries}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  loader: { marginTop: 24 },
  empty: {
    marginTop: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: { paddingBottom: 24 },
  separator: { height: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9 },
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
});
