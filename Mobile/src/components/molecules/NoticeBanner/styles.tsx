import { StyleSheet } from 'react-native';
import { spacing } from '../../../theme';

export const styles = StyleSheet.create({
  banner: {
    borderRadius: 24,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  compact: {
    borderRadius: 16,
    padding: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
  },
  message: {
    fontSize: 11,
    marginTop: spacing.xs,
    opacity: 0.75,
  },
});
