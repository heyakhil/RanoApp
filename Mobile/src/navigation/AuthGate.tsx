import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { colors } from '../theme';
import { RootNavigator } from './RootNavigator';
import { styles } from './styles';

export const AuthGate: React.FC = () => {
  const { isBootstrapping, isAuthenticated, isProfileComplete } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.bootstrapping}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!isProfileComplete) {
    return <CompleteProfileScreen />;
  }

  return <RootNavigator />;
};
