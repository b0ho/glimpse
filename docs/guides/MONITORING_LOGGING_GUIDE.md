# Glimpse 모니터링 및 로깅 가이드

## 📊 개요

효과적인 모니터링과 로깅은 서비스의 안정성과 성능을 유지하는 데 필수적입니다. 이 가이드는 Glimpse 서비스의 모니터링 시스템 구축과 로그 관리 전략을 설명합니다.

## 🏗 모니터링 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana Dashboard                         │
│                  (시각화 및 알림 관리)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                     Prometheus                               │
│                  (메트릭 수집 및 저장)                         │
└──────┬───────────────┬───────────────┬─────────────────────┘
       │               │               │
┌──────┴────┐   ┌─────┴────┐   ┌─────┴────┐   ┌────────────┐
│  Node.js  │   │PostgreSQL│   │  Redis   │   │CloudWatch  │
│ Exporter  │   │ Exporter │   │ Exporter │   │ Exporter   │
└───────────┘   └──────────┘   └──────────┘   └────────────┘
       │               │               │               │
┌──────┴────┐   ┌─────┴────┐   ┌─────┴────┐   ┌────┴───────┐
│   API     │   │    DB    │   │  Cache   │   │    AWS     │
│  Server   │   │  Server  │   │  Server  │   │ Resources  │
└───────────┘   └──────────┘   └──────────┘   └────────────┘
```

## 🔍 메트릭 모니터링

### 1. 애플리케이션 메트릭

#### Prometheus 설정 (server/src/monitoring/metrics.ts)
```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// 메트릭 레지스트리
export const register = new Registry();

// HTTP 요청 카운터
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// HTTP 요청 지속 시간
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// 활성 사용자 수
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register]
});

// WebSocket 연결 수
export const websocketConnections = new Gauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

// 비즈니스 메트릭
export const businessMetrics = {
  likesTotal: new Counter({
    name: 'likes_total',
    help: 'Total number of likes sent',
    labelNames: ['type'],
    registers: [register]
  }),
  
  matchesTotal: new Counter({
    name: 'matches_total',
    help: 'Total number of matches created',
    registers: [register]
  }),
  
  paymentsTotal: new Counter({
    name: 'payments_total',
    help: 'Total number of payments',
    labelNames: ['type', 'status'],
    registers: [register]
  }),
  
  revenue: new Counter({
    name: 'revenue_total_krw',
    help: 'Total revenue in KRW',
    labelNames: ['type'],
    registers: [register]
  })
};
```

#### Express 미들웨어 (server/src/middleware/monitoring.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../monitoring/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    const method = req.method;
    const status = res.statusCode.toString();
    
    httpRequestsTotal.inc({ method, route, status });
    httpRequestDuration.observe({ method, route, status }, duration);
  });
  
  next();
};

// Prometheus 엔드포인트
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};
```

### 2. 인프라 메트릭

#### Node.js 프로세스 메트릭
```typescript
import { collectDefaultMetrics } from 'prom-client';

// 기본 Node.js 메트릭 수집
collectDefaultMetrics({
  register,
  prefix: 'glimpse_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10
});

// 커스텀 프로세스 메트릭
export const processMetrics = {
  memoryUsage: new Gauge({
    name: 'process_memory_usage_bytes',
    help: 'Process memory usage',
    labelNames: ['type'],
    collect() {
      const mem = process.memoryUsage();
      this.set({ type: 'rss' }, mem.rss);
      this.set({ type: 'heapTotal' }, mem.heapTotal);
      this.set({ type: 'heapUsed' }, mem.heapUsed);
      this.set({ type: 'external' }, mem.external);
    },
    registers: [register]
  })
};
```

#### 데이터베이스 메트릭
```sql
-- PostgreSQL 모니터링 뷰
CREATE VIEW v_database_metrics AS
SELECT 
  (SELECT count(*) FROM pg_stat_activity) as active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
  (SELECT count(*) FROM pg_stat_activity WHERE wait_event IS NOT NULL) as waiting_queries,
  (SELECT sum(numbackends) FROM pg_stat_database) as total_connections,
  (SELECT sum(xact_commit) FROM pg_stat_database) as total_commits,
  (SELECT sum(xact_rollback) FROM pg_stat_database) as total_rollbacks,
  (SELECT sum(blks_hit)::float / (sum(blks_hit) + sum(blks_read)) FROM pg_stat_database) as cache_hit_ratio;
```

### 3. Grafana 대시보드 설정

#### 메인 대시보드 (grafana/dashboards/main.json)
```json
{
  "dashboard": {
    "title": "Glimpse Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (status)"
        }],
        "type": "graph",
        "alert": {
          "conditions": [{
            "evaluator": {
              "params": [100],
              "type": "gt"
            },
            "query": {
              "params": ["A", "5m", "now"]
            },
            "reducer": {
              "params": [],
              "type": "avg"
            },
            "type": "query"
          }]
        }
      },
      {
        "title": "Response Time (95th percentile)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }],
        "type": "graph"
      },
      {
        "title": "Active Users",
        "targets": [{
          "expr": "active_users"
        }],
        "type": "stat"
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
        }],
        "type": "graph",
        "thresholds": [{
          "value": 1,
          "color": "yellow"
        }, {
          "value": 5,
          "color": "red"
        }]
      }
    ]
  }
}
```

## 📝 로깅 시스템

### 1. 로깅 구조

#### Winston 설정 (server/src/utils/logger.ts)
```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 포맷
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 개발 환경 포맷
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// 트랜스포트 설정
const transports: winston.transport[] = [
  // 콘솔 출력
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development' ? devFormat : format,
  }),
  
  // 에러 로그 파일
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    format,
  }),
  
  // 전체 로그 파일
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '14d',
    format,
  }),
];

// 로거 생성
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
});

// 구조화된 로깅 헬퍼
export const log = {
  error: (message: string, error?: Error, metadata?: any) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...metadata,
    });
  },
  
  warn: (message: string, metadata?: any) => {
    logger.warn(message, metadata);
  },
  
  info: (message: string, metadata?: any) => {
    logger.info(message, metadata);
  },
  
  http: (req: Request, res: Response, responseTime: number) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id,
    });
  },
  
  debug: (message: string, metadata?: any) => {
    logger.debug(message, metadata);
  },
};
```

### 2. 로그 수집 및 분석

#### ELK Stack 구성 (docker-compose.logging.yml)
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/logs
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.12.0
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml
      - ./logs:/logs
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - elasticsearch
      - logstash

volumes:
  es_data:
```

#### Logstash 파이프라인 (logstash/pipeline/logstash.conf)
```ruby
input {
  beats {
    port => 5044
  }
  
  file {
    path => "/logs/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  # JSON 파싱
  json {
    source => "message"
  }
  
  # 타임스탬프 파싱
  date {
    match => [ "timestamp", "yyyy-MM-dd HH:mm:ss:SSS" ]
    target => "@timestamp"
  }
  
  # 로그 레벨 추출
  mutate {
    add_field => {
      "log_level" => "%{[level]}"
    }
  }
  
  # 에러 로그 분석
  if [level] == "error" {
    mutate {
      add_tag => [ "error" ]
    }
    
    # 스택 트레이스 파싱
    if [stack] {
      mutate {
        add_field => {
          "error_type" => "%{[error]}"
          "stack_trace" => "%{[stack]}"
        }
      }
    }
  }
  
  # HTTP 로그 분석
  if [method] and [url] {
    mutate {
      add_tag => [ "http" ]
    }
    
    # URL 파싱
    grok {
      match => {
        "url" => "^(?<endpoint>/[^?]*)"
      }
    }
    
    # 느린 요청 태깅
    if [responseTime] > 1000 {
      mutate {
        add_tag => [ "slow_request" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "glimpse-logs-%{+YYYY.MM.dd}"
  }
  
  # 에러 알림
  if "error" in [tags] {
    stdout {
      codec => rubydebug
    }
  }
}
```

### 3. 구조화된 로깅 패턴

#### API 요청 로깅
```typescript
// 요청 로깅 미들웨어
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // 요청 컨텍스트 설정
  req.context = {
    requestId,
    userId: req.user?.id,
    startTime: start,
  };
  
  // 요청 로깅
  log.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id,
  });
  
  // 응답 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.http(req, res, duration);
  });
  
  next();
};
```

#### 비즈니스 로직 로깅
```typescript
// 서비스 레이어 로깅 예제
export class MatchingService {
  async createMatch(fromUserId: string, toUserId: string): Promise<Match> {
    const context = {
      action: 'create_match',
      fromUserId,
      toUserId,
      timestamp: new Date().toISOString(),
    };
    
    try {
      log.info('Creating match', context);
      
      // 비즈니스 로직
      const match = await this.prisma.match.create({
        data: {
          user1Id: fromUserId,
          user2Id: toUserId,
        },
      });
      
      log.info('Match created successfully', {
        ...context,
        matchId: match.id,
      });
      
      // 메트릭 업데이트
      businessMetrics.matchesTotal.inc();
      
      return match;
    } catch (error) {
      log.error('Failed to create match', error, context);
      throw error;
    }
  }
}
```

## 🎯 알림 설정

### 1. Prometheus 알림 규칙

#### 알림 규칙 (prometheus/alerts.yml)
```yaml
groups:
  - name: glimpse_alerts
    interval: 30s
    rules:
      # 서비스 가용성
      - alert: ServiceDown
        expr: up{job="glimpse-api"} == 0
        for: 1m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
      
      # 높은 에러율
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
      
      # 응답 시간
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      # 메모리 사용량
      - alert: HighMemoryUsage
        expr: |
          (
            process_memory_usage_bytes{type="rss"}
            /
            process_memory_limit_bytes
          ) > 0.8
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
      
      # 데이터베이스 연결
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          (
            pg_stat_database_numbackends
            /
            pg_settings_max_connections
          ) > 0.8
        for: 5m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections are in use"
      
      # 디스크 공간
      - alert: DiskSpaceRunningLow
        expr: |
          (
            node_filesystem_avail_bytes{mountpoint="/"}
            /
            node_filesystem_size_bytes{mountpoint="/"}
          ) < 0.15
        for: 5m
        labels:
          severity: warning
          team: ops
        annotations:
          summary: "Disk space running low"
          description: "Only {{ $value | humanizePercentage }} disk space remaining"
```

### 2. AlertManager 설정

#### AlertManager 구성 (alertmanager/config.yml)
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  
  routes:
    # Critical 알림은 즉시 전송
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 0s
      
    # 데이터베이스 알림
    - match:
        team: database
      receiver: 'database-team'
      
    # 비즈니스 메트릭 알림
    - match_re:
        alertname: '^(LowMatchRate|PaymentFailure|HighChurn)$'
      receiver: 'business-team'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: 'Glimpse Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        
  - name: 'critical'
    slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        
  - name: 'database-team'
    slack_configs:
      - channel: '#database-alerts'
    email_configs:
      - to: 'database-team@glimpse.kr'
```

## 📊 대시보드 및 시각화

### 1. 핵심 대시보드 목록

1. **Overview Dashboard**
   - 서비스 상태 요약
   - 주요 메트릭 한눈에 보기
   - 실시간 알림 현황

2. **API Performance Dashboard**
   - 엔드포인트별 응답 시간
   - 처리량 및 에러율
   - 느린 쿼리 분석

3. **Business Metrics Dashboard**
   - 일일 활성 사용자
   - 매칭 성공률
   - 수익 및 결제 현황
   - 사용자 이탈률

4. **Infrastructure Dashboard**
   - 서버 리소스 사용률
   - 데이터베이스 성능
   - 네트워크 트래픽

### 2. 커스텀 대시보드 예제

#### 비즈니스 메트릭 대시보드
```json
{
  "dashboard": {
    "title": "Glimpse Business Metrics",
    "panels": [
      {
        "title": "Daily Active Users",
        "targets": [{
          "expr": "sum(increase(user_activity_total[1d]))"
        }]
      },
      {
        "title": "Match Success Rate",
        "targets": [{
          "expr": "sum(rate(matches_total[1h])) / sum(rate(likes_total[1h])) * 100"
        }]
      },
      {
        "title": "Revenue (24h)",
        "targets": [{
          "expr": "sum(increase(revenue_total_krw[24h]))"
        }]
      },
      {
        "title": "Premium Conversion Rate",
        "targets": [{
          "expr": "sum(users{subscription=\"premium\"}) / sum(users) * 100"
        }]
      }
    ]
  }
}
```

## 🔍 로그 분석 쿼리

### Kibana 검색 쿼리 예제

```kibana
# 에러 로그 검색
level:error AND timestamp:[now-1h TO now]

# 특정 사용자의 활동 추적
userId:"user_123" AND timestamp:[now-24h TO now]

# 느린 API 요청
tags:slow_request AND responseTime:>2000

# 결제 실패 추적
action:"payment" AND status:"failed"

# 특정 엔드포인트 분석
endpoint:"/api/v1/likes" AND status:[400 TO 599]
```

### 대시보드 쿼리

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "interval": "5m"
      }
    },
    "top_errors": {
      "terms": {
        "field": "error_type.keyword",
        "size": 10
      }
    }
  }
}
```

## 🛠 트러블슈팅

### 1. 메트릭 누락
```bash
# Prometheus 타겟 확인
curl http://prometheus:9090/api/v1/targets

# 메트릭 엔드포인트 테스트
curl http://localhost:3000/metrics

# Exporter 상태 확인
docker-compose ps | grep exporter
```

### 2. 로그 수집 실패
```bash
# Filebeat 상태 확인
docker-compose logs filebeat

# Logstash 파이프라인 확인
curl -XGET 'localhost:9600/_node/pipelines?pretty'

# Elasticsearch 인덱스 확인
curl -XGET 'localhost:9200/_cat/indices?v'
```

### 3. 알림 미발송
```bash
# AlertManager 상태 확인
curl http://alertmanager:9093/api/v1/status

# 알림 규칙 테스트
promtool check rules /etc/prometheus/alerts.yml

# 알림 히스토리 확인
curl http://alertmanager:9093/api/v1/alerts
```

## 📋 모니터링 체크리스트

### 일일 점검
- [ ] 대시보드 주요 지표 확인
- [ ] 알림 발생 현황 검토
- [ ] 디스크 공간 확인
- [ ] 백업 상태 확인

### 주간 점검
- [ ] 성능 트렌드 분석
- [ ] 로그 보관 정책 확인
- [ ] 알림 규칙 검토 및 조정
- [ ] 대시보드 개선사항 적용

### 월간 점검
- [ ] 메트릭 보관 기간 검토
- [ ] 모니터링 인프라 업데이트
- [ ] 알림 노이즈 분석 및 개선
- [ ] 인시던트 사후 분석

## 🚀 성능 최적화

### 1. 메트릭 수집 최적화
```yaml
# 샘플링 레이트 조정
global:
  scrape_interval: 15s      # 기본: 15s
  evaluation_interval: 15s   # 기본: 15s
  
scrape_configs:
  - job_name: 'glimpse-api'
    scrape_interval: 10s     # API는 더 자주
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api:3000']
```

### 2. 로그 스토리지 최적화
```bash
# 오래된 인덱스 정리
curator --config curator.yml actions.yml

# 인덱스 최적화
curl -XPOST 'localhost:9200/glimpse-logs-*/_forcemerge?max_num_segments=1'

# 샤드 설정 최적화
curl -XPUT 'localhost:9200/_template/glimpse_logs' -d '{
  "index_patterns": ["glimpse-logs-*"],
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1
  }
}'
```

## 📞 지원 및 연락처

### 모니터링 팀
- **Slack**: #monitoring
- **Email**: monitoring@glimpse.kr
- **On-call**: +82-10-XXXX-XXXX

### 외부 지원
- **Grafana Community**: https://community.grafana.com/
- **Prometheus Users**: https://groups.google.com/g/prometheus-users
- **Elastic Forum**: https://discuss.elastic.co/