import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { View, Text } from '@/components/Themed';
import { useCrops } from '@/hooks/useCrops';
import { useImport } from '@/hooks/useImport';
import type { Crop } from '@/db/types';

export default function PlanScreen() {
  const [search, setSearch] = useState('');
  const { crops, loading, addCrop, deleteCrop, refetch } = useCrops(search);
  const { importCropsFromCSV } = useImport();
  const [importing, setImporting] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddCrop = async () => {
    const name = newCropName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addCrop(name);
      setNewCropName('');
    } finally {
      setAdding(false);
    }
  };

  const handleImportCSV = async () => {
    setImporting(true);
    try {
      const result = await importCropsFromCSV();
      await refetch();
      const msg = result.error
        ? result.error
        : `Imported ${result.cropsAdded} crops and ${result.varietiesAdded} varieties.`;
      Alert.alert('Import', msg);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCrop = (crop: Crop) => {
    Alert.alert(
      'Delete crop',
      `Delete "${crop.name}"? This will also remove its varieties and harvest records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCrop(crop.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All crops</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      <Pressable
        style={[styles.importBtn, importing && styles.addBtnDisabled]}
        onPress={handleImportCSV}
        disabled={importing}
      >
        <Ionicons name="document-attach" size={20} color="#2f95dc" />
        <Text style={styles.importBtnText}>Load from CSV</Text>
      </Pressable>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="New crop name"
          value={newCropName}
          onChangeText={setNewCropName}
          placeholderTextColor="#999"
        />
        <Pressable
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddCrop}
          disabled={adding || !newCropName.trim()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : crops.length === 0 ? (
        <Text style={styles.empty}>
          No crops. Add one above or load from CSV.
        </Text>
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/plan/crop-detail',
                  params: { cropId: item.id, cropName: item.name },
                })
              }
            >
              <Text style={styles.cropName}>{item.name}</Text>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => handleDeleteCrop(item)}
                  hitSlop={8}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#c00" />
                </Pressable>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </Pressable>
          )}
        />
      )}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2f95dc',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  importBtnText: {
    color: '#2f95dc',
    fontSize: 16,
    fontWeight: '500',
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
  loader: { marginTop: 24 },
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
