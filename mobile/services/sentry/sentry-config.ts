import * as Sentry from '@sentry/react-native';
// @env 모듈은 Expo에서 환경변수를 위해 설정이 필요합니다
const EXPO_PUBLIC_SENTRY_DSN = '';

export function initializeSentry() {
  if (EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: EXPO_PUBLIC_SENTRY_DSN,
      debug: __DEV__, // Enable debug mode in development
      environment: __DEV__ ? 'development' : 'production',
      
      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
      
      // Session tracking
      autoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      
      // Breadcrumbs
      maxBreadcrumbs: 100,
      
      // Integrations
      integrations: [
        // React Native 트레이싱은 별도 설정이 필요합니다
      ],
      
      // Before send hook to filter out sensitive data
      beforeSend(event, hint) {
        // Filter out development errors
        if (__DEV__) {
          console.log('Sentry Event (Dev):', event);
          return null; // Don't send in development
        }
        
        // Remove sensitive data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        // Filter out specific errors
        const error = hint.originalException;
        if (error && error instanceof Error) {
          // Don't track network errors in development
          if (error.message.includes('Network request failed')) {
            return null;
          }
          
          // Don't track cancelled promises
          if (error.message.includes('cancelled')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        
        // Sanitize fetch breadcrumbs
        if (breadcrumb.category === 'fetch') {
          if (breadcrumb.data?.url) {
            // Remove sensitive query parameters
            const url = new URL(breadcrumb.data.url);
            const sensitiveParams = ['token', 'key', 'secret', 'password'];
            sensitiveParams.forEach(param => url.searchParams.delete(param));
            breadcrumb.data.url = url.toString();
          }
        }
        
        return breadcrumb;
      },
    });

    console.log('✅ Sentry initialized for React Native');
  } else {
    console.log('⚠️  Sentry DSN not provided, error monitoring disabled');
  }
}

// Utility functions for Sentry

export function captureError(error: Error, context?: Record<string, any>) {
  if (!__DEV__) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!__DEV__) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
}

export function setUserContext(user: { id: string; nickname?: string }) {
  Sentry.setUser({
    id: user.id,
    username: user.nickname,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string = 'navigation') {
  // startTransaction은 더 이상 사용되지 않습니다
  // 대신 Sentry.startSpan을 사용하세요
  return null;
}

// Screen tracking for analytics
export function trackScreen(screenName: string) {
  addBreadcrumb(`Navigated to ${screenName}`, 'navigation', { screen: screenName });
}

// User actions tracking
export function trackUserAction(action: string, data?: Record<string, any>) {
  addBreadcrumb(action, 'user', data);
}