-- 통합 관심 등록 시스템 마이그레이션
-- 기존 interest_searches 테이블을 interest_registrations로 대체

-- 1. 새로운 Enum 타입 생성
CREATE TYPE "RegistrationType" AS ENUM ('MY_INFO', 'LOOKING_FOR');
CREATE TYPE "MatchPairStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHATTING', 'EXPIRED', 'REJECTED');

-- 2. interest_registrations 테이블 생성
CREATE TABLE "interest_registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- 등록 구분
    "registrationType" "RegistrationType" NOT NULL,
    "type" "InterestType" NOT NULL,
    "status" "SearchStatus" NOT NULL DEFAULT 'ACTIVE',
    
    -- 관계 의도
    "relationshipIntent" "RelationshipIntent" NOT NULL DEFAULT 'ROMANTIC',
    
    -- 암호화된 해시 필드 (매칭용)
    "primaryHash" TEXT NOT NULL,
    "secondaryHash" TEXT,
    "tertiaryHash" TEXT,
    
    -- 암호화된 개인정보
    "encryptedData" TEXT NOT NULL,
    "encryptedIV" TEXT NOT NULL,
    "encryptedTag" TEXT NOT NULL,
    
    -- 마스킹된 표시값
    "displayValue" TEXT NOT NULL,
    
    -- 검색/필터용 비식별 정보
    "phoneCountryCode" TEXT,
    "phoneLastDigits" TEXT,
    "emailDomain" TEXT,
    "emailFirstChar" TEXT,
    "socialPlatform" TEXT,
    "birthYear" INTEGER,
    "ageRange" TEXT,
    "locationCity" TEXT,
    "locationRadius" INTEGER,
    "groupId" TEXT,
    "companyDomain" TEXT,
    "schoolName" TEXT,
    "partTimeCategory" TEXT,
    "platformName" TEXT,
    "gameTitle" TEXT,
    
    -- 메타데이터
    "deviceId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "cooldownEndsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    
    -- 타임스탬프
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "interest_registrations_pkey" PRIMARY KEY ("id")
);

-- 3. matched_pairs 테이블 생성
CREATE TABLE "matched_pairs" (
    "id" TEXT NOT NULL,
    
    -- 양방향 매칭 정보
    "registration1Id" TEXT NOT NULL,
    "registration2Id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    
    "matchType" "InterestType" NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 100,
    
    -- 상태 관리
    "status" "MatchPairStatus" NOT NULL DEFAULT 'PENDING',
    "user1Confirmed" BOOLEAN NOT NULL DEFAULT false,
    "user2Confirmed" BOOLEAN NOT NULL DEFAULT false,
    
    -- 알림 상태
    "user1Notified" BOOLEAN NOT NULL DEFAULT false,
    "user2Notified" BOOLEAN NOT NULL DEFAULT false,
    
    -- 채팅방 연결
    "chatRoomId" TEXT,
    "chatCreatedAt" TIMESTAMP(3),
    
    -- 매칭 메타데이터
    "matchMethod" TEXT,
    "matchReason" TEXT,
    
    -- 타임스탬프
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    
    CONSTRAINT "matched_pairs_pkey" PRIMARY KEY ("id")
);

-- 4. encryption_keys 테이블 생성 (선택적)
CREATE TABLE "encryption_keys" (
    "id" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "keyHash" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    
    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- 5. 인덱스 생성

-- interest_registrations 인덱스
CREATE INDEX "interest_registrations_type_primaryHash_registrationType_status_idx" 
    ON "interest_registrations"("type", "primaryHash", "registrationType", "status");
CREATE INDEX "interest_registrations_userId_registrationType_status_idx" 
    ON "interest_registrations"("userId", "registrationType", "status");
CREATE INDEX "interest_registrations_relationshipIntent_status_idx" 
    ON "interest_registrations"("relationshipIntent", "status");
CREATE INDEX "interest_registrations_emailDomain_status_idx" 
    ON "interest_registrations"("emailDomain", "status");
CREATE INDEX "interest_registrations_companyDomain_status_idx" 
    ON "interest_registrations"("companyDomain", "status");
CREATE INDEX "interest_registrations_groupId_status_idx" 
    ON "interest_registrations"("groupId", "status");
CREATE INDEX "interest_registrations_expiresAt_idx" 
    ON "interest_registrations"("expiresAt");
CREATE INDEX "interest_registrations_cooldownEndsAt_idx" 
    ON "interest_registrations"("cooldownEndsAt");

-- matched_pairs 인덱스
CREATE INDEX "matched_pairs_user1Id_status_idx" ON "matched_pairs"("user1Id", "status");
CREATE INDEX "matched_pairs_user2Id_status_idx" ON "matched_pairs"("user2Id", "status");
CREATE INDEX "matched_pairs_status_matchedAt_idx" ON "matched_pairs"("status", "matchedAt");
CREATE INDEX "matched_pairs_chatRoomId_idx" ON "matched_pairs"("chatRoomId");

-- encryption_keys 인덱스
CREATE UNIQUE INDEX "encryption_keys_keyVersion_key" ON "encryption_keys"("keyVersion");
CREATE INDEX "encryption_keys_isActive_idx" ON "encryption_keys"("isActive");

-- 6. 유니크 제약조건
CREATE UNIQUE INDEX "interest_registrations_userId_type_primaryHash_registrationType_key" 
    ON "interest_registrations"("userId", "type", "primaryHash", "registrationType");
CREATE UNIQUE INDEX "matched_pairs_registration1Id_registration2Id_key" 
    ON "matched_pairs"("registration1Id", "registration2Id");

-- 7. 외래키 제약조건
ALTER TABLE "interest_registrations" 
    ADD CONSTRAINT "interest_registrations_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "matched_pairs" 
    ADD CONSTRAINT "matched_pairs_registration1Id_fkey" 
    FOREIGN KEY ("registration1Id") REFERENCES "interest_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matched_pairs" 
    ADD CONSTRAINT "matched_pairs_registration2Id_fkey" 
    FOREIGN KEY ("registration2Id") REFERENCES "interest_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matched_pairs" 
    ADD CONSTRAINT "matched_pairs_user1Id_fkey" 
    FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matched_pairs" 
    ADD CONSTRAINT "matched_pairs_user2Id_fkey" 
    FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. 기존 데이터 마이그레이션 (선택적)
-- 기존 interest_searches 데이터를 새 테이블로 이전
/*
INSERT INTO interest_registrations (
    id, userId, registrationType, type, status, relationshipIntent,
    primaryHash, displayValue, encryptedData, encryptedIV, encryptedTag,
    createdAt, updatedAt, expiresAt
)
SELECT 
    id,
    userId,
    'LOOKING_FOR', -- 기존 데이터는 모두 찾는 정보로 간주
    type,
    status,
    COALESCE((metadata->>'relationshipIntent')::text, 'ROMANTIC')::"RelationshipIntent",
    -- 해시값 생성 (실제로는 애플리케이션에서 처리)
    encode(digest(value, 'sha256'), 'hex'),
    value, -- 임시로 원본값을 표시값으로
    '{}', -- 암호화된 데이터 (나중에 애플리케이션에서 처리)
    '', -- IV
    '', -- Tag
    createdAt,
    updatedAt,
    expiresAt
FROM interest_searches
WHERE status = 'ACTIVE';
*/

-- 9. 트리거 생성 (updatedAt 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interest_registrations_updated_at 
    BEFORE UPDATE ON "interest_registrations" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matched_pairs_updated_at 
    BEFORE UPDATE ON "matched_pairs" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 권한 설정 (필요한 경우)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON interest_registrations TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON matched_pairs TO app_user;
-- GRANT SELECT ON encryption_keys TO app_user;