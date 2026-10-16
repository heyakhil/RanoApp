import {StyleSheet} from 'react-native';
import {colors, spacing} from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.text,
    backgroundColor: colors.white,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.error,
  },
});
