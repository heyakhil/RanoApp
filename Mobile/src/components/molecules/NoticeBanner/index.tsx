import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';

interface NoticeBannerProps {
  icon: string;
  title: string;
  message: string;
  color: string;
  backgroundColor: string;
  compact?: boolean;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  icon,
  title,
  message,
  color,
  backgroundColor,
  compact = false,
}) => {
  return (
    <View style={[styles.banner, compact && styles.compact, { backgroundColor }]}>
      <MaterialCommunityIcons
        name={icon}
        size={compact ? 16 : 20}
        color={color}
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={[styles.message, { color }]}>{message}</Text>
      </View>
    </View>
  );
};
