import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import env from './env';

export function initializeSentry(_app: any) {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        Sentry.httpIntegration(),
        // Enable Express.js middleware tracing
        Sentry.expressIntegration(),
        // Enable profiling
        nodeProfilingIntegration(),
        // Additional integrations
        Sentry.requestDataIntegration({
          include: {
            data: true,
            headers: true,
            query_string: true,
            url: true,
          },
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Release tracking
      release: 'unknown',
      
      // Environment-specific settings
      debug: env.NODE_ENV === 'development',
      
      // Filter out specific errors
      beforeSend(event, hint) {
        // Filter out specific errors that we don't want to track
        const error = hint.originalException;
        
        // Don't send validation errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500) {
            return null;
          }
        }
        
        // Filter out specific error messages
        if (event.exception?.values?.[0]?.value) {
          const errorMessage = event.exception.values[0].value;
          const ignoredMessages = [
            'jwt expired',
            'jwt malformed',
            'invalid signature',
            'No authorization token provided',
          ];
          
          if (ignoredMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
            return null;
          }
        }
        
        // Add user context
        if (event.user) {
          event.user = {
            ...event.user,
            // Remove sensitive data
            email: undefined,
            phoneNumber: undefined,
          };
        }
        
        return event;
      },
      
      // Breadcrumb configuration
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console') {
          return null;
        }
        
        // Sanitize data in breadcrumbs
        if (breadcrumb.data) {
          const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
          Object.keys(breadcrumb.data).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              breadcrumb.data![key] = '[REDACTED]';
            }
          });
        }
        
        return breadcrumb;
      },
    });

    console.log('✅ Sentry initialized successfully');
  } else {
    console.log('⚠️  Sentry DSN not provided, error monitoring disabled');
  }
}

// Custom error capture with additional context
export function captureError(error: Error, context?: Record<string, any>) {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        service: 'api',
        version: 'unknown',
      },
    });
  } else {
    console.error('Error:', error, context);
  }
}

// Performance monitoring helpers
export function startTransaction(name: string, op: string = 'http') {
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
}

// User identification for error tracking
export function identifyUser(userId: string, userData?: Partial<Sentry.User>) {
  Sentry.setUser({
    id: userId,
    ...userData,
  });
}

// Clear user context on logout
export function clearUser() {
  Sentry.setUser(null);
}

// Add custom breadcrumb
export function addBreadcrumb(message: string, data?: Record<string, any>, level: Sentry.SeverityLevel = 'info') {
  Sentry.addBreadcrumb({
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}