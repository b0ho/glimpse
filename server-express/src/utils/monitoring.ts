/**
 * 애플리케이션 모니터링
 * @module utils/monitoring
 * @description Prometheus를 사용한 메트릭 수집 및 모니터링
 */

import { Request, Response, NextFunction } from 'express';
import * as prometheus from 'prom-client';

/**
 * Prometheus 레지스트리
 * @constant register
 * @description 모든 메트릭을 등록하는 중앙 레지스트리
 */
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

const smsMessagesSentTotal = new prometheus.Counter({
  name: 'sms_messages_sent_total',
  help: 'Total number of SMS messages sent',
  labelNames: ['provider', 'status']
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
register.registerMetric(smsMessagesSentTotal);

/**
 * HTTP 메트릭 추적 미들웨어
 * @function metricsMiddleware
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @description HTTP 요청의 지속 시간과 수를 추적
 */
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

/**
 * 메트릭 엔드포인트 핸들러
 * @async
 * @function metricsHandler
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @description /metrics 엔드포인트에서 Prometheus 형식의 메트릭 제공
 */
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};

/**
 * 애플리케이션 메트릭 객체
 * @constant metrics
 * @description 다른 모듈에서 사용할 수 있는 메트릭 모음
 */
export const metrics = {
  websocketConnectionsActive,
  paymentAttemptsTotal,
  paymentFailuresTotal,
  matchingDuration,
  authLoginFailuresTotal,
  securitySuspiciousRequestsTotal,
  smsMessagesSentTotal
};

/**
 * 비동기 작업 추적 유틸리티
 * @async
 * @function trackAsyncOperation
 * @template T - 작업 결과 타입
 * @param {Function} operation - 추적할 비동기 작업
 * @param {prometheus.Histogram} metric - 사용할 Prometheus 히스토그램
 * @param {Record<string, string>} labels - 메트릭 레이블
 * @returns {Promise<T>} 작업 결과
 * @description 비동기 작업의 실행 시간을 자동으로 추적
 */
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

/**
 * 헬스 체크 상태 업데이트
 * @function updateHealthStatus
 * @param {string} service - 서비스 이름
 * @param {boolean} isHealthy - 건강 상태
 * @description 특정 서비스의 건강 상태를 메트릭에 업데이트
 */
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

// Message Queue metrics
const mqOfflineMessages = new prometheus.Gauge({
  name: 'message_queue_offline_messages',
  help: 'Number of offline messages in queue',
  labelNames: ['user_id']
});

const mqPushRetries = new prometheus.Counter({
  name: 'message_queue_push_retries_total',
  help: 'Total number of push notification retries'
});

const mqProcessingDuration = new prometheus.Histogram({
  name: 'message_queue_processing_duration_seconds',
  help: 'Duration of message queue processing',
  labelNames: ['queue_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// WebSocket event metrics
const wsMessagesSent = new prometheus.Counter({
  name: 'websocket_messages_sent_total',
  help: 'Total number of WebSocket messages sent',
  labelNames: ['event_type']
});

const wsMessagesReceived = new prometheus.Counter({
  name: 'websocket_messages_received_total',
  help: 'Total number of WebSocket messages received',
  labelNames: ['event_type']
});

const wsErrors = new prometheus.Counter({
  name: 'websocket_errors_total',
  help: 'Total number of WebSocket errors',
  labelNames: ['error_type']
});

const wsReconnections = new prometheus.Counter({
  name: 'websocket_reconnections_total',
  help: 'Total number of WebSocket reconnections'
});

// Chat room metrics
const chatRoomActive = new prometheus.Gauge({
  name: 'chat_rooms_active',
  help: 'Number of active chat rooms'
});

const chatTypingUsers = new prometheus.Gauge({
  name: 'chat_typing_users',
  help: 'Number of users currently typing'
});

register.registerMetric(activeUsersGauge);
register.registerMetric(matchesCreatedTotal);
register.registerMetric(messageseSentTotal);
register.registerMetric(premiumSubscriptionsActive);
register.registerMetric(mqOfflineMessages);
register.registerMetric(mqPushRetries);
register.registerMetric(mqProcessingDuration);
register.registerMetric(wsMessagesSent);
register.registerMetric(wsMessagesReceived);
register.registerMetric(wsErrors);
register.registerMetric(wsReconnections);
register.registerMetric(chatRoomActive);
register.registerMetric(chatTypingUsers);

/**
 * 비즈니스 메트릭
 * @constant businessMetrics
 * @description 사용자, 매칭, 메시지, 구독 등 비즈니스 지표
 */
export const businessMetrics = {
  activeUsersGauge,
  matchesCreatedTotal,
  messageseSentTotal,
  premiumSubscriptionsActive
};

/**
 * 메시지 큐 메트릭
 * @constant messageQueueMetrics
 * @description 오프라인 메시지, 푸시 알림 재시도 등 큐 관련 지표
 */
export const messageQueueMetrics = {
  mqOfflineMessages,
  mqPushRetries,
  mqProcessingDuration
};

/**
 * WebSocket 메트릭
 * @constant websocketMetrics
 * @description WebSocket 연결, 메시지, 에러 관련 지표
 */
export const websocketMetrics = {
  wsMessagesSent,
  wsMessagesReceived,
  wsErrors,
  wsReconnections,
  websocketConnectionsActive
};

/**
 * 채팅 메트릭
 * @constant chatMetrics
 * @description 활성 채팅방, 타이핑 사용자 등 채팅 관련 지표
 */
export const chatMetrics = {
  chatRoomActive,
  chatTypingUsers
};