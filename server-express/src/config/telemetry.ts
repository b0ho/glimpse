/**
 * @module Telemetry
 * @description OpenTelemetry 원격 측정 설정 및 관리
 * 
 * OpenTelemetry를 사용하여 애플리케이션의 성능과 동작을 모니터링합니다.
 * 분산 트레이싱, 메트릭 수집, 로그 집계를 통해 시스템의 상태를 실시간으로
 * 추적하고 성능 병목 지점을 찾아낼 수 있습니다.
 * 
 * 주요 기능:
 * - 분산 트레이싱으로 요청 흐름 추적
 * - 메트릭 수집으로 성능 지표 모니터링
 * - 자동 인스트루멘테이션으로 라이브러리 호출 추적
 * - OTLP 프로토콜을 통한 데이터 전송
 * - 민감한 정보 자동 필터링
 * 
 * 모니터링 대상:
 * - HTTP 요청/응답 시간과 상태
 * - 데이터베이스 쿼리 성능
 * - 외부 API 호출 추적
 * - Express 미들웨어 성능
 * - 시스템 리소스 사용률
 * 
 * 보안 고려사항:
 * - Authorization 헤더 자동 제거
 * - Cookie 정보 필터링
 * - 민감한 URL 파라미터 마스킹
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

/**
 * 개발 환경 디버깅 로깅 설정
 * 
 * 개발 환경에서만 OpenTelemetry 내부 로깅을 활성화하여
 * 트레이싱과 메트릭 수집 과정을 디버깅할 수 있도록 합니다.
 */
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

/**
 * OTLP (OpenTelemetry Protocol) 엔드포인트 설정
 * 
 * 텔레메트리 데이터를 수집할 OTLP 수집기의 엔드포인트를 설정합니다.
 * 기본값은 로컬 개발 환경용이며, 프로덕션에서는 실제 모니터링 서비스를 지정합니다.
 * 
 * @constant {string}
 */
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

/**
 * 트레이스 데이터 익스포터 설정
 * 
 * 분산 트레이싱 데이터를 OTLP 형식으로 외부 모니터링 시스템에 전송합니다.
 * 각 요청의 전체 흐름과 소요 시간을 추적할 수 있습니다.
 * 
 * @constant {OTLPTraceExporter}
 */
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: {
    'x-service-name': 'glimpse-server',
  },
});

/**
 * 메트릭 데이터 익스포터 설정
 * 
 * 애플리케이션의 성능 메트릭을 수집하여 외부 모니터링 시스템에 전송합니다.
 * CPU 사용률, 메모리 사용량, 요청 처리량 등을 모니터링할 수 있습니다.
 * 
 * @constant {OTLPMetricExporter}
 */
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {
    'x-service-name': 'glimpse-server',
  },
  // temporalityPreference는 제거 (타입 에러 해결)
});

/**
 * OpenTelemetry SDK 초기화
 * 
 * Node.js 애플리케이션을 위한 OpenTelemetry SDK를 설정합니다.
 * 자동 인스트루멘테이션을 통해 다양한 라이브러리의 호출을 자동으로 추적하고,
 * 메트릭 수집 간격과 익스포터를 설정합니다.
 * 
 * @constant {NodeSDK}
 */
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

/**
 * 애플리케이션 종료 시 OpenTelemetry 정리
 * 
 * SIGTERM 신호를 받으면 OpenTelemetry SDK를 안전하게 종료합니다.
 * 수집 중인 데이터를 모두 전송하고 리소스를 정리한 후 프로세스를 종료합니다.
 * 
 * @event SIGTERM
 */
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('OpenTelemetry terminated successfully'))
    .catch((error) => console.error('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});

/**
 * OpenTelemetry SDK 시작
 * 
 * 설정된 OpenTelemetry SDK를 시작하여 텔레메트리 데이터 수집을 활성화합니다.
 * 이후 모든 HTTP 요청, 데이터베이스 쿼리 등이 자동으로 추적됩니다.
 */
otelSDK.start();

/**
 * OpenTelemetry SDK 인스턴스 익스포트
 * 
 * 다른 모듈에서 SDK에 직접 접근해야 할 때 사용할 수 있습니다.
 * 일반적으로는 자동 인스트루멘테이션이 처리하므로 직접 사용할 필요는 없습니다.
 * 
 * @constant {NodeSDK}
 */
export { otelSDK };