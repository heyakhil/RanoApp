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
  balanceCard: {
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  balanceHint: {
    color: colors.white,
    fontSize: 11,
    opacity: 0.75,
  },
  block: {
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addLinkText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '500',
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
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  upiList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  upiRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  upiLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  upiCopy: {
    flex: 1,
  },
  upiId: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  upiBank: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  upiRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  addCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: 12,
  },
  upiInput: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  notice: {
    marginBottom: spacing.lg,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },
});
