import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export const styles = StyleSheet.create({
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  stepText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    maxWidth: 340,
  },
  emailChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.xl,
  },
  emailText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
  },
  genderBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(224, 82, 82, 0.08)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  submitContent: {
    height: 56,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
