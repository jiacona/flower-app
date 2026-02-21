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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useVarieties } from '@/hooks/useVarieties';
import type { Variety } from '@/db/types';

export default function CropDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.cropName}>{cropName}</Text>

      <Text style={styles.sectionTitle}>Varieties</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
            {
              color: colors.text,
              borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
              backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
            },
          ]}
          placeholder="New variety"
          value={newVarietyName}
          onChangeText={setNewVarietyName}
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
        />
        <Pressable
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddVariety}
          disabled={adding || !newVarietyName.trim()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.text} />
      ) : varieties.length === 0 ? (
        <Text style={[styles.empty, { color: colors.text, opacity: 0.7 }]}>
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
                { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' },
              ]}
            >
              <Text style={styles.varietyName}>{item.name}</Text>
              <Pressable
                onPress={() => handleDeleteVariety(item)}
                hitSlop={8}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colorScheme === 'dark' ? '#ff6b6b' : '#c00'}
                />
              </Pressable>
            </View>
          )}
        />
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Season summary</Text>
      <Text style={[styles.placeholder, { color: colors.text, opacity: 0.6 }]}>
        Coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cropName: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
  loader: { marginVertical: 24 },
  empty: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  varietyName: { fontSize: 16 },
  placeholder: { fontSize: 14 },
});
