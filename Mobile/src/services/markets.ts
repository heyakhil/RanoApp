import { apiClient } from '../api/client';
import type { PaginatedData } from '../types';

export type MarketStatus = 'open' | 'upcoming' | 'closed';

export interface ApiMarket {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  maxParticipants: number;
  participants: number;
  minBetAmount: number;
  maxBetAmount: number;
  totalBetAmount: number;
  currentRound: number;
  lastResult: string | null;
}

export interface Market extends ApiMarket {
  status: MarketStatus;
  capacity: number;
  schedule: string;
  mark: string;
  accent: string;
  accentBackground: string;
  joined: boolean;
}

export type DigitSide = 'andar' | 'bahar';

export interface MarketJoinResult {
  marketId: string;
  roundNumber: number;
  entryAmount: number;
  pickedNumber: number;
  digitSide: DigitSide | null;
  participants: number;
  maxParticipants: number;
  walletBalance: string;
}

const marketAccents = [
  { accent: '#2457CF', background: '#E9F0FF' },
  { accent: '#3D8B46', background: '#E7F6E9' },
  { accent: '#DB7F28', background: '#FFF2E6' },
  { accent: '#586783', background: '#ECF0F5' },
  { accent: '#8B5CF6', background: '#F1EAFE' },
];

function currentTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export async function fetchMarkets(): Promise<ApiMarket[]> {
  const response = await apiClient.getPublic<ApiMarket[]>('/markets');

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load markets.');
  }

  return response.data;
}

export async function fetchJoinedMarketIds(): Promise<string[]> {
  const response = await apiClient.get<{ marketIds: string[] }>(
    '/markets/participation',
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load your markets.');
  }

  return response.data.marketIds;
}

export interface UserOrder {
  id: string;
  marketName: string;
  symbol: string;
  imageUrl: string;
  entryAmount: number;
  pickedNumber: number | null;
  digitSide?: DigitSide | null;
  payoutAmount: number | null;
  roundNumber: number;
  participants: number;
  maxParticipants: number;
  seatsLeft: number;
  openTime: string;
  closeTime: string;
  result: string | null;
  roundStatus: 'pending' | 'settled' | 'canceled';
  isCurrentRound: boolean;
  createdAt: string;
  scheduledResultAt: string;
}

export interface ResultRound {
  id: string;
  marketName: string;
  symbol: string;
  result: string;
  roundNumber: number;
  settledAt: string;
  /** India date (YYYY-MM-DD) the market session opened. */
  sessionOn: string;
}

const PAGE_SIZE = 20;

export async function fetchResultHistory(
  from: Date,
  to: Date,
  page: number,
): Promise<PaginatedData<ResultRound>> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const response = await apiClient.get<PaginatedData<ResultRound>>(
    `/markets/history?${params.toString()}`,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load result history.');
  }

  return response.data;
}

export async function fetchMyOrders(
  page: number,
): Promise<PaginatedData<UserOrder>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const response = await apiClient.get<PaginatedData<UserOrder>>(
    `/markets/orders?${params.toString()}`,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load your orders.');
  }

  return response.data;
}

export async function joinMarket(
  marketId: string,
  number: number,
  amount: number,
  side?: DigitSide,
): Promise<MarketJoinResult> {
  const response = await apiClient.post<MarketJoinResult>(
    `/markets/${encodeURIComponent(marketId)}/join`,
    side ? { number, amount, side } : { number, amount },
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to join this market.');
  }

  return response.data;
}

function getMarketStatus(
  openTime: string,
  closeTime: string,
  now: Date,
): MarketStatus {
  const currentTime = currentTimeString(now);
  const crossesMidnight = closeTime < openTime;
  const isOpen = crossesMidnight
    ? currentTime >= openTime || currentTime < closeTime
    : currentTime >= openTime && currentTime < closeTime;

  return isOpen ? 'open' : currentTime < openTime ? 'upcoming' : 'closed';
}

export function toDisplayMarket(
  market: ApiMarket,
  index: number,
  now: Date,
  joined: boolean,
): Market {
  const status = getMarketStatus(
    market.openTime,
    market.closeTime,
    now,
  );

  console.log("Market Status ===>", status);
  const accent = marketAccents[index % marketAccents.length];
  return {
    ...market,
    status,
    joined,
    capacity: market.maxParticipants,
    schedule: `${formatTime(market.openTime)} – ${formatTime(
      market.closeTime,
    )}`,
    mark: market.name.charAt(0),
    accent: accent.accent,
    accentBackground: accent.background,
  };
}

export function getFeaturedMarket(
  markets: Market[],
  now: Date,
): Market | undefined {
  return markets
    .filter(market => market.status === 'open')
    .reduce<Market | undefined>((featured, market) => {
      const [hours, minutes] = market.closeTime.split(':').map(Number);
      const closesAt = new Date(now);
      closesAt.setHours(hours, minutes, 0, 0);
      if (closesAt <= now) {
        closesAt.setDate(closesAt.getDate() + 1);
      }

      if (!featured) return market;

      const [featuredHours, featuredMinutes] = featured.closeTime
        .split(':')
        .map(Number);
      const featuredClosesAt = new Date(now);
      featuredClosesAt.setHours(featuredHours, featuredMinutes, 0, 0);
      if (featuredClosesAt <= now) {
        featuredClosesAt.setDate(featuredClosesAt.getDate() + 1);
      }

      return closesAt < featuredClosesAt ? market : featured;
    }, undefined);
}
