import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button, PaperProvider, Text, TextInput } from 'react-native-paper';
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
    minBetAmount: 25,
    maxBetAmount: 500,
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
    minBetAmount: 50,
    maxBetAmount: 1000,
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
        'View NSTR market, 326 of 500 bets, bet ₹25 to ₹500',
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
  expect(cards.filter(card => card.props.isFeatured)).toHaveLength(1);
  expect(cards.find(card => card.props.isFeatured)?.props.market.status).toBe(
    'open',
  );
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
  expect(JSON.stringify(renderer.toJSON())).toContain('Place bet');
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('allows one bet per market and lets the user bet in another market', async () => {
  (apiClient.post as jest.Mock).mockImplementation((path: string) => {
    const marketId = path.split('/')[2];
    const entryAmount = marketId === 'market-1' ? 30 : 50;
    return Promise.resolve({
      success: true,
      data: {
        marketId,
        roundNumber: 1,
        entryAmount,
        pickedNumber: 12,
        participants: 327,
        maxParticipants: 500,
        walletBalance: '75.00',
      },
    });
  });

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderHomeScreen();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  const placeBet = async (marketId: string, amount: number) => {
    const marketCard = renderer.root
      .findAllByType(MarketCard)
      .find(card => card.props.market.id === marketId);
    await ReactTestRenderer.act(() => marketCard?.props.onPress());

    const openBetButton = renderer.root
      .findAllByType(Button)
      .find(button => button.props.children === 'Place bet');
    await ReactTestRenderer.act(() => openBetButton?.props.onPress());

    const numberInput = renderer.root
      .findAllByType(TextInput)
      .find(input => input.props.label === 'Your number');
    await ReactTestRenderer.act(() => numberInput?.props.onChangeText('12'));

    const amountInput = renderer.root
      .findAllByType(TextInput)
      .find(input => input.props.label === 'Bet amount (₹)');
    await ReactTestRenderer.act(() =>
      amountInput?.props.onChangeText(String(amount)),
    );

    const submitButton = renderer.root
      .findAllByType(Button)
      .find(button => button.props.children === 'Confirm bet');
    await ReactTestRenderer.act(async () => {
      submitButton?.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  };

  await placeBet('market-1', 30);
  expect(apiClient.post).toHaveBeenCalledTimes(1);

  const alreadyBetCard = renderer.root
    .findAllByType(MarketCard)
    .find(card => card.props.market.id === 'market-1');
  expect(alreadyBetCard?.props.market.joined).toBe(true);

  const firstMarketCard = renderer.root
    .findAllByType(MarketCard)
    .find(card => card.props.market.id === 'market-1');
  await ReactTestRenderer.act(() => firstMarketCard?.props.onPress());
  expect(
    renderer.root
      .findAllByType(Button)
      .some(button => button.props.children === 'Already bet this round'),
  ).toBe(true);
  await ReactTestRenderer.act(() =>
    renderer.root.findByProps({ accessibilityLabel: 'Close market details' }).props.onPress(),
  );

  await placeBet('market-2', 50);
  expect(apiClient.post).toHaveBeenCalledTimes(2);
  expect(apiClient.post).toHaveBeenNthCalledWith(
    1,
    '/markets/market-1/join',
    { number: 12, amount: 30 },
  );
  expect(apiClient.post).toHaveBeenNthCalledWith(
    2,
    '/markets/market-2/join',
    { number: 12, amount: 50 },
  );
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('features the open market with the closest closing time', () => {
  const now = new Date(2026, 0, 1, 10, 0);
  const closesLater = {
    ...mockApiMarkets[0],
    openTime: '08:00',
    closeTime: '16:00',
  };
  const closesSooner = {
    ...mockApiMarkets[1],
    openTime: '09:00',
    closeTime: '11:00',
  };
  const displayMarkets = [
    toDisplayMarket(closesLater, 0, now, false),
    toDisplayMarket(closesSooner, 1, now, false),
  ];

  expect(getFeaturedMarket(displayMarkets, now)?.id).toBe(closesSooner.id);
  const afterClose = new Date(2026, 0, 1, 17, 0);
  expect(
    getFeaturedMarket(
      [closesLater, closesSooner].map((market, index) =>
        toDisplayMarket(market, index, afterClose, false),
      ),
      afterClose,
    ),
  ).toBeUndefined();
});

test('features the open market closing soon across midnight', () => {
  const now = new Date(2026, 0, 1, 23, 30);
  const closesTomorrow = {
    ...mockApiMarkets[0],
    openTime: '22:00',
    closeTime: '02:00',
  };
  const closesToday = {
    ...mockApiMarkets[1],
    openTime: '20:00',
    closeTime: '23:45',
  };
  const displayMarkets = [
    toDisplayMarket(closesTomorrow, 0, now, false),
    toDisplayMarket(closesToday, 1, now, false),
  ];

  expect(getFeaturedMarket(displayMarkets, now)?.id).toBe(closesToday.id);
});

test('market status follows its scheduled opening and closing times', () => {
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
  ).toBe('upcoming');
  expect(
    toDisplayMarket(market, 0, new Date(2026, 0, 2, 9, 0), false).status,
  ).toBe('open');
  expect(
    toDisplayMarket(market, 0, new Date(2026, 0, 2, 10, 0), false).status,
  ).toBe('open');
});
