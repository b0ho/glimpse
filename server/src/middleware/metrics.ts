import { Request, Response, NextFunction } from 'express';
import { metrics } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

// 메트릭 미터 생성
const meter = metrics.getMeter('glimpse-server', '1.0.0');

// 카운터와 히스토그램 생성
const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

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

// 비즈니스 메트릭
const userRegistrationCounter = meter.createCounter('user_registrations_total', {
  description: 'Total number of user registrations',
});

const matchCounter = meter.createCounter('matches_total', {
  description: 'Total number of matches created',
});

const likeCounter = meter.createCounter('likes_total', {
  description: 'Total number of likes',
});

const paymentCounter = meter.createCounter('payments_total', {
  description: 'Total number of payments',
});

const paymentAmountHistogram = meter.createHistogram('payment_amount_krw', {
  description: 'Payment amounts in KRW',
  unit: 'KRW',
});

// 메트릭 미들웨어
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
      responseSize = Buffer.byteLength(body);
    } else if (Buffer.isBuffer(body)) {
      responseSize = body.length;
    } else if (body && typeof body === 'object') {
      responseSize = Buffer.byteLength(JSON.stringify(body));
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

// 비즈니스 메트릭 헬퍼 함수들
export const recordUserRegistration = (userType: string = 'regular') => {
  userRegistrationCounter.add(1, { user_type: userType });
};

export const recordMatch = (groupType: string) => {
  matchCounter.add(1, { group_type: groupType });
};

export const recordLike = (isPremium: boolean) => {
  likeCounter.add(1, { user_type: isPremium ? 'premium' : 'free' });
};

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

// 시스템 메트릭 수집 (1분마다)
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