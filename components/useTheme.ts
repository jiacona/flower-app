import { useMemo } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, type Theme } from '@/constants/theme';

/**
 * Returns the current theme (colors, spacing, radius, typography) for the active color scheme.
 */
export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return useMemo(() => getTheme(colorScheme), [colorScheme]);
}
