import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Gender } from '../../../types/auth';
import { styles } from './styles';

const OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export interface GenderChipsProps {
  value: Gender | '';
  onChange: (value: Gender) => void;
  error?: string;
}

export const GenderChips: React.FC<GenderChipsProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <View>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {OPTIONS.map(option => {
          const selected = value === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text
                style={[
                  styles.chipLabel,
                  selected && styles.chipLabelSelected,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};
