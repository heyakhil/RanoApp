import React from 'react';
import {TextInput, TextInputProps, View} from 'react-native';
import {Text} from '../../atoms/Text';
import {styles} from './styles';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  style,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
      <TextInput style={[styles.input, style]} placeholderTextColor="#9CA3AF" {...rest} />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
