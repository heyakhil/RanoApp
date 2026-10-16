import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../organisms/Header';
import { styles } from './styles';

export interface ScreenLayoutProps {
  title?: string;
  children: ReactNode;
  showHeader?: boolean;
  darkTop?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  children,
  showHeader = true,
  darkTop = false,
}) => {
  return (
    <SafeAreaView
      style={[styles.container, darkTop && styles.darkTop]}
      edges={['top', 'left', 'right']}
    >
      {showHeader && title ? <Header title={title} /> : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};
