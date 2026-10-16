import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import {Text} from '../Text';
import {colors} from '../../../theme';
import {styles} from './styles';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.container, isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
