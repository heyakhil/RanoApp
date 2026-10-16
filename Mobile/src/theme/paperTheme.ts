import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.white,
    primaryContainer: colors.blueSoft,
    onPrimaryContainer: colors.navy,
    secondary: colors.secondary,
    secondaryContainer: colors.blueSoft,
    onSecondaryContainer: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.muted,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.border,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: colors.white,
      level2: colors.white,
      level3: colors.white,
    },
  },
};
