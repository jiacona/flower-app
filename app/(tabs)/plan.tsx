import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { View, Text } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';
import { useCrops } from '@/hooks/useCrops';
import { useExport } from '@/hooks/useExport';
import { useImport } from '@/hooks/useImport';
import type { Crop } from '@/db/types';

export default function PlanScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [search, setSearch] = useState('');
  const { crops, loading, addCrop, deleteCrop, refetch } = useCrops(search);
  const { importCropsFromCSV } = useImport();
  const { exportHarvestToCSV } = useExport();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [adding, setAdding] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const result = await exportHarvestToCSV();
      if (result.error && !result.success) {
        Alert.alert('Export', result.error);
      } else if (result.success) {
        Alert.alert('Export', 'Harvest data exported. Use the share sheet to save or send the CSV.');
      }
    } finally {
      setExporting(false);
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
    <View style={[styles.container, { padding: spacing.lg }]}>
      <Text style={[styles.sectionTitle, { ...typography.sectionTitle, marginBottom: spacing.md, color: colors.text }]}>
        All crops
      </Text>

      <View style={[styles.searchRow, { backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md, gap: spacing.sm }]}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.muted}
        />
      </View>

      <View style={[styles.dataActionsRow, { gap: spacing.md, marginBottom: spacing.md }]}>
        <Pressable
          style={[styles.importBtn, { borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }, (importing || exporting) && styles.addBtnDisabled]}
          onPress={handleImportCSV}
          disabled={importing || exporting}
        >
          <Ionicons name="document-attach" size={20} color={colors.primary} />
          <Text style={[styles.importBtnText, { color: colors.primary, ...typography.body }]}>Load from CSV</Text>
        </Pressable>
        <Pressable
          style={[styles.exportBtn, { borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }, (importing || exporting) && styles.addBtnDisabled]}
          onPress={handleExportCSV}
          disabled={importing || exporting}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={[styles.exportBtnText, { color: colors.primary, ...typography.body }]}>Export to CSV</Text>
        </Pressable>
      </View>

      <View style={[styles.addRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <TextInput
          style={[styles.addInput, { borderColor: colors.inputBorder, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated, color: colors.text }]}
          placeholder="New crop name"
          value={newCropName}
          onChangeText={setNewCropName}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm, padding: spacing.md }, adding && styles.addBtnDisabled]}
          onPress={handleAddCrop}
          disabled={adding || !newCropName.trim()}
        >
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={[styles.loader, { marginTop: spacing.xl }]} color={colors.text} />
      ) : crops.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted, marginTop: spacing.xl }]}>
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
                { borderBottomColor: colors.rowBorder },
                pressed && styles.rowPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/plan/crop-detail',
                  params: { cropId: item.id, cropName: item.name },
                })
              }
            >
              <Text style={[styles.cropName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => handleDeleteCrop(item)}
                  hitSlop={spacing.sm}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </Pressable>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  dataActionsRow: { flexDirection: 'row' },
  importBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  importBtnText: { fontWeight: '500' },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  exportBtnText: { fontWeight: '500' },
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
  empty: { fontSize: 16 },
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
