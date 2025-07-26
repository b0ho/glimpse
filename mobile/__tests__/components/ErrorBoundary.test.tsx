import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Mock sentry-config
jest.mock('../../services/sentry/sentry-config', () => ({
  captureError: jest.fn(),
}));

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that renders normally
const NormalComponent = () => <Text>Normal Component</Text>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(getByText('Normal Component')).toBeTruthy();
  });

  it('should render error UI when there is an error', async () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(getByText('앗! 문제가 발생했어요')).toBeTruthy();
      expect(getByText(/예상치 못한 오류가 발생했습니다/)).toBeTruthy();
    });
  });

  it('should log error to captureError', async () => {
    const { captureError } = require('../../services/sentry/sentry-config');

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
  });
});