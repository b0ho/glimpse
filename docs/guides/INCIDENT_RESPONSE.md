# Glimpse 장애 대응 매뉴얼

## 🚨 개요

이 문서는 Glimpse 서비스에서 발생할 수 있는 다양한 장애 상황에 대한 대응 절차를 정의합니다. 모든 개발자와 운영팀은 이 매뉴얼을 숙지하고 장애 발생 시 신속하게 대응할 수 있어야 합니다.

### 장애 등급 정의

| 등급 | 설명 | 영향도 | 대응 시간 | 예시 |
|------|------|--------|-----------|------|
| **P0** | 전체 서비스 중단 | 100% 사용자 영향 | 즉시 (15분 내) | 서버 전체 다운, DB 접속 불가 |
| **P1** | 핵심 기능 장애 | 50%+ 사용자 영향 | 30분 내 | 로그인 불가, 결제 실패 |
| **P2** | 주요 기능 장애 | 10-50% 사용자 영향 | 2시간 내 | 채팅 지연, 일부 API 오류 |
| **P3** | 부분 기능 장애 | <10% 사용자 영향 | 24시간 내 | 통계 오류, UI 버그 |

## 👥 온콜 체계

### 온콜 로테이션
```
주간 담당 (09:00 - 18:00)
- Primary: DevOps 엔지니어
- Secondary: 백엔드 개발자

야간 담당 (18:00 - 09:00)
- Primary: 시니어 개발자 (순환)
- Secondary: DevOps 엔지니어

주말/공휴일
- Primary & Secondary: 주간 순환
```

### 연락망
```yaml
# 비상 연락망 (우선순위 순)
1차 대응:
  - 온콜 엔지니어: +82-10-XXXX-XXXX
  - Slack: #incidents (자동 알림)
  - PagerDuty: glimpse-oncall

2차 에스컬레이션 (30분 내 미해결):
  - Tech Lead: +82-10-XXXX-XXXX
  - DevOps Lead: +82-10-XXXX-XXXX

3차 에스컬레이션 (1시간 내 미해결):
  - CTO: +82-10-XXXX-XXXX
  - CEO: +82-10-XXXX-XXXX (P0만)
```

## 🔍 장애 감지

### 자동 모니터링
```yaml
# 모니터링 도구 및 임계값
Prometheus + Grafana:
  - API 응답 시간 > 1초: P2 알림
  - 에러율 > 5%: P1 알림
  - 서버 다운: P0 알림

Uptime Robot:
  - 헬스체크 실패: 즉시 알림
  - 응답 시간 > 3초: 경고

Sentry:
  - 신규 에러 발생: 개발팀 알림
  - 에러 급증 (10배↑): P1 알림

CloudWatch:
  - CPU > 80%: 경고
  - 메모리 > 90%: P2 알림
  - 디스크 > 95%: P1 알림
```

### 수동 확인 체크리스트
```bash
# 1. 서비스 상태 확인
curl -f https://api.glimpse.kr/health || echo "API Down"
curl -f https://glimpse.kr || echo "Web Down"

# 2. 데이터베이스 확인
psql -h $DB_HOST -U $DB_USER -c "SELECT 1" || echo "DB Down"

# 3. Redis 확인
redis-cli -h $REDIS_HOST ping || echo "Redis Down"

# 4. 주요 API 엔드포인트 테스트
./scripts/health-check-all.sh
```

## 📋 대응 절차

### 1단계: 장애 인지 및 평가 (5분)

```bash
#!/bin/bash
# scripts/incident-assess.sh

echo "=== 장애 평가 시작 ==="
echo "시간: $(date)"

# 서비스 상태 확인
echo -e "\n[서비스 상태]"
for service in api web admin; do
  response=$(curl -s -o /dev/null -w "%{http_code}" https://${service}.glimpse.kr/health)
  echo "$service: $response"
done

# 시스템 리소스 확인
echo -e "\n[시스템 리소스]"
ssh prod-server "top -bn1 | head -5"

# 최근 에러 로그
echo -e "\n[최근 에러]"
ssh prod-server "tail -50 /var/log/glimpse/error.log | grep ERROR"

# 데이터베이스 상태
echo -e "\n[DB 상태]"
psql -h $DB_HOST -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### 2단계: 초기 대응 (10분)

#### P0/P1 장애 대응
```bash
# 1. 인시던트 생성
./scripts/create-incident.sh P0 "전체 서비스 중단"

# 2. 상태 페이지 업데이트
curl -X POST https://api.statuspage.io/v1/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "서비스 장애 발생",
      "status": "investigating",
      "impact_override": "major"
    }
  }'

# 3. 전체 팀 소집
./scripts/notify-all-hands.sh "P0 장애 발생 - 즉시 #incident-room 참여"

# 4. War Room 개설
slack-cli create-channel incident-$(date +%Y%m%d-%H%M)
```

#### 빠른 복구 시도
```bash
# 서비스 재시작 (가장 빠른 복구 방법)
./scripts/restart-service.sh api

# 또는 이전 버전으로 롤백
./scripts/rollback-quick.sh

# 트래픽 우회 (DR 사이트로)
./scripts/switch-to-dr.sh
```

### 3단계: 근본 원인 분석 (장애 안정화 후)

#### 로그 수집 스크립트
```bash
#!/bin/bash
# scripts/collect-incident-logs.sh

INCIDENT_ID=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_DIR="/tmp/incident-$INCIDENT_ID-$TIMESTAMP"

mkdir -p $LOG_DIR

# 애플리케이션 로그
for server in api-1 api-2 api-3; do
  ssh $server "sudo tar -czf - /var/log/glimpse/" > $LOG_DIR/${server}-app-logs.tar.gz
done

# 시스템 로그
for server in api-1 api-2 api-3; do
  ssh $server "sudo journalctl --since '1 hour ago' > /tmp/system.log && tar -czf - /tmp/system.log" > $LOG_DIR/${server}-system-logs.tar.gz
done

# 데이터베이스 로그
ssh db-server "sudo tar -czf - /var/log/postgresql/" > $LOG_DIR/db-logs.tar.gz

# 메트릭 스냅샷
curl -s "http://prometheus:9090/api/v1/query_range?query=up&start=$(date -d '1 hour ago' +%s)&end=$(date +%s)&step=60" > $LOG_DIR/metrics.json

# S3 업로드
aws s3 cp $LOG_DIR s3://glimpse-incidents/$INCIDENT_ID/ --recursive

echo "로그 수집 완료: s3://glimpse-incidents/$INCIDENT_ID/"
```

### 4단계: 복구 및 검증

#### 복구 체크리스트
- [ ] 서비스 정상 작동 확인
- [ ] 모든 헬스체크 통과
- [ ] 주요 비즈니스 메트릭 정상
- [ ] 에러율 정상 수준 복귀
- [ ] 고객 영향도 확인

#### 복구 검증 스크립트
```bash
#!/bin/bash
# scripts/verify-recovery.sh

echo "=== 복구 검증 시작 ==="

# 1. 헬스체크
echo "[헬스체크]"
for endpoint in health ready; do
  for service in api web admin; do
    status=$(curl -s https://${service}.glimpse.kr/${endpoint} | jq -r .status)
    echo "$service/$endpoint: $status"
  done
done

# 2. 주요 API 테스트
echo -e "\n[API 기능 테스트]"
./scripts/smoke-test.sh

# 3. 성능 메트릭
echo -e "\n[성능 메트릭]"
curl -s http://prometheus:9090/api/v1/query?query=http_request_duration_seconds | jq '.data.result[0].value[1]'

# 4. 에러율
echo -e "\n[에러율]"
curl -s http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m]) | jq '.data.result[0].value[1]'

echo -e "\n=== 검증 완료 ==="
```

## 🔄 주요 장애 시나리오별 대응

### 1. 데이터베이스 장애

#### 증상
- API 500 에러 다발
- "connection refused" 또는 "too many connections" 에러
- 쿼리 타임아웃

#### 대응 절차
```bash
# 1. DB 연결 상태 확인
psql -h $DB_HOST -U postgres -c "\l"

# 2. 활성 연결 수 확인
psql -h $DB_HOST -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 3. 장시간 실행 쿼리 확인 및 종료
psql -h $DB_HOST -U postgres << EOF
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- 문제 쿼리 종료
SELECT pg_terminate_backend(PID);
EOF

# 4. 읽기 전용 복제본으로 트래픽 전환
./scripts/switch-db-readonly.sh

# 5. 마스터 DB 재시작 (최후 수단)
ssh db-server "sudo systemctl restart postgresql"
```

### 2. 메모리 부족 (OOM)

#### 증상
- 랜덤한 서비스 재시작
- "Cannot allocate memory" 에러
- 응답 속도 급격히 저하

#### 대응 절차
```bash
# 1. 메모리 사용량 확인
for server in api-1 api-2 api-3; do
  echo "=== $server ==="
  ssh $server "free -h && ps aux --sort=-%mem | head -10"
done

# 2. 메모리 누수 프로세스 재시작
ssh $server "sudo systemctl restart glimpse-api"

# 3. 임시 스왑 추가 (긴급)
ssh $server << 'EOF'
sudo dd if=/dev/zero of=/swapfile bs=1G count=4
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
EOF

# 4. 불필요한 캐시 정리
ssh $server "sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches"
```

### 3. DDoS 공격

#### 증상
- 비정상적인 트래픽 급증
- 특정 IP에서 대량 요청
- 서비스 응답 불가

#### 대응 절차
```bash
# 1. 공격 패턴 분석
ssh nginx-server "tail -10000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20"

# 2. CloudFlare DDoS 보호 활성화
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

# 3. 의심 IP 차단
for ip in $(cat suspicious_ips.txt); do
  sudo iptables -I INPUT -s $ip -j DROP
done

# 4. Rate limiting 강화
ssh nginx-server "sudo sed -i 's/rate=10r\/s/rate=2r\/s/g' /etc/nginx/nginx.conf && sudo nginx -s reload"
```

### 4. 배포 실패로 인한 장애

#### 증상
- 최근 배포 후 에러 급증
- 특정 기능만 작동 불가
- 호환성 문제

#### 대응 절차
```bash
# 1. 현재 버전 확인
kubectl get deployments -o wide

# 2. 이전 버전으로 즉시 롤백
kubectl rollout undo deployment/glimpse-api

# 3. 롤백 상태 확인
kubectl rollout status deployment/glimpse-api

# 4. 문제 버전 이미지 격리
docker tag glimpse/api:latest glimpse/api:broken-$(date +%Y%m%d)
```

### 5. 외부 서비스 장애 (결제, SMS 등)

#### 증상
- 특정 기능만 실패
- 타임아웃 에러
- 외부 API 에러 응답

#### 대응 절차
```bash
# 1. 외부 서비스 상태 확인
curl -s https://status.stripe.com/api/v2/status.json | jq .status
curl -s https://api.twilio.com/2010-04-01/Accounts.json -u $TWILIO_SID:$TWILIO_TOKEN

# 2. 서킷 브레이커 상태 확인
curl http://localhost:3000/admin/circuit-breakers

# 3. 폴백 모드 활성화
./scripts/enable-fallback-mode.sh payments

# 4. 재시도 큐 일시 중지
redis-cli SET payment:retry:paused 1 EX 3600
```

## 📊 사후 분석 (Post-Mortem)

### 템플릿
```markdown
# 장애 보고서 - [날짜]

## 요약
- **장애 시간**: YYYY-MM-DD HH:MM - HH:MM (총 X시간 Y분)
- **영향도**: N% 사용자 영향, 주요 기능 X 불가
- **근본 원인**: 한 문장으로 요약

## 타임라인
- HH:MM - 최초 알림 수신
- HH:MM - 장애 확인 및 대응 시작
- HH:MM - 근본 원인 파악
- HH:MM - 복구 조치 적용
- HH:MM - 서비스 정상화 확인

## 근본 원인 분석
### 무엇이 일어났는가?
[상세 설명]

### 왜 일어났는가?
[5 Why 분석]

### 어떻게 해결했는가?
[적용한 해결책]

## 개선 사항
### 즉시 조치 (1주 내)
- [ ] 액션 아이템 1
- [ ] 액션 아이템 2

### 장기 개선 (1개월 내)
- [ ] 시스템 개선 1
- [ ] 프로세스 개선 2

## 교훈
- 잘한 점
- 개선할 점
```

### 자동 리포트 생성
```bash
#!/bin/bash
# scripts/generate-postmortem.sh

INCIDENT_ID=$1
TEMPLATE="/templates/postmortem.md"
OUTPUT="postmortems/$(date +%Y%m%d)-$INCIDENT_ID.md"

# 인시던트 데이터 수집
data=$(curl -s "http://incident-api/incidents/$INCIDENT_ID")

# 템플릿 채우기
cp $TEMPLATE $OUTPUT
sed -i "s/{{date}}/$(date +%Y-%m-%d)/g" $OUTPUT
sed -i "s/{{duration}}/$(echo $data | jq -r .duration)/g" $OUTPUT
sed -i "s/{{impact}}/$(echo $data | jq -r .impact)/g" $OUTPUT

# 타임라인 추가
echo $data | jq -r '.timeline[] | "- \(.time) - \(.event)"' >> $OUTPUT

echo "Post-mortem 생성: $OUTPUT"
```

## 🛠 도구 및 스크립트

### 장애 대응 툴킷
```bash
# 도구 위치: /opt/glimpse/incident-toolkit/

incident-toolkit/
├── assess.sh          # 장애 평가
├── notify.sh          # 알림 발송
├── rollback.sh        # 빠른 롤백
├── collect-logs.sh    # 로그 수집
├── switch-dr.sh       # DR 전환
├── health-check.sh    # 헬스 체크
└── post-mortem.sh     # 사후 분석

# 사용 예
./incident-toolkit/assess.sh
./incident-toolkit/rollback.sh v1.2.3
```

### 유용한 명령어 모음
```bash
# 실시간 로그 모니터링
tail -f /var/log/glimpse/*.log | grep -E "ERROR|CRITICAL"

# API 응답 시간 측정
while true; do curl -w "@curl-format.txt" -o /dev/null -s https://api.glimpse.kr/health; sleep 1; done

# 부하 테스트 (복구 후)
ab -n 1000 -c 100 https://api.glimpse.kr/health

# 네트워크 연결 확인
netstat -tuln | grep ESTABLISHED | wc -l

# 프로세스별 리소스 사용량
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

## 🔐 보안 고려사항

### 장애 대응 중 보안
- 모든 작업은 감사 로그에 기록
- 임시 권한 부여는 시간 제한 설정
- 민감 정보 노출 주의 (로그, 슬랙 등)
- 외부 공격 가능성 항상 고려

### 접근 권한 관리
```bash
# 임시 관리자 권한 부여 (1시간)
./scripts/grant-emergency-access.sh user@example.com 3600

# 모든 임시 권한 철회
./scripts/revoke-all-emergency-access.sh
```

## 📱 연락처 및 리소스

### 내부 연락처
- **인시던트 커맨더**: 온콜 엔지니어
- **기술 지원**: #tech-support (Slack)
- **경영진 보고**: incidents@glimpse.kr

### 외부 연락처
- **AWS Support**: +1-800-xxx-xxxx
- **CloudFlare**: support@cloudflare.com
- **Datadog Support**: support@datadoghq.com

### 참고 문서
- [AWS 장애 대응 가이드](https://aws.amazon.com/incident-response/)
- [Google SRE Handbook](https://sre.google/sre-book/)
- [PagerDuty Incident Response](https://response.pagerduty.com/)

## ✅ 체크리스트

### 일일 점검
- [ ] 모든 헬스체크 정상
- [ ] 알림 채널 작동 확인
- [ ] 온콜 담당자 확인

### 주간 점검  
- [ ] 장애 대응 스크립트 테스트
- [ ] 백업 복구 테스트
- [ ] 팀 교육 및 시뮬레이션

### 월간 점검
- [ ] 전체 DR 훈련
- [ ] 도구 및 스크립트 업데이트
- [ ] Post-mortem 리뷰 및 개선사항 적용