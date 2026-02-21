import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useTheme } from '@/components/useTheme';

export default function NotFoundScreen() {
  const { colors, spacing, typography } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { padding: spacing.lg }]}>
        <Text style={[styles.title, { ...typography.sectionTitle, fontSize: 20, color: colors.text }]}>
          This screen doesn't exist.
        </Text>

        <Link href="/" style={[styles.link, { marginTop: spacing.md, paddingVertical: spacing.md }]}>
          <Text style={[styles.linkText, { ...typography.small, color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {},
  link: {},
  linkText: {},
});
