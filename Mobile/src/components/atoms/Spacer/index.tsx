import React from 'react';
import {View} from 'react-native';
import {spacing, SpacingKey} from '../../../theme/spacing';

export interface SpacerProps {
  size?: SpacingKey;
  horizontal?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
}) => {
  const value = spacing[size];

  return (
    <View
      style={
        horizontal
          ? {width: value}
          : {height: value}
      }
    />
  );
};
