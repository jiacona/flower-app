import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { semanticColors } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';

export default function ModalScreen() {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { ...typography.sectionTitle, fontSize: 20, color: colors.text }]}>
        Modal
      </Text>
      <View
        style={[styles.separator, { marginVertical: spacing.xl }]}
        lightColor={semanticColors.light.cardBorder}
        darkColor={semanticColors.dark.cardBorder}
      />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {},
  separator: {
    height: 1,
    width: '80%',
  },
});
