import { Platform, StyleSheet } from 'react-native';
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  identityText: { flex: 1 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
  },
  logoImage: {
    width: 25,
    height: 25,
    borderRadius: 6,
  },
  entry: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  marketName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  symbol: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  timeBlock: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  timeValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  seatsValue: {
    color: colors.primary,
  },
  numberValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  resultValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  pending: {
    color: colors.navy,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },
  timer: {
    backgroundColor: colors.warning,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '500',
  },
  timerValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  timerLost: {
    backgroundColor: colors.error,
  },
  timerWon: {
    backgroundColor: colors.secondary,
  },
  timerSettled: {
    backgroundColor: colors.muted,
  },
  timerSettledText: {
    color: colors.text,
  },
  statusBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
