import React from 'react';
import { Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { styles } from './styles';

interface StackedActionsProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryDisabled?: boolean;
}

export const StackedActions: React.FC<StackedActionsProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}) => {
  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.primary,
          primaryDisabled && styles.disabled,
          pressed && !primaryDisabled && styles.pressed,
        ]}
        onPress={onPrimary}
        disabled={primaryDisabled}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}>
        <Text style={styles.primaryLabel}>{primaryLabel}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        onPress={onSecondary}
        accessibilityRole="button"
        accessibilityLabel={secondaryLabel}>
        <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
      </Pressable>
    </>
  );
};
