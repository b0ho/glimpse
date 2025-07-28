import { Request, Response, NextFunction } from 'express';
import * as prometheus from 'prom-client';

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const websocketConnectionsActive = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const paymentAttemptsTotal = new prometheus.Counter({
  name: 'payment_attempts_total',
  help: 'Total number of payment attempts',
  labelNames: ['provider', 'status']
});

const paymentFailuresTotal = new prometheus.Counter({
  name: 'payment_failures_total',
  help: 'Total number of payment failures',
  labelNames: ['provider', 'reason']
});

const matchingDuration = new prometheus.Histogram({
  name: 'matching_duration_seconds',
  help: 'Duration of matching operations in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const authLoginFailuresTotal = new prometheus.Counter({
  name: 'auth_login_failures_total',
  help: 'Total number of login failures',
  labelNames: ['reason']
});

const securitySuspiciousRequestsTotal = new prometheus.Counter({
  name: 'security_suspicious_requests_total',
  help: 'Total number of suspicious requests detected',
  labelNames: ['pattern']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(websocketConnectionsActive);
register.registerMetric(paymentAttemptsTotal);
register.registerMetric(paymentFailuresTotal);
register.registerMetric(matchingDuration);
register.registerMetric(authLoginFailuresTotal);
register.registerMetric(securitySuspiciousRequestsTotal);

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const status = res.statusCode.toString();
    
    httpRequestDuration.labels(method, route, status).observe(duration);
    httpRequestsTotal.labels(method, route, status).inc();
  });
  
  next();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};

// Export metrics for use in other parts of the application
export const metrics = {
  websocketConnectionsActive,
  paymentAttemptsTotal,
  paymentFailuresTotal,
  matchingDuration,
  authLoginFailuresTotal,
  securitySuspiciousRequestsTotal
};

// Utility function to track async operations
export const trackAsyncOperation = async <T>(
  operation: () => Promise<T>,
  metric: prometheus.Histogram<string>,
  labels: Record<string, string>
): Promise<T> => {
  const end = metric.startTimer(labels);
  try {
    const result = await operation();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
};

// Health check metrics
const healthCheckGauge = new prometheus.Gauge({
  name: 'health_check_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service']
});

register.registerMetric(healthCheckGauge);

export const updateHealthStatus = (service: string, isHealthy: boolean) => {
  healthCheckGauge.labels(service).set(isHealthy ? 1 : 0);
};

// Business metrics
const activeUsersGauge = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users in the last 24 hours'
});

const matchesCreatedTotal = new prometheus.Counter({
  name: 'matches_created_total',
  help: 'Total number of matches created',
  labelNames: ['group_type']
});

const messageseSentTotal = new prometheus.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['type']
});

const premiumSubscriptionsActive = new prometheus.Gauge({
  name: 'premium_subscriptions_active',
  help: 'Number of active premium subscriptions'
});

register.registerMetric(activeUsersGauge);
register.registerMetric(matchesCreatedTotal);
register.registerMetric(messageseSentTotal);
register.registerMetric(premiumSubscriptionsActive);

export const businessMetrics = {
  activeUsersGauge,
  matchesCreatedTotal,
  messageseSentTotal,
  premiumSubscriptionsActive
};