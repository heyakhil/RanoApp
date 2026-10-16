import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextStyle, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchTransactions, WalletTransaction } from '../../api/rechargeApi';
import { NavHeader } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { colors } from '../../theme';
import { styles } from './styles';

interface TransactionHistoryScreenProps {
  onBack: () => void;
}

const statusLabel: Record<WalletTransaction['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const statusStyle: Record<WalletTransaction['status'], TextStyle> = {
  pending: styles.statusPending,
  accepted: styles.statusAccepted,
  rejected: styles.statusRejected,
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatWhen(value: string): string {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return `${day} • ${time}`;
}

export const TransactionHistoryScreen: React.FC<
  TransactionHistoryScreenProps
> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [loadMoreError, setLoadMoreError] = useState('');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const allowNextPage = useRef(false);

  const loadTransactions = useCallback(async (page = 1, append = false) => {
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
      const response = await fetchTransactions(page);
      setTransactions(current =>
        append
          ? [
              ...current,
              ...response.items.filter(
                item =>
                  !current.some(
                    existing =>
                      existing.id === item.id && existing.type === item.type,
                  ),
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
          : 'Could not load transactions.';
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
    loadTransactions(1);
  }, [loadTransactions]);

  const loadNextPage = () => {
    if (
      !allowNextPage.current ||
      loadingMoreRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    allowNextPage.current = false;
    loadTransactions(pageRef.current + 1, true);
  };

  const renderTransaction = ({
    item: transaction,
  }: {
    item: WalletTransaction;
  }) => {
    const isCredit = transaction.type === 'credit';
    const color = isCredit ? colors.secondary : colors.error;

    return (
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons
            name={isCredit ? 'arrow-bottom-left' : 'arrow-top-right'}
            size={20}
            color={color}
          />
        </View>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}{' '}
              <Text style={statusStyle[transaction.status]}>
                {statusLabel[transaction.status]}
              </Text>
            </Text>
            <Text style={[styles.amount, { color }]}>
              {isCredit ? '+' : '-'}
              {formatAmount(transaction.amount)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {`xxx${transaction.id.slice(-6)}`}
            </Text>
            <Text style={styles.metaRight}>
              {formatWhen(transaction.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Transaction History" onBack={onBack} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View>
          <Text style={styles.empty}>{error}</Text>
          <Button mode="outlined" onPress={() => loadTransactions(1)}>
            Try again
          </Button>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={transaction => `${transaction.type}:${transaction.id}`}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          onScrollBeginDrag={() => {
            allowNextPage.current = true;
          }}
          onMomentumScrollBegin={() => {
            allowNextPage.current = true;
          }}
          renderItem={renderTransaction}
          ListEmptyComponent={
            <Text style={styles.empty}>No recharge or withdrawal yet</Text>
          }
          ListFooterComponent={
            isLoadingMore || loadMoreError ? (
              <View>
                {isLoadingMore ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={styles.loader}
                  />
                ) : (
                  <>
                    <Text style={styles.empty}>{loadMoreError}</Text>
                    <Button mode="outlined" onPress={loadNextPage}>
                      Try loading more
                    </Button>
                  </>
                )}
              </View>
            ) : undefined
          }
        />
      )}
    </ScreenLayout>
  );
};
