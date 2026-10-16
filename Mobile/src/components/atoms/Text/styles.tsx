import {StyleSheet} from 'react-native';
import {colors, typography} from '../../../theme';

export const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  h1: {
    ...typography.h1,
  },
  h2: {
    ...typography.h2,
  },
  body: {
    ...typography.body,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
