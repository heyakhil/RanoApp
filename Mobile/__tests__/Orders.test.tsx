import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaperProvider, Text } from 'react-native-paper';
import { apiClient } from '../src/api/client';
import { OrdersScreen } from '../src/screens/OrdersScreen';

jest.mock('../src/api/client', () => ({
  apiClient: { get: jest.fn() },
}));
jest.mock('react-native-vector-icons/Entypo', () => 'Entypo');

const renderOrdersScreen = () =>
  ReactTestRenderer.create(
    <PaperProvider settings={{ icon: ({ name }) => <Text>{name}</Text> }}>
      <OrdersScreen />
    </PaperProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-19T12:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

function renderedText(renderer: ReactTestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat()
    .join(' ');
}

test('shows the result deadline from the round date instead of the next daily close', async () => {
  (apiClient.get as jest.Mock).mockResolvedValue({
    success: true,
    data: {
      items: [
        {
          id: 'order-1',
          marketName: 'Northstar',
          symbol: 'NSTR',
          imageUrl: '',
          entryAmount: 25,
          pickedNumber: 12,
          payoutAmount: null,
          roundNumber: 1,
          participants: 1,
          maxParticipants: 100,
          seatsLeft: 99,
          openTime: '09:00',
          closeTime: '17:00',
          result: null,
          roundStatus: 'pending',
          isCurrentRound: true,
          createdAt: '2000-01-01T10:00:00.000Z',
          scheduledResultAt: '2000-01-01T11:15:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, hasMore: false },
    },
  });

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderOrdersScreen();
    await Promise.resolve();
  });

  const rendered = renderedText(renderer);
  expect(rendered).toContain('1 Jan');
  expect(rendered).toContain('Waiting For Result');

  await ReactTestRenderer.act(() => renderer.unmount());
});

test('shows canceled rounds as refunded', async () => {
  (apiClient.get as jest.Mock).mockResolvedValue({
    success: true,
    data: {
      items: [
        {
          id: 'order-2',
          marketName: 'Northstar',
          symbol: 'NSTR',
          imageUrl: '',
          entryAmount: 25,
          pickedNumber: 12,
          payoutAmount: null,
          roundNumber: 1,
          participants: 1,
          maxParticipants: 100,
          seatsLeft: 99,
          openTime: '09:00',
          closeTime: '17:00',
          result: null,
          roundStatus: 'canceled',
          isCurrentRound: false,
          createdAt: '2000-01-01T10:00:00.000Z',
          scheduledResultAt: '2000-01-01T11:15:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, hasMore: false },
    },
  });

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderOrdersScreen();
    await Promise.resolve();
  });

  const rendered = renderedText(renderer);
  expect(rendered).toContain('Canceled');
  expect(rendered).toContain('₹25 refunded');

  await ReactTestRenderer.act(() => renderer.unmount());
});
