import {StyleSheet} from 'react-native';
import {colors, spacing} from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    textAlign: 'center',
  },
});
