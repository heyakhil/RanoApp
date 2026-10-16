import React from 'react';
import { Image, View } from 'react-native';
import { Card, Chip, ProgressBar, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Market } from '../../../services/markets';
import { colors } from '../../../theme';
import { styles } from './styles';

interface MarketCardProps {
  market: Market;
  onPress: () => void;
}

const status = {
  open: {
    label: 'Open now',
    color: colors.secondary,
    background: colors.greenSoft,
  },
  upcoming: {
    label: 'Upcoming',
    color: colors.amber,
    background: colors.amberSoft,
  },
  closed: {
    label: 'Closed',
    color: colors.textSecondary,
    background: colors.muted,
  },
};

export const MarketCard: React.FC<MarketCardProps> = ({ market, onPress }) => {
  const progress =
    market.capacity > 0
      ? Math.min(1, Math.max(0, market.participants / market.capacity))
      : 0;
  const remaining = Math.max(0, market.capacity - market.participants);
  const state = status[market.status];

  return (
    <Card
      mode="outlined"
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`View ${market.symbol} market, ${market.participants} of ${market.capacity} participants, ₹${market.entryAmount} entry`}
    >
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <View
            style={[styles.logo, { backgroundColor: market.accentBackground }]}
          >
            {market.imageUrl ? (
              <Image
                source={{ uri: market.imageUrl }}
                style={styles.logoImage}
                accessibilityLabel={`${market.name} image`}
              />
            ) : (
              <Text style={[styles.logoText, { color: market.accent }]}>
                {market.mark}
              </Text>
            )}
          </View>
          <View style={styles.identity}>
            <Text variant="titleMedium" style={styles.symbol}>
              {market.name}
            </Text>
            <Text variant="bodySmall" style={styles.company} numberOfLines={1}>
              {market.symbol}
            </Text>
          </View>
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: state.background }]}
            textStyle={[styles.statusText, { color: state.color }]}
          >
            {state.label}
          </Chip>
        </View>
        <View style={styles.scheduleRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text variant="bodySmall" style={styles.schedule}>
            {market.schedule}
          </Text>
        </View>

        <View style={styles.divider} />
        <View style={styles.progressRow}>
          <Text variant="labelMedium" style={styles.progressLabel}>
            Participants
          </Text>
          <Text variant="labelLarge" style={styles.progressCount}>
            {market.participants} / {market.capacity}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={
            market.status === 'closed' ? colors.textSecondary : colors.primary
          }
          style={styles.progress}
          accessibilityLabel={`${Math.round(
            progress * 100,
          )} percent of places filled`}
        />
        <View style={styles.bottomRow}>
          <Text variant="bodySmall" style={styles.spots}>
            {remaining === 0 ? 'No places left' : `${remaining} places left`}
          </Text>
          <View style={styles.entryRow}>
            {market.joined ? (
              <Text variant="labelLarge" style={styles.joined}>
                Joined
              </Text>
            ) : (
              <Text variant="bodySmall" style={styles.entryLabel}>
                Entry
              </Text>
            )}
            {!market.joined && (<><Text variant="titleMedium" style={styles.entryValue}>
              ₹{market.entryAmount}
            </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={colors.primary}
              /></>)}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};
