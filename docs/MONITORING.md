# 성능 모니터링 가이드

## 개요

Glimpse 프로젝트는 OpenTelemetry를 기반으로 한 포괄적인 관측성(Observability) 시스템을 구축했습니다.

## 모니터링 스택

### 1. 메트릭 (Metrics)
- **수집**: OpenTelemetry SDK
- **저장**: Prometheus
- **시각화**: Grafana

### 2. 추적 (Tracing)
- **수집**: OpenTelemetry SDK
- **저장**: Grafana Tempo
- **시각화**: Grafana

### 3. 로그 (Logging)
- **수집**: Promtail
- **저장**: Grafana Loki
- **시각화**: Grafana

## 빠른 시작

### 1. 모니터링 스택 시작

```bash
# 모니터링 인프라 시작
docker-compose -f docker-compose.monitoring.yml up -d

# 상태 확인
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. 접속 정보

- **Grafana**: http://localhost:3003
  - ID: admin
  - PW: glimpse123
- **Prometheus**: http://localhost:9090
- **OpenTelemetry Collector Health**: http://localhost:13133

### 3. 서버 시작 시 자동 연동

서버가 시작되면 자동으로 OpenTelemetry가 활성화되어 메트릭과 트레이스를 수집합니다.

## 주요 메트릭

### HTTP 메트릭
- `http_requests_total` - 총 요청 수
- `http_request_duration_seconds` - 요청 처리 시간
- `http_requests_active` - 활성 요청 수
- `http_request_size_bytes` - 요청 크기
- `http_response_size_bytes` - 응답 크기

### 비즈니스 메트릭
- `user_registrations_total` - 사용자 가입 수
- `matches_total` - 매칭 생성 수
- `likes_total` - 좋아요 수
- `payments_total` - 결제 수
- `payment_amount_krw` - 결제 금액 (원화)

### 시스템 메트릭
- `nodejs_memory_usage_bytes` - 메모리 사용량
- `nodejs_cpu_usage_percent` - CPU 사용률
- `nodejs_event_loop_lag_seconds` - 이벤트 루프 지연

## 커스텀 메트릭 추가

### 1. 카운터 추가
```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('glimpse-server');
const myCounter = meter.createCounter('my_custom_counter', {
  description: 'My custom counter description'
});

// 사용
myCounter.add(1, { label: 'value' });
```

### 2. 히스토그램 추가
```typescript
const myHistogram = meter.createHistogram('my_custom_histogram', {
  description: 'My custom histogram',
  unit: 'ms'
});

// 사용
myHistogram.record(latency, { operation: 'database_query' });
```

## 대시보드

### 1. Glimpse Overview Dashboard
기본 제공되는 대시보드로 다음 정보를 표시합니다:
- 요청 속도 (Request Rate)
- 응답 시간 (Response Time)
- 에러율 (Error Rate)
- 메모리 사용량
- 비즈니스 메트릭 (신규 가입, 매칭, 수익 등)

### 2. 커스텀 대시보드 추가
1. Grafana 접속
2. Create → Dashboard
3. Add Panel
4. Prometheus 데이터소스 선택
5. PromQL 쿼리 작성

## 알림 설정

### 1. 기본 알림 규칙
```yaml
# alerts/app.yml
groups:
  - name: app
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_class="5xx"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighMemoryUsage
        expr: nodejs_memory_usage_bytes{type="heap_used"} > 1000000000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
```

### 2. 알림 채널 설정
Grafana에서 다음 알림 채널을 설정할 수 있습니다:
- Slack
- Email
- PagerDuty
- Webhook

## 성능 최적화 팁

### 1. 메트릭 카디널리티 관리
- 불필요한 라벨 제거
- 높은 카디널리티 라벨 피하기 (예: user_id)

### 2. 샘플링 설정
```typescript
// 트레이스 샘플링 비율 조정
const sdk = new NodeSDK({
  sampler: new TraceIdRatioBasedSampler(0.1), // 10% 샘플링
});
```

### 3. 배치 처리
메트릭과 트레이스는 자동으로 배치 처리되어 네트워크 오버헤드를 줄입니다.

## 문제 해결

### 메트릭이 표시되지 않을 때
1. OpenTelemetry Collector 상태 확인
   ```bash
   curl http://localhost:13133/health
   ```

2. 로그 확인
   ```bash
   docker logs glimpse-otel-collector
   ```

3. 네트워크 연결 확인
   ```bash
   docker network inspect glimpse-network
   ```

### 성능 이슈
1. 메트릭 수집 간격 조정
2. 히스토그램 버킷 수 최적화
3. 불필요한 인스트루멘테이션 비활성화

## 프로덕션 고려사항

### 1. 데이터 보존 정책
- Prometheus: 30일
- Tempo: 7일
- Loki: 14일

### 2. 스케일링
- Prometheus 페더레이션 구성
- Tempo 분산 모드
- Loki 멀티테넌트 구성

### 3. 보안
- TLS 암호화 활성화
- 인증/인가 설정
- 민감한 데이터 마스킹

## 추가 리소스
- [OpenTelemetry 문서](https://opentelemetry.io/docs/)
- [Grafana 문서](https://grafana.com/docs/)
- [Prometheus 모범 사례](https://prometheus.io/docs/practices/)