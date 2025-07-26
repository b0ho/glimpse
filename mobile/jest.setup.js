// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 'high',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    getToken: jest.fn(() => Promise.resolve('test-token')),
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    user: {
      id: 'test-user-id',
      phoneNumbers: [{ phoneNumber: '+821012345678' }],
    },
  })),
  useSignIn: jest.fn(() => ({
    create: jest.fn(),
    prepareFirstFactor: jest.fn(),
    attemptFirstFactor: jest.fn(),
  })),
  ClerkProvider: ({ children }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// React Native mocks are handled by jest-expo preset

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock socket.io
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  })),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }) => children,
  initPaymentSheet: jest.fn(),
  presentPaymentSheet: jest.fn(),
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
}));

// @env is mocked via moduleNameMapper in jest.config.js

// Global mocks
global.alert = jest.fn();
global.fetch = jest.fn();