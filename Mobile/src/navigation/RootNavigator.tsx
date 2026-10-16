import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ROUTES } from '../constants';
import {
  AddMoneyScreen,
  HistoryScreen,
  HomeScreen,
  OrdersScreen,
  PaymentVerificationScreen,
  TransactionHistoryScreen,
  WithdrawMoneyScreen,
} from '../screens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { styles } from './styles';

type WalletFlow = 'tabs' | 'add-money' | 'verify' | 'withdraw' | 'transactions';

const routes = [
  {
    key: ROUTES.HOME,
    title: 'Home',
    focusedIcon: 'home-variant',
    unfocusedIcon: 'home-variant-outline',
    accessibilityLabel: 'Home tab',
  },
  {
    key: ROUTES.ORDERS,
    title: 'Orders',
    focusedIcon: 'clipboard-text',
    unfocusedIcon: 'clipboard-text-outline',
    accessibilityLabel: 'Orders tab',
  },
  {
    key: ROUTES.HISTORY,
    title: 'History',
    focusedIcon: 'clock-time-four',
    unfocusedIcon: 'clock-time-four-outline',
    accessibilityLabel: 'History tab',
  },
  {
    key: ROUTES.PROFILE,
    title: 'Profile',
    focusedIcon: 'account-circle',
    unfocusedIcon: 'account-circle-outline',
    accessibilityLabel: 'Profile tab',
  },
];

export const RootNavigator: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState<WalletFlow>('tabs');
  const [amount, setAmount] = useState('');

  const closeFlow = () => {
    setAmount('');
    setFlow('tabs');
  };

  const goHome = () => setIndex(0);

  const handleHardwareBack = useCallback(() => {
    if (flow === 'verify') {
      setFlow('add-money');
      return true;
    }

    if (flow !== 'tabs') {
      setAmount('');
      setFlow('tabs');
      return true;
    }

    if (index !== 0) {
      setIndex(0);
      return true;
    }

    return false;
  }, [flow, index]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack,
    );

    return () => subscription.remove();
  }, [handleHardwareBack]);

  if (flow === 'add-money') {
    return (
      <AddMoneyScreen
        amount={amount}
        onChangeAmount={setAmount}
        onBack={closeFlow}
        onContinue={() => setFlow('verify')}
      />
    );
  }

  if (flow === 'withdraw') {
    return <WithdrawMoneyScreen onBack={closeFlow} />;
  }

  if (flow === 'transactions') {
    return <TransactionHistoryScreen onBack={closeFlow} />;
  }

  if (flow === 'verify') {
    return (
      <PaymentVerificationScreen
        amount={amount}
        onBack={() => setFlow('add-money')}
        onCancel={closeFlow}
        onSubmit={closeFlow}
      />
    );
  }

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      shifting={false}
      labeled
      barStyle={styles.tabBar}
      renderIcon={({ route, focused, color }) => (
        <MaterialCommunityIcons
          name={focused ? route.focusedIcon : route.unfocusedIcon}
          size={24}
          color={color}
        />
      )}
      renderScene={({ route }) => {
        if (route.key === ROUTES.HOME) {
          return <HomeScreen isActive={index === 0} />;
        }

        if (route.key === ROUTES.ORDERS) {
          return (
            <OrdersScreen
              isActive={index === routes.findIndex(item => item.key === ROUTES.ORDERS)}
              onBack={goHome}
            />
          );
        }

        if (route.key === ROUTES.HISTORY) {
          return (
            <HistoryScreen
              isActive={index === routes.findIndex(item => item.key === ROUTES.HISTORY)}
              onBack={goHome}
            />
          );
        }

        if (route.key === ROUTES.PROFILE) {
          return (
            <ProfileScreen
              onBack={goHome}
              onOpenOrders={() => {
                setIndex(routes.findIndex(item => item.key === ROUTES.ORDERS))
              }}
              onAddMoney={() => setFlow('add-money')}
              onWithdraw={() => setFlow('withdraw')}
              onOpenTransactions={() => setFlow('transactions')}
            />
          );
        }

        return null;
      }}
    />
  );
};
