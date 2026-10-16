import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaperProvider, Text } from 'react-native-paper';
import { apiClient } from '../src/api/client';
import { MarketCard } from '../src/components/molecules';
import { HomeScreen } from '../src/screens/HomeScreen';
import { getFeaturedMarket, toDisplayMarket } from '../src/services/markets';

const mockApiMarkets = [
  {
    id: 'market-1',
    name: 'Northstar',
    symbol: 'NSTR',
    imageUrl: '',
    openTime: '00:00',
    closeTime: '23:59',
    maxParticipants: 500,
    participants: 326,
    entryAmount: 25,
    totalBetAmount: 8150,
    currentRound: 1,
    lastResult: null,
  },
  {
    id: 'market-2',
    name: 'Summit',
    symbol: 'SUM',
    imageUrl: '',
    openTime: '00:00',
    closeTime: '23:59',
    maxParticipants: 250,
    participants: 0,
    entryAmount: 50,
    totalBetAmount: 0,
    currentRound: 1,
    lastResult: null,
  },
];

const renderHomeScreen = () =>
  ReactTestRenderer.create(
    <PaperProvider
      settings={{
        icon: ({ name }) => <Text>{name}</Text>,
      }}
    >
      <HomeScreen />
    </PaperProvider>,
  );

jest.mock('../src/api/client', () => ({
  apiClient: { getPublic: jest.fn(), get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (apiClient.getPublic as jest.Mock).mockResolvedValue({
    success: true,
    data: mockApiMarkets,
  });
  (apiClient.get as jest.Mock).mockImplementation((path: string) => {
    if (path === '/markets/participation') {
      return Promise.resolve({ success: true, data: { marketIds: [] } });
    }

    return Promise.resolve({ success: true, data: { balance: '100.00' } });
  });
});

test('loads markets from the API and shows market details', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderHomeScreen();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(
    renderer.root.findByProps({
      accessibilityLabel:
        'View NSTR market, 326 of 500 participants, ₹25 entry',
    }),
  ).toBeTruthy();
  expect(JSON.stringify(renderer.toJSON())).toContain('174 places left');
  expect(apiClient.getPublic).toHaveBeenCalledWith('/markets');
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('features the next market and lists each API market only once', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderHomeScreen();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  const cards = renderer.root.findAllByType(MarketCard);
  expect(cards).toHaveLength(mockApiMarkets.length);
  expect(new Set(cards.map(card => card.props.market.id)).size).toBe(
    mockApiMarkets.length,
  );
  expect(cards.map(card => card.props.market.id)).toEqual(
    expect.arrayContaining(mockApiMarkets.map(market => market.id)),
  );
  const text = renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat()
    .join(' ');
  expect(text).not.toContain('?');

  await ReactTestRenderer.act(() => cards[0].props.onPress());
  expect(JSON.stringify(renderer.toJSON())).toContain('Market details');
  expect(JSON.stringify(renderer.toJSON())).toContain('Join for ₹25');
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('selects the next opening market and rolls over to tomorrow after closing', () => {
  const now = new Date(2026, 0, 1, 10, 0);
  const laterOpening = {
    ...mockApiMarkets[0],
    openTime: '14:00',
    closeTime: '16:00',
  };
  const earlierOpening = {
    ...mockApiMarkets[1],
    openTime: '11:00',
    closeTime: '13:00',
  };
  const displayMarkets = [
    toDisplayMarket(laterOpening, 0, now, false),
    toDisplayMarket(earlierOpening, 1, now, false),
  ];

  expect(getFeaturedMarket(displayMarkets, now)?.id).toBe(earlierOpening.id);
  expect(
    getFeaturedMarket(displayMarkets, new Date(2026, 0, 1, 17, 0)),
  ).toMatchObject({
    id: earlierOpening.id,
    status: 'upcoming',
    schedule: 'Tomorrow · 11:00 AM',
  });
});

test('closes a market after a result until its next scheduled opening', () => {
  const market = {
    ...mockApiMarkets[0],
    openTime: '09:00',
    closeTime: '17:00',
    lastResult: '42',
    lastResultAt: new Date(2026, 0, 1, 17, 15).toISOString(),
  };

  expect(
    toDisplayMarket(market, 0, new Date(2026, 0, 1, 18, 0), false).status,
  ).toBe('closed');
  expect(
    toDisplayMarket(market, 0, new Date(2026, 0, 2, 8, 59), false).status,
  ).toBe('closed');
  expect(
    toDisplayMarket(market, 0, new Date(2026, 0, 2, 9, 0), false).status,
  ).toBe('open');
});
