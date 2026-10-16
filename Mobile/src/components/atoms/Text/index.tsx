import React from 'react';
import {Text as RNText, TextProps as RNTextProps} from 'react-native';
import {styles} from './styles';

type TextVariant = 'h1' | 'h2' | 'body' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  style,
  children,
  ...rest
}) => {
  return (
    <RNText style={[styles.base, styles[variant], style]} {...rest}>
      {children}
    </RNText>
  );
};
