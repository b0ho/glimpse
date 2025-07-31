# Glimpse 데이터베이스 백업 및 복구 가이드

## 🗄 개요

Glimpse는 사용자의 민감한 데이터를 다루는 데이팅 앱으로, 데이터 손실은 심각한 서비스 중단과 신뢰도 하락으로 이어질 수 있습니다. 이 문서는 PostgreSQL 데이터베이스의 백업 및 복구 전략을 상세히 설명합니다.

### 백업 목표
- **RPO (Recovery Point Objective)**: 최대 1시간의 데이터 손실 허용
- **RTO (Recovery Time Objective)**: 최대 4시간 내 복구
- **보관 기간**: 일일 백업 30일, 주간 백업 12주, 월간 백업 1년

## 🔄 백업 전략

### 1. 백업 유형

#### 1.1 전체 백업 (Full Backup)
```bash
# pg_dump를 사용한 전체 백업
pg_dump -h $DB_HOST -U $DB_USER -d glimpse_prod \
  --verbose \
  --format=custom \
  --compress=9 \
  --file=glimpse_full_$(date +%Y%m%d_%H%M%S).dump

# SQL 형식 백업 (읽기 가능)
pg_dump -h $DB_HOST -U $DB_USER -d glimpse_prod \
  --verbose \
  --format=plain \
  --file=glimpse_full_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 증분 백업 (WAL 아카이빙)
```bash
# postgresql.conf 설정
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backup/archive/%f && cp %p /backup/archive/%f'
archive_timeout = 300  # 5분마다 강제 아카이브
```

#### 1.3 스냅샷 백업 (AWS RDS)
```bash
# RDS 스냅샷 생성
aws rds create-db-snapshot \
  --db-instance-identifier glimpse-production \
  --db-snapshot-identifier glimpse-snapshot-$(date +%Y%m%d-%H%M%S) \
  --tags Key=Type,Value=Manual Key=Retention,Value=30days
```

### 2. 백업 자동화

#### 2.1 백업 스크립트
```bash
#!/bin/bash
# /opt/glimpse/scripts/backup-database.sh

set -euo pipefail

# 설정
source /opt/glimpse/.env.production

BACKUP_ROOT="/backup/postgres"
S3_BUCKET="glimpse-backups"
RETENTION_DAYS=30
LOG_FILE="/var/log/glimpse/backup.log"
SLACK_WEBHOOK=$BACKUP_SLACK_WEBHOOK

# 함수: 로깅
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 함수: Slack 알림
notify_slack() {
    local status=$1
    local message=$2
    local color=${3:-"#36a64f"}
    
    curl -X POST $SLACK_WEBHOOK \
      -H 'Content-Type: application/json' \
      -d "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"title\": \"Database Backup $status\",
          \"text\": \"$message\",
          \"footer\": \"Glimpse Backup System\",
          \"ts\": $(date +%s)
        }]
      }"
}

# 함수: 백업 실행
perform_backup() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$BACKUP_ROOT/$backup_type/$(date +%Y/%m)"
    local backup_file="glimpse_${backup_type}_${timestamp}.dump"
    local backup_path="$backup_dir/$backup_file"
    
    # 디렉토리 생성
    mkdir -p $backup_dir
    
    log "Starting $backup_type backup: $backup_file"
    
    # 백업 실행
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h $DB_HOST \
        -U $DB_USER \
        -d $DB_NAME \
        --verbose \
        --format=custom \
        --compress=9 \
        --jobs=4 \
        --file=$backup_path \
        2>&1 | tee -a $LOG_FILE
    
    # 백업 검증
    if [ -f $backup_path ]; then
        local size=$(du -h $backup_path | cut -f1)
        log "Backup completed: $backup_file (Size: $size)"
        
        # 체크섬 생성
        sha256sum $backup_path > ${backup_path}.sha256
        
        # S3 업로드
        aws s3 cp $backup_path s3://$S3_BUCKET/database/$backup_type/ \
            --storage-class STANDARD_IA
        aws s3 cp ${backup_path}.sha256 s3://$S3_BUCKET/database/$backup_type/
        
        # 메타데이터 저장
        echo "{
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"type\": \"$backup_type\",
            \"file\": \"$backup_file\",
            \"size\": \"$size\",
            \"checksum\": \"$(cat ${backup_path}.sha256 | cut -d' ' -f1)\",
            \"db_version\": \"$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c 'SELECT version()')\"
        }" > ${backup_path}.json
        
        aws s3 cp ${backup_path}.json s3://$S3_BUCKET/database/$backup_type/
        
        return 0
    else
        log "ERROR: Backup failed for $backup_file"
        return 1
    fi
}

# 함수: 로컬 백업 정리
cleanup_local_backups() {
    log "Cleaning up local backups older than $RETENTION_DAYS days"
    
    find $BACKUP_ROOT -name "*.dump" -mtime +$RETENTION_DAYS -delete
    find $BACKUP_ROOT -name "*.sha256" -mtime +$RETENTION_DAYS -delete
    find $BACKUP_ROOT -name "*.json" -mtime +$RETENTION_DAYS -delete
    
    # 빈 디렉토리 정리
    find $BACKUP_ROOT -type d -empty -delete
}

# 함수: S3 백업 정리
cleanup_s3_backups() {
    log "Cleaning up S3 backups based on lifecycle policy"
    
    # Daily backups: 30일 이상 삭제
    aws s3 ls s3://$S3_BUCKET/database/daily/ --recursive | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "30 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            aws s3 rm s3://$S3_BUCKET/$fileName
        fi
    done
}

# 메인 실행
main() {
    log "=== Database backup started ==="
    
    # 백업 종류 결정
    DAY_OF_WEEK=$(date +%u)
    DAY_OF_MONTH=$(date +%d)
    
    if [ "$DAY_OF_MONTH" -eq "01" ]; then
        BACKUP_TYPE="monthly"
    elif [ "$DAY_OF_WEEK" -eq "7" ]; then
        BACKUP_TYPE="weekly"
    else
        BACKUP_TYPE="daily"
    fi
    
    # 백업 실행
    if perform_backup $BACKUP_TYPE; then
        notify_slack "SUCCESS" "Database backup completed successfully (Type: $BACKUP_TYPE)"
        
        # 정리 작업
        cleanup_local_backups
        cleanup_s3_backups
        
        log "=== Database backup completed successfully ==="
        exit 0
    else
        notify_slack "FAILED" "Database backup failed! Please check immediately." "#ff0000"
        log "=== Database backup failed ==="
        exit 1
    fi
}

# 스크립트 실행
main
```

#### 2.2 Cron 스케줄 설정
```bash
# /etc/cron.d/glimpse-backup
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# 데이터베이스 백업 (매일 새벽 2시)
0 2 * * * postgres /opt/glimpse/scripts/backup-database.sh >> /var/log/glimpse/backup-cron.log 2>&1

# WAL 아카이브 확인 (매시간)
0 * * * * postgres /opt/glimpse/scripts/check-wal-archive.sh

# 백업 상태 리포트 (매일 오전 9시)
0 9 * * * postgres /opt/glimpse/scripts/backup-report.sh
```

### 3. 백업 검증

#### 3.1 자동 백업 검증 스크립트
```bash
#!/bin/bash
# /opt/glimpse/scripts/verify-backup.sh

set -euo pipefail

verify_backup() {
    local backup_file=$1
    local temp_db="glimpse_verify_$(date +%s)"
    
    echo "Verifying backup: $backup_file"
    
    # 임시 데이터베이스 생성
    createdb -h localhost -U postgres $temp_db
    
    # 백업 복원 시도
    if pg_restore -h localhost -U postgres -d $temp_db $backup_file; then
        # 기본 검증 쿼리
        TABLES=$(psql -h localhost -U postgres -d $temp_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
        USERS=$(psql -h localhost -U postgres -d $temp_db -t -c "SELECT COUNT(*) FROM users")
        
        echo "Verification passed: Tables=$TABLES, Users=$USERS"
        
        # 임시 데이터베이스 삭제
        dropdb -h localhost -U postgres $temp_db
        
        return 0
    else
        echo "Verification failed!"
        dropdb -h localhost -U postgres $temp_db 2>/dev/null || true
        return 1
    fi
}

# 최신 백업 파일 검증
LATEST_BACKUP=$(find /backup/postgres/daily -name "*.dump" -mtime -1 | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    verify_backup $LATEST_BACKUP
fi
```

## 🔁 복구 절차

### 1. 복구 시나리오별 대응

#### 1.1 논리적 손상 복구 (잘못된 데이터 수정/삭제)
```bash
#!/bin/bash
# /opt/glimpse/scripts/point-in-time-recovery.sh

# 특정 시점으로 복구
RECOVERY_TIME="2024-01-31 14:30:00"
BACKUP_FILE="/backup/postgres/daily/glimpse_daily_20240131_020000.dump"

# 1. 현재 상태 백업
pg_dump -h $DB_HOST -U $DB_USER -d glimpse_prod > pre_recovery_backup.sql

# 2. 새 데이터베이스에 복원
createdb -h $DB_HOST -U $DB_USER glimpse_recovery
pg_restore -h $DB_HOST -U $DB_USER -d glimpse_recovery $BACKUP_FILE

# 3. WAL 적용으로 특정 시점까지 복구
psql -h $DB_HOST -U $DB_USER -d glimpse_recovery << EOF
-- recovery.conf 설정 (PostgreSQL 12 이상은 postgresql.conf에)
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF

# 4. 데이터 검증
echo "복구된 데이터 검증:"
psql -h $DB_HOST -U $DB_USER -d glimpse_recovery -c "
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Matches', COUNT(*) FROM matches
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages;
"

# 5. 프로덕션 전환 준비
echo "복구가 완료되면 다음 명령어로 전환하세요:"
echo "ALTER DATABASE glimpse_prod RENAME TO glimpse_prod_old;"
echo "ALTER DATABASE glimpse_recovery RENAME TO glimpse_prod;"
```

#### 1.2 전체 데이터베이스 복구
```bash
#!/bin/bash
# /opt/glimpse/scripts/full-recovery.sh

set -euo pipefail

# 설정
BACKUP_SOURCE="s3"  # local 또는 s3
RECOVERY_DATE=$1    # YYYYMMDD 형식

if [ -z "$RECOVERY_DATE" ]; then
    echo "Usage: $0 YYYYMMDD"
    exit 1
fi

# S3에서 백업 목록 조회
echo "Available backups for $RECOVERY_DATE:"
aws s3 ls s3://glimpse-backups/database/daily/ | grep $RECOVERY_DATE

read -p "Enter backup filename: " BACKUP_FILE

# 백업 다운로드
echo "Downloading backup..."
aws s3 cp s3://glimpse-backups/database/daily/$BACKUP_FILE /tmp/
aws s3 cp s3://glimpse-backups/database/daily/${BACKUP_FILE}.sha256 /tmp/

# 체크섬 검증
echo "Verifying checksum..."
cd /tmp && sha256sum -c ${BACKUP_FILE}.sha256

# 서비스 중단
echo "Stopping application services..."
systemctl stop glimpse-api

# 기존 데이터베이스 백업
echo "Backing up current database..."
pg_dump -h $DB_HOST -U $DB_USER -d glimpse_prod > glimpse_prod_before_recovery.sql

# 데이터베이스 삭제 및 재생성
echo "Recreating database..."
dropdb -h $DB_HOST -U $DB_USER glimpse_prod
createdb -h $DB_HOST -U $DB_USER glimpse_prod

# 백업 복원
echo "Restoring backup..."
pg_restore -h $DB_HOST -U $DB_USER -d glimpse_prod -j 4 /tmp/$BACKUP_FILE

# 통계 업데이트
echo "Updating statistics..."
psql -h $DB_HOST -U $DB_USER -d glimpse_prod -c "ANALYZE;"

# 서비스 시작
echo "Starting application services..."
systemctl start glimpse-api

# 헬스체크
sleep 10
curl -f http://localhost:3000/health || echo "Health check failed!"

echo "Recovery completed!"
```

### 2. 재해 복구 (DR)

#### 2.1 대기 서버 설정 (Streaming Replication)
```bash
# Primary 서버 설정 (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
hot_standby = on

# Standby 서버 설정
# 1. 베이스 백업
pg_basebackup -h primary_host -D /var/lib/postgresql/data -U replicator -W -P -X stream

# 2. recovery.conf (PostgreSQL 11 이하) 또는 postgresql.auto.conf (PostgreSQL 12+)
standby_mode = 'on'
primary_conninfo = 'host=primary_host port=5432 user=replicator'
restore_command = 'cp /archive/%f %p'
```

#### 2.2 페일오버 절차
```bash
#!/bin/bash
# /opt/glimpse/scripts/failover.sh

# 1. Primary 서버 확인
if ! pg_isready -h $PRIMARY_HOST; then
    echo "Primary server is down! Initiating failover..."
    
    # 2. Standby를 Primary로 승격
    ssh $STANDBY_HOST "sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data"
    
    # 3. 애플리케이션 설정 변경
    sed -i "s/$PRIMARY_HOST/$STANDBY_HOST/g" /opt/glimpse/.env.production
    
    # 4. 애플리케이션 재시작
    systemctl restart glimpse-api
    
    # 5. DNS 업데이트 또는 로드 밸런서 설정 변경
    aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID \
        --change-batch file://failover-dns.json
    
    echo "Failover completed!"
fi
```

### 3. 부분 복구

#### 3.1 특정 테이블 복구
```bash
#!/bin/bash
# /opt/glimpse/scripts/restore-table.sh

TABLE_NAME=$1
BACKUP_FILE=$2

# 테이블만 추출
pg_restore -h $DB_HOST -U $DB_USER -d glimpse_temp -t $TABLE_NAME $BACKUP_FILE

# 데이터 비교
echo "Current data:"
psql -h $DB_HOST -U $DB_USER -d glimpse_prod -c "SELECT COUNT(*) FROM $TABLE_NAME"

echo "Backup data:"
psql -h $DB_HOST -U $DB_USER -d glimpse_temp -c "SELECT COUNT(*) FROM $TABLE_NAME"

# 복구 옵션
echo "1. Replace entire table"
echo "2. Merge missing records"
echo "3. Cancel"
read -p "Select option: " option

case $option in
    1)
        psql -h $DB_HOST -U $DB_USER -d glimpse_prod << EOF
        BEGIN;
        TRUNCATE TABLE $TABLE_NAME CASCADE;
        INSERT INTO $TABLE_NAME SELECT * FROM glimpse_temp.$TABLE_NAME;
        COMMIT;
EOF
        ;;
    2)
        psql -h $DB_HOST -U $DB_USER -d glimpse_prod << EOF
        BEGIN;
        INSERT INTO $TABLE_NAME 
        SELECT * FROM glimpse_temp.$TABLE_NAME t
        WHERE NOT EXISTS (
            SELECT 1 FROM $TABLE_NAME WHERE id = t.id
        );
        COMMIT;
EOF
        ;;
esac
```

#### 3.2 특정 사용자 데이터 복구
```bash
#!/bin/bash
# /opt/glimpse/scripts/restore-user-data.sh

USER_ID=$1
BACKUP_DATE=$2

# 사용자 관련 테이블 목록
TABLES=(
    "users"
    "user_profiles"
    "likes"
    "matches"
    "messages"
    "user_groups"
    "user_preferences"
)

# 임시 스키마 생성
psql -h $DB_HOST -U $DB_USER -d glimpse_prod -c "CREATE SCHEMA recovery_temp;"

# 각 테이블에서 사용자 데이터 복구
for table in "${TABLES[@]}"; do
    echo "Restoring $table for user $USER_ID..."
    
    # 백업에서 데이터 추출
    pg_restore -h $DB_HOST -U $DB_USER -d glimpse_prod \
        --schema=recovery_temp \
        -t $table \
        $BACKUP_FILE
    
    # 사용자 데이터만 복사
    case $table in
        "users"|"user_profiles"|"user_preferences")
            WHERE_CLAUSE="WHERE id = '$USER_ID'"
            ;;
        "likes")
            WHERE_CLAUSE="WHERE from_user_id = '$USER_ID' OR to_user_id = '$USER_ID'"
            ;;
        "matches")
            WHERE_CLAUSE="WHERE user1_id = '$USER_ID' OR user2_id = '$USER_ID'"
            ;;
        "messages")
            WHERE_CLAUSE="WHERE sender_id = '$USER_ID' OR receiver_id = '$USER_ID'"
            ;;
        "user_groups")
            WHERE_CLAUSE="WHERE user_id = '$USER_ID'"
            ;;
    esac
    
    psql -h $DB_HOST -U $DB_USER -d glimpse_prod << EOF
    INSERT INTO $table 
    SELECT * FROM recovery_temp.$table 
    $WHERE_CLAUSE
    ON CONFLICT (id) DO UPDATE SET
        updated_at = EXCLUDED.updated_at;
EOF
done

# 임시 스키마 삭제
psql -h $DB_HOST -U $DB_USER -d glimpse_prod -c "DROP SCHEMA recovery_temp CASCADE;"
```

## 📊 백업 모니터링

### 1. 백업 상태 대시보드
```sql
-- 백업 모니터링 뷰
CREATE VIEW v_backup_status AS
SELECT 
    backup_date,
    backup_type,
    file_size_mb,
    duration_seconds,
    status,
    error_message,
    s3_uploaded,
    verified
FROM backup_logs
WHERE backup_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY backup_date DESC;

-- 백업 통계
CREATE VIEW v_backup_statistics AS
SELECT 
    backup_type,
    COUNT(*) as total_backups,
    AVG(file_size_mb) as avg_size_mb,
    AVG(duration_seconds) as avg_duration_sec,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM backup_logs
WHERE backup_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY backup_type;
```

### 2. 알림 설정
```bash
#!/bin/bash
# /opt/glimpse/scripts/backup-monitor.sh

# 최근 백업 확인
LAST_BACKUP=$(psql -h $DB_HOST -U $DB_USER -d glimpse_prod -t -c "
    SELECT MAX(backup_date) 
    FROM backup_logs 
    WHERE status = 'SUCCESS' AND backup_type = 'daily'
")

# 24시간 이상 백업이 없으면 알림
HOURS_SINCE_BACKUP=$(psql -h $DB_HOST -U $DB_USER -d glimpse_prod -t -c "
    SELECT EXTRACT(EPOCH FROM (NOW() - MAX(backup_date)))/3600 
    FROM backup_logs 
    WHERE status = 'SUCCESS' AND backup_type = 'daily'
")

if (( $(echo "$HOURS_SINCE_BACKUP > 24" | bc -l) )); then
    # PagerDuty 알림
    curl -X POST https://events.pagerduty.com/v2/enqueue \
        -H 'Content-Type: application/json' \
        -d "{
            \"routing_key\": \"$PAGERDUTY_KEY\",
            \"event_action\": \"trigger\",
            \"payload\": {
                \"summary\": \"Database backup missing for >24 hours\",
                \"severity\": \"error\",
                \"source\": \"glimpse-backup-monitor\"
            }
        }"
fi
```

## 🔧 문제 해결

### 일반적인 문제와 해결 방법

#### 1. 백업 실패
```bash
# 디스크 공간 확인
df -h /backup

# PostgreSQL 로그 확인
tail -f /var/log/postgresql/postgresql-*.log

# 권한 확인
ls -la /backup/postgres/

# 연결 테스트
pg_isready -h $DB_HOST -U $DB_USER
```

#### 2. 복원 실패
```bash
# 에러 메시지 확인
pg_restore -v -h $DB_HOST -U $DB_USER -d glimpse_test backup.dump 2>&1 | tee restore.log

# 의존성 문제 해결
pg_restore --no-owner --no-privileges --no-tablespaces

# 부분 복원
pg_restore --section=pre-data
pg_restore --section=data
pg_restore --section=post-data
```

#### 3. 성능 문제
```bash
# 병렬 처리 사용
pg_dump -j 4  # 4개 병렬 작업
pg_restore -j 4

# 압축 레벨 조정
pg_dump --compress=6  # 기본값 9보다 빠름

# 대용량 테이블 제외
pg_dump --exclude-table=audit_logs
```

## 📋 체크리스트

### 일일 점검
- [ ] 백업 작업 성공 여부 확인
- [ ] 백업 파일 크기 정상 여부
- [ ] S3 업로드 완료 확인
- [ ] 디스크 공간 확인

### 주간 점검
- [ ] 백업 복원 테스트
- [ ] WAL 아카이브 상태 확인
- [ ] 백업 로그 분석
- [ ] 스토리지 사용량 추세 확인

### 월간 점검
- [ ] 전체 복구 시뮬레이션
- [ ] DR 사이트 동기화 확인
- [ ] 백업 정책 검토
- [ ] 복구 절차 문서 업데이트

## 🚨 비상 연락처

### 데이터베이스 팀
- **DBA Lead**: +82-10-XXXX-XXXX
- **백업 담당자**: +82-10-XXXX-XXXX
- **야간 당직**: +82-10-XXXX-XXXX

### 외부 지원
- **AWS Support**: https://console.aws.amazon.com/support
- **PostgreSQL 컨설팅**: support@postgresql.kr