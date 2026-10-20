import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, ScrollView, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MarketCard } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { fetchWallet } from '../../api/rechargeApi';
import {
  ApiMarket,
  fetchJoinedMarketIds,
  fetchMarkets,
  getFeaturedMarket,
  joinMarket,
  Market,
  toDisplayMarket,
} from '../../services/markets';
import { colors } from '../../theme';
import { styles } from './styles';

const closeIcon = ({ size, color }: { size: number; color: string }) => (
  <MaterialCommunityIcons name="close" size={size} color={color} />
);

/** Keeps digits and a single decimal point with at most two decimals. */
const sanitizeAmount = (value: string) => {
  const [whole, ...fraction] = value.replace(/[^\d.]/g, '').split('.');
  return fraction.length > 0
    ? `${whole}.${fraction.join('').slice(0, 2)}`
    : whole;
};

interface HomeScreenProps {
  isActive?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ isActive = true }) => {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [markets, setMarkets] = useState<ApiMarket[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPickingNumber, setIsPickingNumber] = useState(false);
  const [pickValue, setPickValue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [now, setNow] = useState(() => new Date());
console.log("Markets", markets);
  const loadMarkets = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [nextMarkets, nextJoinedIds, wallet] = await Promise.all([
        fetchMarkets(),
        fetchJoinedMarketIds(),
        fetchWallet(),
      ]);
      setMarkets(nextMarkets);
      setJoinedIds(nextJoinedIds);
      setWalletBalance(Number(wallet.balance));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to load markets.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayMarkets = markets.map((market, index) =>
    toDisplayMarket(market, index, now, joinedIds.includes(market.id)),
  );
  const openCount = displayMarkets.filter(
    market => market.status === 'open',
  ).length;
  console.log("Now ===>", now);
  const featured = getFeaturedMarket(displayMarkets, now);
  const remainingMarkets = displayMarkets.filter(
    market => market.id !== featured?.id,
  );
  const activeMarket = selectedMarket
    ? displayMarkets.find(market => market.id === selectedMarket.id) ??
      selectedMarket
    : null;
  const hasJoined = activeMarket ? joinedIds.includes(activeMarket.id) : false;
  const isFull = activeMarket
    ? activeMarket.participants >= activeMarket.capacity
    : false;
  const canAfford =
    activeMarket !== null &&
    walletBalance !== null &&
    walletBalance >= activeMarket.minBetAmount;
  const canJoin =
    activeMarket?.status === 'open' && !hasJoined && !isFull && canAfford;

  const resetBetForm = () => {
    setIsPickingNumber(false);
    setPickValue('');
    setAmountValue('');
    setJoinError('');
  };

  const openMarket = (market: Market) => {
    resetBetForm();
    setSelectedMarket(market);
  };

  const closeDetails = () => {
    if (isJoining) return;
    setSelectedMarket(null);
    resetBetForm();
  };

  const closeBetForm = () => {
    if (isJoining) return;
    resetBetForm();
  };

  useEffect(() => {
    if (!isActive || !selectedMarket) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isJoining) {
        return true;
      }

      if (isPickingNumber) {
        setIsPickingNumber(false);
        setPickValue('');
        setAmountValue('');
        setJoinError('');
        return true;
      }

      setSelectedMarket(null);
      setJoinError('');
      return true;
    });

    return () => subscription.remove();
  }, [isActive, selectedMarket, isJoining, isPickingNumber]);

  const placeBet = async () => {
    if (!activeMarket || isJoining) return;

    const number = Number(pickValue);
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      showMessage({
        message: 'Enter a number from 1 to 99.',
        type: 'danger',
      });
      return;
    }

    const amount = Number(amountValue);
    const { minBetAmount, maxBetAmount } = activeMarket;
    if (!Number.isFinite(amount) || amount < minBetAmount || amount > maxBetAmount) {
      showMessage({
        message: `Enter an amount from ₹${minBetAmount} to ₹${maxBetAmount}.`,
        type: 'danger',
      });
      return;
    }
    if (walletBalance !== null && amount > walletBalance) {
      showMessage({ message: 'Insufficient wallet balance.', type: 'danger' });
      return;
    }

    setIsJoining(true);
    setJoinError('');
    try {
      const entry = await joinMarket(activeMarket.id, number, amount);
      setJoinedIds(current =>
        current.includes(entry.marketId) ? current : [...current, entry.marketId],
      );
      setWalletBalance(Number(entry.walletBalance));
      setMarkets(current =>
        current.map(market =>
          market.id === entry.marketId
            ? {
                ...market,
                participants: entry.participants,
                totalBetAmount: market.totalBetAmount + entry.entryAmount,
              }
            : market,
        ),
      );
      setSelectedMarket(null);
      resetBetForm();
      showMessage({
        message: `Bet of ₹${entry.entryAmount} placed on ${activeMarket.name} with number ${number}.`,
        type: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to join this market.';
      setJoinError(message);
      showMessage({ message, type: 'danger' });
    } finally {
      setIsJoining(false);
    }
  };

  const joinLabel = !activeMarket
    ? 'Join market'
    : hasJoined
      ? 'Already bet this round'
      : activeMarket.status === 'upcoming'
        ? 'Market has not opened'
        : activeMarket.status === 'closed'
          ? 'Market is closed'
          : isFull
            ? 'Market is full'
            : !canAfford
              ? 'Insufficient wallet balance'
              : 'Place bet';

  return (
    <ScreenLayout showHeader={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Avatar.Image
                  size={40}
                  source={require('../../assets/images/logo.png')}
                />
              </View>
              <Text variant="titleLarge" style={styles.brandName}>
                Rano<Text style={styles.brandDot}>.</Text>
              </Text>
            </View>
            <View style={styles.rightHeader}>
              <Avatar.Text
                size={36}
                label="R"
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
            </View>
          </View>
          <Text variant="labelMedium" style={styles.eyebrow}>
            MARKET OVERVIEW
          </Text>
          <Text variant="headlineMedium" style={styles.heading}>
            Find your next market.
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Explore predictions on the stocks you follow.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="circle-medium"
                size={19}
                color={colors.secondary}
              />
              <Text variant="labelLarge" style={styles.statValue}>
                {openCount} open markets
              </Text>
            </View>
            <View style={styles.statDivider} />
            <Text variant="labelLarge" style={styles.statSecondary}>
              {markets.length} markets to explore
            </Text>
          </View>
        </View>

        <View style={styles.main}>
          {featured && (
            <MarketCard
              market={featured}
              isFeatured
              onPress={() => openMarket(featured)}
            />
          )}

          <View style={styles.sectionRow}>
            <View>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Markets
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                Browse all prediction markets
              </Text>
            </View>
            <Text variant="labelMedium" style={styles.marketCount}>
              {markets.length} markets
            </Text>
          </View>
          {isLoading ? (
            <View style={styles.emptyContent}>
              <ActivityIndicator color={colors.primary} />
              <Text variant="bodySmall" style={styles.emptyDescription}>
                Loading markets…
              </Text>
            </View>
          ) : loadError ? (
            <Card mode="outlined" style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Markets are unavailable
                </Text>
                <Text variant="bodySmall" style={styles.emptyDescription}>
                  {loadError}
                </Text>
                <Button mode="outlined" onPress={loadMarkets}>
                  Try again
                </Button>
              </Card.Content>
            </Card>
          ) : markets.length > 0 ? (
            remainingMarkets.map(market => (
              <MarketCard
                key={market.id}
                market={market}
                onPress={() => openMarket(market)}
              />
            ))
          ) : (
            <Card mode="outlined" style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No markets found
                </Text>
                <Text variant="bodySmall" style={styles.emptyDescription}>
                  Published markets will appear here.
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={activeMarket !== null && !isPickingNumber}
          onDismiss={closeDetails}
          contentContainerStyle={styles.modal}
        >
          {activeMarket && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  Market details
                </Text>
                <IconButton
                  icon={closeIcon}
                  accessibilityLabel="Close market details"
                  onPress={closeDetails}
                />
              </View>
              <View style={styles.detailIdentity}>
                <View
                  style={[
                    styles.detailLogo,
                    { backgroundColor: activeMarket.accentBackground },
                  ]}
                >
                  {activeMarket.imageUrl ? (
                    <Image
                      source={{ uri: activeMarket.imageUrl }}
                      style={styles.detailLogoImage}
                      accessibilityLabel={`${activeMarket.name} image`}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.detailLogoText,
                        { color: activeMarket.accent },
                      ]}
                    >
                      {activeMarket.mark}
                    </Text>
                  )}
                </View>
                <View>
                  <Text variant="titleLarge" style={styles.detailSymbol}>
                    {activeMarket.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.detailCompany}>
                    {activeMarket.symbol}
                  </Text>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.detailHint}>
                Pick a number and choose how much to bet within the range. The
                amount is taken from your wallet. After the admin
                declares the result, this round closes and a new one starts.
              </Text>
              <View style={styles.facts}>
                <View style={styles.factRow}>
                  <Text variant="bodySmall" style={styles.factLabel}>
                    Market window
                  </Text>
                  <Text variant="labelMedium" style={styles.factValue}>
                    {activeMarket.schedule}
                  </Text>
                </View>
                <View style={styles.factRow}>
                  <Text variant="bodySmall" style={styles.factLabel}>
                    Bets placed
                  </Text>
                  <Text variant="labelMedium" style={styles.factValue}>
                    {activeMarket.participants} / {activeMarket.capacity}
                  </Text>
                </View>
                <View style={styles.factRow}>
                  <Text variant="bodySmall" style={styles.factLabel}>
                    Bet range
                  </Text>
                  <View style={styles.factAmount}>
                    <FontAwesome6
                      name="indian-rupee-sign"
                      size={14}
                      color={colors.text}
                    />
                    <Text variant="labelMedium" style={styles.factValue}>
                      {activeMarket.minBetAmount} – {activeMarket.maxBetAmount}
                    </Text>
                  </View>
                </View>
                <View style={styles.factRow}>
                  <Text variant="bodySmall" style={styles.factLabel}>
                    Wallet balance
                  </Text>
                  <Text variant="labelMedium" style={styles.factValue}>
                    {walletBalance === null ? '—' : `₹${walletBalance}`}
                  </Text>
                </View>
                <View style={styles.factRow}>
                  <Text variant="bodySmall" style={styles.factLabel}>
                    Last result
                  </Text>
                  <Text variant="labelMedium" style={styles.factValue}>
                    {activeMarket.lastResult ?? 'Not declared'}
                  </Text>
                </View>
              </View>
              {joinError ? (
                <Text variant="bodySmall" style={styles.joinError}>
                  {joinError}
                </Text>
              ) : null}
              <Button
                mode="contained"
                disabled={!canJoin || isJoining}
                style={styles.disabledButton}
                onPress={() => {
                  resetBetForm();
                  setIsPickingNumber(true);
                }}
              >
                {joinLabel}
              </Button>
            </ScrollView>
          )}
        </Modal>

        <Modal
          visible={activeMarket !== null && isPickingNumber && canJoin}
          onDismiss={closeBetForm}
          contentContainerStyle={styles.modal}
        >
          {activeMarket && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  Place your bet
                </Text>
                <IconButton
                  icon={closeIcon}
                  accessibilityLabel="Close bet form"
                  onPress={closeBetForm}
                />
              </View>
              <View style={styles.numberBlock}>
                <Text variant="bodyMedium" style={styles.detailHint}>
                  {activeMarket.name} · Wallet balance{' '}
                  {walletBalance === null ? '—' : `₹${walletBalance}`}
                </Text>
                <TextInput
                  mode="outlined"
                  label="Your number"
                  value={pickValue}
                  onChangeText={value =>
                    setPickValue(value.replace(/\D/g, '').slice(0, 2))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  disabled={isJoining}
                  style={styles.numberInput}
                />
                <Text variant="bodySmall" style={styles.numberHint}>
                  Enter a number from 1 to 99.
                </Text>
                <TextInput
                  mode="outlined"
                  label="Bet amount (₹)"
                  value={amountValue}
                  onChangeText={value => setAmountValue(sanitizeAmount(value))}
                  keyboardType="decimal-pad"
                  disabled={isJoining}
                  style={styles.numberInput}
                />
                <Text variant="bodySmall" style={styles.numberHint}>
                  Min ₹{activeMarket.minBetAmount} · Max ₹
                  {activeMarket.maxBetAmount}. This amount will be deducted
                  from your wallet.
                </Text>
                {joinError ? (
                  <Text variant="bodySmall" style={styles.joinError}>
                    {joinError}
                  </Text>
                ) : null}
                <View style={styles.betActions}>
                  <Button
                    mode="outlined"
                    style={styles.betAction}
                    disabled={isJoining}
                    onPress={closeBetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.betAction}
                    loading={isJoining}
                    disabled={
                      isJoining || pickValue.length < 1 || amountValue.length < 1
                    }
                    onPress={placeBet}
                  >
                    Confirm bet
                  </Button>
                </View>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </ScreenLayout>
  );
};
