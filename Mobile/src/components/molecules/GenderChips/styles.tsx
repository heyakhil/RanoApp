import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';

export const styles = StyleSheet.create({
  label: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minWidth: '47%',
    flexGrow: 1,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blueSoft,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    marginTop: spacing.xs,
  },
});
