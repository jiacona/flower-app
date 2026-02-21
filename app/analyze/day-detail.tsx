import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';
import { useDayBreakdown } from '@/hooks/useDayBreakdown';

export default function DayDetailScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { groups, loading } = useDayBreakdown(date);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!date) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.container, { flex: 1, padding: spacing.lg, backgroundColor: colors.background }]}>
      <Text style={[styles.dateTitle, { ...typography.sectionTitle, marginBottom: spacing.lg, color: colors.text }]}>
        {formatDate(date)}
      </Text>

      {loading ? (
        <ActivityIndicator style={[styles.loader, { marginTop: spacing.xl }]} color={colors.text} />
      ) : groups.length === 0 ? (
        <Text style={[styles.empty, { fontSize: 16, marginTop: spacing.lg, color: colors.text }]}>
          No records for this day.
        </Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View
              key={group.cropName}
              style={[
                styles.speciesCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {(() => {
                const onlyMixed =
                  group.varieties.length === 1 && group.varieties[0].varietyName === null;
                return (
                  <>
              <View
                style={[
                  styles.speciesHeader,
                  onlyMixed
                    ? { borderBottomWidth: 0 }
                    : { borderBottomColor: colors.cardBorder },
                ]}
              >
                <Text
                  style={[styles.speciesName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {group.cropName}
                </Text>
                <Text style={[styles.speciesTotal, { color: colors.text }]}>
                  {group.cropTotal}
                </Text>
              </View>
              {onlyMixed ? null : (
                group.varieties.map((v, idx) => (
                  <View
                    key={`${v.varietyName ?? 'crop'}-${idx}`}
                    style={styles.varietyRow}
                  >
                    <Text
                      style={[styles.varietyLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {v.varietyName ?? 'Mixed'}
                    </Text>
                    <Text style={[styles.varietyValue, { color: colors.text }]}>
                      {v.stemsCut}
                    </Text>
                  </View>
                ))
              )}
                  </>
                );
              })()}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {},
  dateTitle: {},
  loader: {},
  empty: {},
  scroll: { flex: 1 },
  speciesCard: { borderWidth: 1, overflow: 'hidden' },
  speciesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  speciesName: { fontSize: 16, fontWeight: '600', flex: 1 },
  speciesTotal: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
  varietyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 24,
  },
  varietyLabel: { fontSize: 15, flex: 1, opacity: 0.9 },
  varietyValue: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
});
