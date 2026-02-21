/**
 * Design tokens for consistent styling and theming.
 * Use these instead of hardcoded colors, spacing, and typography.
 */

import Colors from './Colors';

export type ColorScheme = 'light' | 'dark';

/** Semantic color set per theme (extends base Colors) */
export const semanticColors = {
  light: {
    ...Colors.light,
    /** Card/surface background */
    cardBg: '#f8f8f8',
    /** Card/surface border, dividers */
    cardBorder: '#eee',
    /** Input and search background */
    inputBg: '#f0f0f0',
    /** Primary action (buttons, links, date accent) */
    primary: '#2f95dc',
    /** Text on primary (e.g. button text) */
    onPrimary: '#fff',
    /** Muted/secondary text and icons */
    muted: '#999',
    /** More muted (placeholders) */
    mutedSoft: '#ccc',
    /** Destructive actions */
    destructive: '#c00',
    /** Row/list divider */
    rowBorder: '#eee',
    /** Primary-tinted background (e.g. selected card) */
    primaryBg: '#e3f2fd',
    /** Elevated surface (e.g. input bg, default card) */
    surfaceElevated: '#fff',
    /** Input border (e.g. text field) */
    inputBorder: '#ddd',
  },
  dark: {
    ...Colors.dark,
    cardBg: '#111',
    cardBorder: '#333',
    inputBg: '#333',
    primary: '#2f95dc',
    onPrimary: '#fff',
    muted: '#999',
    mutedSoft: '#ccc',
    destructive: '#ff6b6b',
    rowBorder: '#333',
    primaryBg: '#1a3a52',
    surfaceElevated: '#222',
    inputBorder: '#444',
  },
} as const;

/** Spacing scale (px) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** Border radius (px) */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

/** Typography: font sizes and weights */
export const typography = {
  /** Section titles (e.g. "Daily totals") */
  sectionTitle: { fontSize: 18, fontWeight: '600' as const },
  /** Body, list items */
  body: { fontSize: 16 },
  /** Body emphasis */
  bodyEmphasis: { fontSize: 16, fontWeight: '600' as const },
  /** Large value (e.g. stems count) */
  value: { fontSize: 20, fontWeight: '700' as const },
  /** Small label (e.g. date month) */
  caption: { fontSize: 12, fontWeight: '600' as const },
  /** Date day number on accent */
  dateDay: { fontSize: 22, fontWeight: '700' as const },
  /** Small/muted */
  small: { fontSize: 14 },
  /** Button label */
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

/** Full theme for a given color scheme */
export function getTheme(scheme: ColorScheme | null | undefined) {
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  return {
    colors: semanticColors[colorScheme],
    spacing,
    radius,
    typography,
    colorScheme: colorScheme as ColorScheme,
  };
}

export type Theme = ReturnType<typeof getTheme>;
