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
  progress: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  payCard: {
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  payTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  payLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  upiValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  qrBox: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  payEmpty: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  notice: {
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLast: {
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  upload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.muted,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  uploadHint: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 14,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },
});
