-- 계정 삭제 기능을 위한 데이터베이스 변경

-- 1. 삭제 상태 enum 생성
CREATE TYPE "DeletionStatus" AS ENUM ('ACTIVE', 'DELETION_REQUESTED', 'PERMANENTLY_DELETED');

-- 2. User 테이블에 필드 추가
ALTER TABLE "users" ADD COLUMN "deletionStatus" "DeletionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN "scheduledDeletionAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX "users_deletion_status_idx" ON "users"("deletionStatus");
CREATE INDEX "users_scheduled_deletion_at_idx" ON "users"("scheduledDeletionAt");

-- 4. 기존 deleted 데이터 마이그레이션
UPDATE "users" 
SET "deletionStatus" = 'PERMANENTLY_DELETED',
    "deletionRequestedAt" = "deletedAt",
    "scheduledDeletionAt" = "deletedAt"
WHERE "deletedAt" IS NOT NULL;