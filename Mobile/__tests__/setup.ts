jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// The native icon font is available in device builds, not in Jest's renderer.
jest.mock(
  'react-native-vector-icons/MaterialCommunityIcons',
  () => 'MaterialCommunityIcons',
);

jest.mock(
  'react-native-vector-icons/FontAwesome6',
  () => 'FontAwesome6',
);

jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: () => null,
  showMessage: jest.fn(),
}));
