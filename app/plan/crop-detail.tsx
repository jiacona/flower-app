import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';
import { useVarieties } from '@/hooks/useVarieties';
import type { Variety } from '@/db/types';

export default function CropDetailScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { cropId, cropName } = useLocalSearchParams<{
    cropId: string;
    cropName: string;
  }>();
  const id = cropId ? parseInt(cropId, 10) : 0;

  const { varieties, loading, addVariety, deleteVariety } = useVarieties(id);
  const [newVarietyName, setNewVarietyName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddVariety = async () => {
    const name = newVarietyName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addVariety(id, name);
      setNewVarietyName('');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteVariety = (v: Variety) => {
    Alert.alert(
      'Delete variety',
      `Delete "${v.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVariety(v.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { flex: 1, padding: spacing.lg, backgroundColor: colors.background }]}>
      <Text style={[styles.cropName, { color: colors.text, marginBottom: spacing.lg }]}>{cropName}</Text>

      <Text style={[styles.sectionTitle, { ...typography.bodyEmphasis, marginBottom: spacing.md, color: colors.text }]}>
        Varieties
      </Text>
      <View style={[styles.addRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <TextInput
          style={[
            styles.addInput,
            {
              color: colors.text,
              borderColor: colors.inputBorder,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.sm,
            },
          ]}
          placeholder="New variety"
          value={newVarietyName}
          onChangeText={setNewVarietyName}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm, padding: spacing.md }, adding && styles.addBtnDisabled]}
          onPress={handleAddVariety}
          disabled={adding || !newVarietyName.trim()}
        >
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={[styles.loader, { marginVertical: spacing.xl }]} color={colors.text} />
      ) : varieties.length === 0 ? (
        <Text style={[styles.empty, { color: colors.text, opacity: 0.7, marginBottom: spacing.lg }]}>
          No varieties. Add one above.
        </Text>
      ) : (
        <FlatList
          data={varieties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { borderBottomColor: colors.rowBorder },
              ]}
            >
              <Text style={[styles.varietyName, { color: colors.text }]}>{item.name}</Text>
              <Pressable
                onPress={() => handleDeleteVariety(item)}
                hitSlop={spacing.sm}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.destructive}
                />
              </Pressable>
            </View>
          )}
        />
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md, color: colors.text }]}>
        Season summary
      </Text>
      <Text style={[styles.placeholder, { color: colors.text, opacity: 0.6, ...typography.small }]}>
        Coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  cropName: { fontSize: 20, fontWeight: '600' },
  sectionTitle: {},
  addRow: { flexDirection: 'row' },
  addInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: { justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  loader: {},
  empty: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  varietyName: { fontSize: 16 },
  placeholder: {},
});
