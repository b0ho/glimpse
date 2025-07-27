import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// 개발 환경에서 디버깅을 위한 로깅 활성화
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

// OTLP 엔드포인트 설정
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

// Trace Exporter 설정
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: {
    'x-service-name': 'glimpse-server',
  },
});

// Metric Exporter 설정
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {
    'x-service-name': 'glimpse-server',
  },
  // temporalityPreference는 제거 (타입 에러 해결)
});

// SDK 초기화
const otelSDK = new NodeSDK({
  serviceName: 'glimpse-server',
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // 10초마다 메트릭 전송
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // 특정 인스트루멘테이션 비활성화 또는 설정
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // 파일 시스템 추적 비활성화
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        // Express 미들웨어에서 민감한 정보 제거
        requestHook: (span: any, request: any) => {
          if (request && request.method) {
            span.setAttribute('http.method', request.method);
          }
          if (request && request.path) {
            span.setAttribute('http.target', request.path);
          }
          // 민감한 헤더 제거
          if (request && request.headers) {
            const headers = { ...request.headers };
            delete headers.authorization;
            delete headers.cookie;
            span.setAttribute('http.request.headers', JSON.stringify(headers));
          }
        },
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // HTTP 요청에서 민감한 정보 제거
        requestHook: (span: any, request: any) => {
          if (request && typeof request === 'object') {
            // ClientRequest의 경우
            if ('method' in request) {
              span.setAttribute('http.method', request.method || 'GET');
            }
            // IncomingMessage의 경우
            if ('url' in request && request.url) {
              try {
                const host = request.headers?.host || 'localhost';
                const url = new globalThis.URL(request.url, `http://${host}`);
                span.setAttribute('http.url', `${url.origin}${url.pathname}`);
              } catch (_err) {
                // URL 파싱 실패 시 무시
              }
            }
          }
        },
      },
    }),
  ],
});

// 정상 종료 처리
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('OpenTelemetry terminated successfully'))
    .catch((error) => console.error('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});

// SDK 시작
otelSDK.start();

export { otelSDK };