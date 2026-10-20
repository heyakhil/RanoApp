import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NavHeader } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import Entypo from 'react-native-vector-icons/Entypo';
import { fetchMyOrders, UserOrder } from '../../services/markets';
import { colors } from '../../theme';
import { styles } from './styles';

interface OrdersScreenProps {
  isActive?: boolean;
  onBack?: () => void;
}

const accents = [
  { color: '#2457CF', background: '#E9F0FF' },
  { color: '#3D8B46', background: '#E7F6E9' },
  { color: '#DB7F28', background: '#FFF2E6' },
  { color: '#586783', background: '#ECF0F5' },
  { color: '#8B5CF6', background: '#F1EAFE' },
];

function accentFor(symbol: string): { color: string; background: string } {
  const index = symbol
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return accents[index % accents.length];
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}

function resultMoment(order: UserOrder): Date {
  return new Date(order.scheduledResultAt);
}

function formatResultTime(order: UserOrder): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(resultMoment(order));
}

function OrderStatusBar({ order }: { order: UserOrder }) {
  const [now, setNow] = useState(() => new Date());
  const pending = order.roundStatus === 'pending';

  useEffect(() => {
    if (!pending) {
      return undefined;
    }

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const timer = timeLeft(order, now);

  return (
    <View
      style={[
        styles.timer,
        timer.tone === 'won' && styles.timerWon,
        timer.tone === 'lost' && styles.timerLost,
        timer.tone === 'waiting' && styles.timerSettled,
      ]}
    >
      <Text
        style={[
          styles.timerLabel,
          timer.tone === 'waiting' && styles.timerSettledText,
        ]}
      >
        {timer.label}
      </Text>
      <Text
        style={[
          styles.timerValue,
          timer.tone === 'waiting' && styles.timerSettledText,
        ]}
      >
        {timer.value}
      </Text>
    </View>
  );
}

function timeLeft(
  order: UserOrder,
  now: Date,
): { label: string; value: string; tone: 'won' | 'lost' | 'waiting' | 'countdown' } {
  if (order.roundStatus === 'canceled') {
    return {
      label: 'Round canceled',
      value: `₹${order.entryAmount} refunded`,
      tone: 'waiting',
    };
  }

  if (order.result) {
    if (order.payoutAmount != null && order.payoutAmount > 0) {
      return {
        label: 'You Won',
        value: `₹${order.payoutAmount}`,
        tone: 'won',
      };
    }

    return { label: 'You Lost', value: 'Loss', tone: 'lost' };
  }

  if (!order.isCurrentRound) {
    return { label: 'Round status', value: 'Settled', tone: 'waiting' };
  }

  const remainingMs =
    resultMoment(order).getTime() - now.getTime();
  if (remainingMs <= 0) {
    const waitingForResult =
      now.getTime() - resultMoment(order).getTime() < 15 * 60 * 1000;

    return {
      label: 'Round status',
      value: waitingForResult ? 'Waiting For Result' : 'Cancellation pending',
      tone: 'waiting',
    };
  }

  return {
    label: 'Time left',
    value: formatClock(Math.ceil(remainingMs / 1000)),
    tone: 'countdown',
  };
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  isActive = true,
  onBack,
}) => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [loadMoreError, setLoadMoreError] = useState('');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const allowNextPage = useRef(false);

  const loadOrders = useCallback(async (page = 1, append = false) => {
    if (append) {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreError('');
    } else {
      setIsLoading(true);
      setError('');
    }

    try {
      const response = await fetchMyOrders(page);
      setOrders(current =>
        append
          ? [
              ...current,
              ...response.items.filter(
                item => !current.some(existing => existing.id === item.id),
              ),
            ]
          : response.items,
      );
      pageRef.current = page;
      hasMoreRef.current = response.pagination.hasMore;
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your orders.';
      if (append) {
        setLoadMoreError(message);
      } else {
        setError(message);
      }
    } finally {
      if (append) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    pageRef.current = 1;
    hasMoreRef.current = false;
    loadOrders(1);
  }, [isActive, loadOrders]);

  const loadNextPage = () => {
    if (
      !allowNextPage.current ||
      loadingMoreRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    allowNextPage.current = false;
    loadOrders(pageRef.current + 1, true);
  };

  const enableNextPage = () => {
    allowNextPage.current = true;
  };
  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Orders" onBack={onBack} />
      <FlatList
        data={isLoading || error ? [] : orders}
        keyExtractor={order => order.id}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.4}
        onScrollBeginDrag={enableNextPage}
        onMomentumScrollBegin={enableNextPage}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.statusBlock}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.statusBlock}>
              <Text style={styles.statusTitle}>Orders are unavailable</Text>
              <Text style={styles.statusText}>{error}</Text>
              <Button mode="outlined" onPress={() => loadOrders(1)}>
                Try again
              </Button>
            </View>
          ) : (
            <View style={styles.statusBlock}>
              <Text style={styles.statusTitle}>No bets yet</Text>
              <Text style={styles.statusText}>
                Markets you join will appear here with the entry, seats, and
                result.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore || loadMoreError ? (
            <View style={styles.statusBlock}>
              {isLoadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.statusText}>{loadMoreError}</Text>
                  <Button mode="outlined" onPress={loadNextPage}>
                    Try loading more
                  </Button>
                </>
              )}
            </View>
          ) : undefined
        }
        renderItem={({ item: order }) => {
          const accent = accentFor(order.symbol);
          const resultTime = formatResultTime(order);

          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.header}>
                <View style={styles.identity}>
                  <View
                    style={[
                      styles.logo,
                      { backgroundColor: accent.background },
                    ]}
                  >
                    {order.imageUrl ? (
                      <Image
                        source={{ uri: order.imageUrl }}
                        style={styles.logoImage}
                        accessibilityLabel={`${order.marketName} image`}
                      />
                    ) : (
                      <Text style={[styles.logoText, { color: accent.color }]}>
                        {order.symbol.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.identityText}>
                    <Text style={styles.marketName} numberOfLines={1}>
                      {order.marketName}
                    </Text>
                    <Text style={styles.symbol}>{order.symbol}</Text>
                    <Text style={styles.entry}>
                      ₹{order.entryAmount} · Round {order.roundNumber}
                    </Text>
                  </View>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Result time</Text>
                  <Text style={styles.timeValue}>{resultTime}</Text>
                </View>
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Your number</Text>
                  <Text style={styles.numberValue}>
                    {order.pickedNumber ?? '—'}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Bets placed</Text>
                  <Text style={styles.statValue}>
                    {order.participants.toLocaleString('en-US')}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Seats left</Text>
                  <Text style={[styles.statValue, styles.seatsValue]}>
                    {order.seatsLeft}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Result</Text>
                  {order.roundStatus === 'canceled' ? (
                    <Text style={styles.canceledResult}>Canceled</Text>
                  ) : order.result ? (
                    <Text style={styles.resultValue} numberOfLines={1}>
                      {order.result}
                    </Text>
                  ) : (
                    <Entypo name="time-slot" size={18} color={colors.amber} />
                  )}
                </View>
              </View>

              <OrderStatusBar order={order} />
            </View>
          );
        }}
      />
    </ScreenLayout>
  );
};
