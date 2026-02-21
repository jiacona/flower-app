import React from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';
import { useDailySummaries } from '@/hooks/useDailySummaries';
import type { DailySummary } from '@/hooks/useDailySummaries';

export default function AnalyzeScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { summaries, loading, refetch } = useDailySummaries();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

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
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.dateBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        <View style={[styles.stemsSection, { borderLeftColor: colors.cardBorder }]}>
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
      <View style={[styles.container, { padding: spacing.lg }]}>
        <ActivityIndicator style={[styles.loader, { marginTop: spacing.xl }]} />
      </View>
    );
  }

  if (summaries.length === 0) {
    return (
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Text style={[styles.empty, { marginTop: spacing.xl, color: colors.text }]}>
          No harvest records yet. Record some stems in the Record tab.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { padding: spacing.lg }]}>
      <Text style={[styles.sectionTitle, { ...typography.sectionTitle, marginBottom: spacing.md, color: colors.text }]}>
        Daily totals
      </Text>
      <FlatList
        data={summaries}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {},
  loader: {},
  empty: { fontSize: 16, textAlign: 'center' },
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
