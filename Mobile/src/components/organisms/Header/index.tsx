import React from 'react';
import {View} from 'react-native';
import {Text} from '../../atoms/Text';
import {styles} from './styles';

export interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({title}) => {
  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        {title}
      </Text>
    </View>
  );
};
