import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { showMessage } from 'react-native-flash-message';
import { Avatar, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchWallet } from '../../api/rechargeApi';
import { NavHeader } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { styles } from './styles';

const HERO_COLORS = [colors.blueSoft, colors.greenSoft] as const;

interface ProfileAction {
  icon: string;
  label: string;
  color: string;
}

const QUICK_ACTIONS: ProfileAction[] = [
  { icon: 'plus-circle-outline', label: 'Add Money', color: colors.primary },
  { icon: 'arrow-top-right', label: 'Withdraw Money', color: colors.secondary },
];

const MORE_ITEMS: ProfileAction[] = [
  { icon: 'package-variant', label: 'Order', color: colors.amber },
  { icon: 'history', label: 'Transaction History', color: colors.primary },
  { icon: 'lock-outline', label: 'Privacy Policy', color: colors.error },
  {
    icon: 'file-document-outline',
    label: 'Terms & Conditions',
    color: colors.textSecondary,
  },
];

function formatBalance(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

interface ProfileScreenProps {
  onBack?: () => void;
  onOpenOrders?: () => void;
  onAddMoney?: () => void;
  onWithdraw?: () => void;
  onOpenTransactions?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onOpenOrders,
  onAddMoney,
  onWithdraw,
  onOpenTransactions,
}) => {
  const { user, logout, isSubmitting } = useAuth();
  const displayName = user?.name?.trim() || 'Rano User';
  const email = user?.email ?? '';
  const [balance, setBalance] = useState('0');
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchWallet()
      .then(wallet => {
        if (active) {
          setBalance(wallet.balance);
        }
      })
      .catch(error => {
        if (!active) {
          return;
        }

        showMessage({
          message:
            error instanceof Error && error.message
              ? error.message
              : 'Could not load your wallet balance. Please try again.',
          type: 'danger',
        });
      })
      .finally(() => {
        if (active) {
          setIsBalanceLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const onMorePress = (label: string) => {
    if (label === 'Order') {
      onOpenOrders?.();
    }
    if (label === 'Transaction History') {
      onOpenTransactions?.();
    }
  };

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="My Profile" onBack={onBack} rightIcon="bell-outline" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <LinearGradient
            colors={[...HERO_COLORS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <View style={styles.card}>
              <Avatar.Image
                size={84}
                style={styles.avatar}
                source={({ size }) =>
                  user?.photoUrl ? (
                    <Image
                      source={{ uri: user.photoUrl }}
                      style={[styles.avatarImage, { width: size, height: size }]}
                      accessibilityLabel={displayName}
                    />
                  ) : null
                }
              />

              <Text style={styles.name} numberOfLines={2}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>

              <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                {isBalanceLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    accessibilityLabel="Loading balance"
                  />
                ) : (
                  <Text style={styles.balanceValue}>
                    {formatBalance(balance)}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              {QUICK_ACTIONS.map(action => (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={() => {
                    if (action.label === 'Add Money') {
                      onAddMoney?.();
                    }
                    if (action.label === 'Withdraw Money') {
                      onWithdraw?.();
                    }
                  }}>
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: `${action.color}15` },
                    ]}>
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={24}
                      color={action.color}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, styles.sectionTitleTight]}>
              More
            </Text>
            <View style={styles.list}>
              {MORE_ITEMS.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.listRow,
                    index < MORE_ITEMS.length - 1 && styles.listRowBorder,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => onMorePress(item.label)}>
                  <View style={styles.listLeft}>
                    <View
                      style={[
                        styles.listIcon,
                        { backgroundColor: `${item.color}15` },
                      ]}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={item.color}
                      />
                    </View>
                    <Text style={styles.listLabel}>{item.label}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.signOut}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
              disabled={isSubmitting}
              onPress={() => {
                void logout();
              }}>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={colors.error}
              />
              <Text style={styles.signOutLabel}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};
