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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDayBreakdown } from '@/hooks/useDayBreakdown';

export default function DayDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { date } = useLocalSearchParams<{ date: string }>();
  const { items, loading } = useDayBreakdown(date);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const cardBg = colorScheme === 'dark' ? '#222' : '#f8f8f8';
  const cardBorder = colorScheme === 'dark' ? '#333' : '#eee';

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
              <Ionicons name="chevron-back" size={28} color={colors.tint} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.dateTitle, { color: colors.text }]}>
        {formatDate(date)}
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.text} />
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.text }]}>
          No records for this day.
        </Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item, idx) => {
            const label = item.varietyName
              ? `${item.cropName}, ${item.varietyName}`
              : item.cropName;
            return (
              <View
                key={`${item.cropName}-${item.varietyName ?? 'mixed'}-${idx}`}
                style={[
                  styles.row,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text
                  style={[styles.rowLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>
                  {item.stemsCut}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  loader: { marginTop: 24 },
  empty: {
    fontSize: 16,
    marginTop: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  rowLabel: { fontSize: 16, flex: 1 },
  rowValue: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
});
