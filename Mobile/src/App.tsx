import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { AuthGate } from './navigation';
import { configureGoogleSignIn } from './services/firebaseAuth';
import { listenForForegroundPush } from './services/pushNotifications';
import { paperTheme } from './theme/paperTheme';

const renderPaperIcon = (props: {
  name: string;
  size: number;
  color?: string;
}) => (
  <MaterialCommunityIcons
    {...props}
    color={props.color ?? paperTheme.colors.onSurface}
  />
);

function App(): React.JSX.Element {
  useEffect(() => {
    try {
      configureGoogleSignIn();
    } catch (error) {
      if (__DEV__) {
        console.warn('Google Sign-In configure failed', error);
      }
    }

    return listenForForegroundPush();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme} settings={{ icon: renderPaperIcon }}>
        <AuthProvider>
          <StatusBar barStyle="dark-content" />
          <AuthGate />
        </AuthProvider>
        <FlashMessage position="top" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
