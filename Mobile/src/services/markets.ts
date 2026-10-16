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
  entryAmount: number;
  totalBetAmount: number;
  currentRound: number;
  lastResult: string | null;
  lastResultAt?: string | null;
}

export interface Market extends ApiMarket {
  status: MarketStatus;
  resultDeclared: boolean;
  capacity: number;
  schedule: string;
  mark: string;
  accent: string;
  accentBackground: string;
  joined: boolean;
}

export interface MarketJoinResult {
  marketId: string;
  roundNumber: number;
  entryAmount: number;
  pickedNumber: number;
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

function hasResultClosedMarket(
  openTime: string,
  lastResultAt: string | null | undefined,
  now: Date,
): boolean {
  if (!lastResultAt) return false;

  const declaredAt = new Date(lastResultAt);
  if (
    Number.isNaN(declaredAt.getTime()) ||
    now.getTime() < declaredAt.getTime()
  ) {
    return false;
  }

  const [openHours, openMinutes] = openTime.split(':').map(Number);
  const nextOpen = new Date(declaredAt);
  nextOpen.setHours(openHours, openMinutes, 0, 0);
  if (nextOpen.getTime() <= declaredAt.getTime()) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  return now.getTime() < nextOpen.getTime();
}

export async function fetchMarkets(): Promise<ApiMarket[]> {
  const response = await apiClient.getPublic<ApiMarket[]>('/markets');

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load markets.');
  }

  return response.data;
}

export interface UserOrder {
  id: string;
  marketName: string;
  symbol: string;
  imageUrl: string;
  entryAmount: number;
  pickedNumber: number | null;
  payoutAmount: number | null;
  roundNumber: number;
  participants: number;
  maxParticipants: number;
  seatsLeft: number;
  openTime: string;
  closeTime: string;
  result: string | null;
  isCurrentRound: boolean;
  createdAt: string;
}

export interface ResultRound {
  id: string;
  marketName: string;
  symbol: string;
  result: string;
  roundNumber: number;
  settledAt: string;
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

export async function fetchJoinedMarketIds(): Promise<string[]> {
  const response = await apiClient.get<{ marketIds: string[] }>(
    '/markets/participation',
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to load your markets.');
  }

  return response.data.marketIds;
}

export async function joinMarket(
  marketId: string,
  number: number,
): Promise<MarketJoinResult> {
  const response = await apiClient.post<MarketJoinResult>(
    `/markets/${encodeURIComponent(marketId)}/join`,
    { number },
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to join this market.');
  }

  return response.data;
}

function getMarketStatus(
  openTime: string,
  closeTime: string,
  currentTime: string,
  lastResultAt: string | null | undefined,
  now: Date,
): MarketStatus {
  if (hasResultClosedMarket(openTime, lastResultAt, now)) {
    return 'closed';
  }

  const crossesMidnight = closeTime < openTime;

  if (crossesMidnight) {
    return currentTime >= openTime || currentTime < closeTime
      ? 'open'
      : 'upcoming';
  }

  if (currentTime < openTime) return 'upcoming';
  if (currentTime < closeTime) return 'open';
  return 'closed';
}

export function toDisplayMarket(
  market: ApiMarket,
  index: number,
  now: Date,
  joined: boolean,
): Market {
  const currentTime = currentTimeString(now);
  const status = getMarketStatus(
    market.openTime,
    market.closeTime,
    currentTime,
    market.lastResultAt,
    now,
  );
  const accent = marketAccents[index % marketAccents.length];

  return {
    ...market,
    status,
    resultDeclared: hasResultClosedMarket(
      market.openTime,
      market.lastResultAt,
      now,
    ),
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
  if (markets.length === 0) return undefined;

  const openMarket = markets.find(market => market.status === 'open');
  if (openMarket) return openMarket;

  const currentTime = currentTimeString(now);
  const upcomingToday = markets
    .filter(market => market.openTime > currentTime)
    .sort((first, second) => first.openTime.localeCompare(second.openTime));

  if (upcomingToday.length > 0) return upcomingToday[0];

  const firstTomorrow = [...markets].sort((first, second) =>
    first.openTime.localeCompare(second.openTime),
  )[0];

  return {
    ...firstTomorrow,
    status: firstTomorrow.resultDeclared ? 'closed' : 'upcoming',
    schedule: `Tomorrow · ${formatTime(firstTomorrow.openTime)}`,
  };
}
