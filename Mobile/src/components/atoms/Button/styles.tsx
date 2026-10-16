import {StyleSheet} from 'react-native';
import {colors, spacing, typography} from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.button,
    color: colors.white,
  },
});
