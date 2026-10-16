import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import { GoogleLogo } from '../../atoms/GoogleLogo';
import { colors } from '../../../theme';
import { styles } from './styles';

export interface GoogleSignInButtonProps
  extends Omit<PressableProps, 'children'> {
  label?: string;
  loading?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Sign in with Google',
  loading = false,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled ? { opacity: 0.92 } : null,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <GoogleLogo size={20} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};
