import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  description: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  statusAccepted: {
    color: colors.secondary,
    fontWeight: '700',
  },
  statusRejected: {
    color: colors.error,
    fontWeight: '700',
  },
  statusPending: {
    color: colors.amber,
    fontWeight: '700',
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  metaRight: {
    color: colors.textSecondary,
    fontSize: 11,
    flexShrink: 0,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
