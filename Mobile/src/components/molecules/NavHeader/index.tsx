import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../../theme';
import { styles } from './styles';

interface NavHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
}

export const NavHeader: React.FC<NavHeaderProps> = ({
  title,
  onBack,
  showBack = false,
  rightIcon,
  onRightPress,
}) => {
  const backVisible = showBack || Boolean(onBack);

  return (
    <View style={styles.bar}>
      {backVisible ? (
        <Pressable
          style={styles.slot}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : (
        <View style={styles.slot} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {rightIcon ? (
        <Pressable
          style={styles.slot}
          onPress={onRightPress}
          hitSlop={8}
          accessibilityRole="button">
          <MaterialCommunityIcons
            name={rightIcon}
            size={24}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : (
        <View style={styles.slot} />
      )}
    </View>
  );
};
