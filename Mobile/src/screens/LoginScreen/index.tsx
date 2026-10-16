import React, { useMemo } from 'react';
import { Image, ScrollView, StatusBar, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleSignInButton } from '../../components/molecules/GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';
import { styles } from './styles';

const HERO_COLORS = ['#101D36', '#1a3a6e'] as const;

const FEATURES: Array<{
  icon: string;
  color: string;
  bg: string;
  label: string;
}> = [
  {
    icon: 'trending-up',
    color: '#2563EB',
    bg: '#EAF1FF',
    label: '142K+ active traders worldwide',
  },
  {
    icon: 'flash',
    color: '#16A34A',
    bg: '#E8F7EF',
    label: '$4.2M paid out today',
  },
  {
    icon: 'chart-bar',
    color: '#B77916',
    bg: '#FFF4DD',
    label: '850+ live markets open now',
  },
];

const GRID_SIZE = 32;
const GRID_COLS = 14;
const GRID_ROWS = 18;

export const LoginScreen: React.FC = () => {
  const { signInWithGoogleAccount, isSubmitting, error } = useAuth();

  const gridLines = useMemo(() => {
    const horizontals = Array.from({ length: GRID_ROWS }, (_, index) => (
      <View
        key={`h-${index}`}
        style={[styles.gridLineHorizontal, { top: index * GRID_SIZE }]}
      />
    ));
    const verticals = Array.from({ length: GRID_COLS }, (_, index) => (
      <View
        key={`v-${index}`}
        style={[styles.gridLineVertical, { left: index * GRID_SIZE }]}
      />
    ));
    return [...horizontals, ...verticals];
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[...HERO_COLORS]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.hero}>
        <View style={styles.gridOverlay} pointerEvents="none">
          {gridLines}
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(37,99,235,0.25)']}
          style={styles.glow}
          pointerEvents="none"
        />

        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <View style={styles.logoBlock}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/rano-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Rano App"
              />
            </View>
          </View>

          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>
              Predict. <Text style={styles.headlineAccent}>Trade.</Text>
              {'\n'}Win.
            </Text>
            <Text style={styles.heroSupport}>
              Turn your market knowledge into real rewards. Instant payouts,
              zero hassle.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pullHandle} />

          <View style={styles.featureList}>
            {FEATURES.map(feature => (
              <View
                key={feature.label}
                style={[styles.featureRow, { backgroundColor: feature.bg }]}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.color },
                  ]}>
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Get started in seconds</Text>
            <View style={styles.dividerLine} />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <GoogleSignInButton
            label="Sign in with Google"
            loading={isSubmitting}
            onPress={() => {
              void signInWithGoogleAccount();
            }}
          />

          <Text style={styles.terms}>
            By signing in, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text>
            {' & '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
