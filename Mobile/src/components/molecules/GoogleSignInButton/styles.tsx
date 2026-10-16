import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
});
