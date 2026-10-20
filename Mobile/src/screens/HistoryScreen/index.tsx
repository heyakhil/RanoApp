import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NavHeader } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { fetchResultHistory, ResultRound } from '../../services/markets';
import { colors } from '../../theme';
import { styles } from './styles';

type FilterId =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months';

interface ResultItem {
  id: string;
  market: string;
  result: string;
}

interface ResultDay {
  date: string;
  label: string;
  results: ResultItem[];
}

interface HistoryScreenProps {
  isActive?: boolean;
  onBack?: () => void;
}

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'last3Months', label: 'Last 3 Months' },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function rangeFor(filter: FilterId, now: Date): { from: Date; to: Date } {
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (filter === 'today') {
    return { from: today, to: tomorrow };
  }

  if (filter === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: today };
  }

  if (filter === 'last7') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from, to: tomorrow };
  }

  if (filter === 'thisMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  if (filter === 'lastMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }

  const from = new Date(today);
  from.setMonth(from.getMonth() - 3);
  return { from, to: tomorrow };
}

function groupByDay(rounds: ResultRound[]): ResultDay[] {
  const groups = new Map<string, ResultDay>();

  rounds.forEach(round => {
    // Group by session date: overnight markets settle after midnight.
    const key = round.sessionOn;
    const day = groups.get(key) ?? {
      date: key,
      label: new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${key}T00:00:00.000Z`)),
      results: [],
    };

    day.results.push({
      id: round.id,
      market: round.marketName,
      result: round.result,
    });
    groups.set(key, day);
  });

  return [...groups.values()];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  isActive = true,
  onBack,
}) => {
  const [filter, setFilter] = useState<FilterId>('last7');
  const [rounds, setRounds] = useState<ResultRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [loadMoreError, setLoadMoreError] = useState('');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const allowNextPage = useRef(false);
  const requestVersionRef = useRef(0);

  const loadHistory = useCallback(
    async (page = 1, append = false) => {
      if (append) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
        setLoadMoreError('');
      } else {
        requestVersionRef.current += 1;
        loadingMoreRef.current = false;
        pageRef.current = 1;
        hasMoreRef.current = false;
        setIsLoadingMore(false);
        setIsLoading(true);
        setError('');
        setLoadMoreError('');
      }

      const requestVersion = requestVersionRef.current;
      try {
        const range = rangeFor(filter, new Date());
        const response = await fetchResultHistory(range.from, range.to, page);
        if (requestVersion !== requestVersionRef.current) return;
        setRounds(current =>
          append ? [...current, ...response.items] : response.items,
        );
        pageRef.current = page;
        hasMoreRef.current = response.pagination.hasMore;
      } catch (loadError) {
        if (requestVersion === requestVersionRef.current) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load result history.';
          if (append) {
            setLoadMoreError(message);
          } else {
            setError(message);
          }
        }
      } finally {
        if (requestVersion === requestVersionRef.current) {
          if (append) {
            loadingMoreRef.current = false;
            setIsLoadingMore(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    setRounds([]);
    loadHistory(1);
  }, [isActive, loadHistory]);

  const days = useMemo(() => groupByDay(rounds), [rounds]);
  const loadNextPage = () => {
    if (
      !allowNextPage.current ||
      loadingMoreRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    allowNextPage.current = false;
    loadHistory(pageRef.current + 1, true);
  };

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Result History" onBack={onBack} />
      <View style={styles.filters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(option => {
            const selected = option.id === filter;
            return (
              <Pressable
                key={option.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setFilter(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    selected && styles.chipLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={isLoading || error ? [] : days}
        keyExtractor={day => day.date}
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
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : error ? (
            <View>
              <Text style={styles.empty}>{error}</Text>
              <Button mode="outlined" onPress={() => loadHistory(1)}>
                Try again
              </Button>
            </View>
          ) : (
            <Text style={styles.empty}>No results for this period</Text>
          )
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
        renderItem={({ item: day }) => (
          <View key={day.date}>
            <View style={styles.dateRow}>
              <Text style={styles.date}>{day.label}</Text>
            </View>
            <View style={styles.card}>
              {day.results.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    index < day.results.length - 1 && styles.rowBorder,
                  ]}
                >
                  <Text style={styles.market}>{item.market}</Text>
                  <Text style={styles.result}>{item.result}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </ScreenLayout>
  );
};
