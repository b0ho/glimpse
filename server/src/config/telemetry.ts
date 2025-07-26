import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// 개발 환경에서 디버깅을 위한 로깅 활성화
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

// OpenTelemetry 리소스 정의
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'glimpse-server',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  })
);

// OTLP 엔드포인트 설정
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

// Trace Exporter 설정
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: {
    'api-key': process.env.OTEL_API_KEY || '',
  },
});

// Metric Exporter 설정
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {
    'api-key': process.env.OTEL_API_KEY || '',
  },
});

// 개발 환경에서는 콘솔 출력도 추가
const metricReader = process.env.NODE_ENV === 'development'
  ? new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 10000, // 10초마다 출력
    })
  : new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30000, // 30초마다 전송
    });

// OpenTelemetry SDK 초기화
export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // 특정 인스트루멘테이션 비활성화 또는 설정
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // 파일 시스템 추적 비활성화
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        // Express 미들웨어에서 민감한 정보 제거
        requestHook: (span, request) => {
          span.setAttribute('http.method', request.method);
          span.setAttribute('http.target', request.path);
          // 민감한 헤더 제거
          const headers = { ...request.headers };
          delete headers.authorization;
          delete headers.cookie;
          span.setAttribute('http.request.headers', JSON.stringify(headers));
        },
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // HTTP 요청에서 민감한 정보 제거
        requestHook: (span, request) => {
          span.setAttribute('http.method', request.method || 'GET');
          // URL에서 쿼리 파라미터 제거 (민감한 정보 포함 가능)
          if (request.url) {
            const url = new URL(request.url, `http://${request.headers.host}`);
            span.setAttribute('http.url', `${url.origin}${url.pathname}`);
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