import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles';

export interface AuthShellProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  scrollable = false,
  contentStyle,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animatedStyle = {
    flex: 1,
    opacity,
    transform: [{ translateY }],
  };

  return (
    <View style={styles.root}>
      <View style={styles.atmosphere} pointerEvents="none">
        <View style={styles.washTop} />
        <View style={styles.washAccent} />
        <View style={styles.washSoft} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={animatedStyle}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={[styles.contentGrow, contentStyle]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, contentStyle]}>{children}</View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};
