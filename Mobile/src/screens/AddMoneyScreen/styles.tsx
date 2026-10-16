import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  info: {
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  prefix: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 14,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  quickBlock: {
    marginBottom: 40,
  },
  quickTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  chipSlot: {
    width: '33.333%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  chip: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blueSoft,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },
});
