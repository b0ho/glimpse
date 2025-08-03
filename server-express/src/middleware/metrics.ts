import { Request, Response, NextFunction } from 'express';
import { metrics } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * OpenTelemetry 메트릭 미터
 * @constant
 * @description 애플리케이션 메트릭 수집을 위한 미터
 */
const meter = metrics.getMeter('glimpse-server', '1.0.0');

/**
 * HTTP 요청 카운터
 * @constant
 * @description 총 HTTP 요청 수 추적
 */
const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

/**
 * HTTP 요청 시간 히스토그램
 * @constant
 * @description HTTP 요청 처리 시간 분포
 */
const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'Duration of HTTP requests in seconds',
  unit: 's',
});

const activeRequestsGauge = meter.createUpDownCounter('http_requests_active', {
  description: 'Number of active HTTP requests',
});

const requestSizeHistogram = meter.createHistogram('http_request_size_bytes', {
  description: 'Size of HTTP requests in bytes',
  unit: 'By',
});

const responseSizeHistogram = meter.createHistogram('http_response_size_bytes', {
  description: 'Size of HTTP responses in bytes',
  unit: 'By',
});

/**
 * 사용자 등록 카운터
 * @constant
 * @description 총 사용자 등록 수 추적
 */
const userRegistrationCounter = meter.createCounter('user_registrations_total', {
  description: 'Total number of user registrations',
});

/**
 * 매칭 카운터
 * @constant
 * @description 총 매칭 수 추적
 */
const matchCounter = meter.createCounter('matches_total', {
  description: 'Total number of matches created',
});

/**
 * 좋아요 카운터
 * @constant
 * @description 총 좋아요 수 추적
 */
const likeCounter = meter.createCounter('likes_total', {
  description: 'Total number of likes',
});

/**
 * 결제 카운터
 * @constant
 * @description 총 결제 수 추적
 */
const paymentCounter = meter.createCounter('payments_total', {
  description: 'Total number of payments',
});

/**
 * 결제 금액 히스토그램
 * @constant
 * @description 결제 금액 분포 (KRW)
 */
const paymentAmountHistogram = meter.createHistogram('payment_amount_krw', {
  description: 'Payment amounts in KRW',
  unit: 'KRW',
});

/**
 * 메트릭 수집 미들웨어 - HTTP 요청/응답 메트릭 수집
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  // 활성 요청 수 증가
  activeRequestsGauge.add(1, {
    method: req.method,
    route: req.route?.path || 'unknown',
  });

  // 요청 크기 기록
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);
  if (requestSize > 0) {
    requestSizeHistogram.record(requestSize, {
      method: req.method,
      route: req.route?.path || 'unknown',
    });
  }

  // 응답 완료 시 메트릭 기록
  const originalSend = res.send;
  res.send = function (body: any) {
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // 초 단위로 변환

    // HTTP 요청 카운터 증가
    httpRequestCounter.add(1, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
      status_class: `${Math.floor(res.statusCode / 100)}xx`,
    });

    // 요청 처리 시간 기록
    httpRequestDuration.record(duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
    });

    // 활성 요청 수 감소
    activeRequestsGauge.add(-1, {
      method: req.method,
      route: req.route?.path || 'unknown',
    });

    // 응답 크기 기록
    let responseSize = 0;
    if (typeof body === 'string') {
      responseSize = globalThis.Buffer.byteLength(body);
    } else if (globalThis.Buffer.isBuffer(body)) {
      responseSize = body.length;
    } else if (body && typeof body === 'object') {
      responseSize = globalThis.Buffer.byteLength(JSON.stringify(body));
    }

    if (responseSize > 0) {
      responseSizeHistogram.record(responseSize, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * 사용자 등록 메트릭 기록
 * @param {string} [userType='regular'] - 사용자 타입
 * @returns {void}
 */
export const recordUserRegistration = (userType: string = 'regular') => {
  userRegistrationCounter.add(1, { user_type: userType });
};

/**
 * 매칭 메트릭 기록
 * @param {string} groupType - 그룹 타입
 * @returns {void}
 */
export const recordMatch = (groupType: string) => {
  matchCounter.add(1, { group_type: groupType });
};

/**
 * 좋아요 메트릭 기록
 * @param {boolean} isPremium - 프리미엄 사용자 여부
 * @returns {void}
 */
export const recordLike = (isPremium: boolean) => {
  likeCounter.add(1, { user_type: isPremium ? 'premium' : 'free' });
};

/**
 * 결제 메트릭 기록
 * @param {string} type - 결제 타입
 * @param {number} amount - 결제 금액
 * @param {string} [currency='KRW'] - 통화
 * @returns {void}
 */
export const recordPayment = (type: string, amount: number, currency: string = 'KRW') => {
  paymentCounter.add(1, { 
    payment_type: type,
    currency: currency,
  });
  
  if (currency === 'KRW') {
    paymentAmountHistogram.record(amount, {
      payment_type: type,
    });
  }
};

/**
 * 시스템 메트릭 수집 시작
 * @description Node.js 시스템 리소스 메트릭을 주기적으로 수집
 * @returns {void}
 */
export const startSystemMetricsCollection = () => {
  const memoryUsageGauge = meter.createObservableGauge('nodejs_memory_usage_bytes', {
    description: 'Node.js memory usage',
    unit: 'By',
  });

  const cpuUsageGauge = meter.createObservableGauge('nodejs_cpu_usage_percent', {
    description: 'Node.js CPU usage percentage',
    unit: '%',
  });

  const eventLoopLagHistogram = meter.createHistogram('nodejs_event_loop_lag_seconds', {
    description: 'Node.js event loop lag',
    unit: 's',
  });

  // 메모리 사용량 관찰
  memoryUsageGauge.addCallback((observableResult) => {
    const memUsage = process.memoryUsage();
    observableResult.observe(memUsage.heapUsed, { type: 'heap_used' });
    observableResult.observe(memUsage.heapTotal, { type: 'heap_total' });
    observableResult.observe(memUsage.rss, { type: 'rss' });
    observableResult.observe(memUsage.external, { type: 'external' });
  });

  // CPU 사용량 관찰
  let lastCpuUsage = process.cpuUsage();
  cpuUsageGauge.addCallback((observableResult) => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const totalUsage = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // 마이크로초를 초로 변환
    const cpuPercent = (totalUsage / 60) * 100; // 1분 간격이므로 60으로 나눔
    observableResult.observe(Math.min(cpuPercent, 100)); // 100%를 초과하지 않도록
    lastCpuUsage = process.cpuUsage();
  });

  // 이벤트 루프 지연 측정
  let lastCheck = performance.now();
  setInterval(() => {
    const now = performance.now();
    const lag = (now - lastCheck - 1000) / 1000; // 1초 간격에서 벗어난 시간 (초 단위)
    if (lag > 0) {
      eventLoopLagHistogram.record(lag);
    }
    lastCheck = now;
  }, 1000);
};