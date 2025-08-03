-- 즉석 모임 기능을 위한 마이그레이션 SQL
-- PostgreSQL 기준

-- 프로필 타입 열거형
CREATE TYPE "ProfileType" AS ENUM ('OFFICIAL', 'CREATED', 'INSTANT', 'LOCATION');
CREATE TYPE "AnonymityLevel" AS ENUM ('FULL', 'PARTIAL', 'VERIFIED', 'REVEALED');

-- 사용자 프로필 테이블
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileType" "ProfileType" NOT NULL,
    "groupId" TEXT,
    "nickname" TEXT NOT NULL,
    "bio" TEXT,
    "profileData" JSONB,
    "anonymityLevel" "AnonymityLevel" NOT NULL DEFAULT 'PARTIAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- 즉석 모임 테이블
CREATE TABLE "instant_meetings" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "location" JSONB,
    "maxMembers" INTEGER NOT NULL DEFAULT 30,
    "featureCategories" TEXT[],
    "customCategories" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instant_meetings_pkey" PRIMARY KEY ("id")
);

-- 즉석 프로필 테이블
CREATE TABLE "instant_profiles" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "temporaryId" TEXT NOT NULL,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instant_profiles_pkey" PRIMARY KEY ("id")
);

-- 즉석 호감 표현 테이블
CREATE TABLE "instant_interests" (
    "id" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "targetFeatures" JSONB NOT NULL,
    "matchedProfiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instant_interests_pkey" PRIMARY KEY ("id")
);

-- 즉석 매칭 테이블
CREATE TABLE "instant_matches" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "profile1Id" TEXT NOT NULL,
    "profile2Id" TEXT NOT NULL,
    "chatRoomId" TEXT,
    "revealStatus" JSONB,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instant_matches_pkey" PRIMARY KEY ("id")
);

-- 프로필 활동 테이블
CREATE TABLE "profile_activities" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_activities_pkey" PRIMARY KEY ("id")
);

-- 유니크 제약조건
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_profileType_groupId_key" UNIQUE("userId", "profileType", "groupId");
ALTER TABLE "instant_meetings" ADD CONSTRAINT "instant_meetings_code_key" UNIQUE("code");
ALTER TABLE "instant_profiles" ADD CONSTRAINT "instant_profiles_userProfileId_key" UNIQUE("userProfileId");
ALTER TABLE "instant_profiles" ADD CONSTRAINT "instant_profiles_userProfileId_meetingId_key" UNIQUE("userProfileId", "meetingId");
ALTER TABLE "instant_matches" ADD CONSTRAINT "instant_matches_profile1Id_profile2Id_key" UNIQUE("profile1Id", "profile2Id");

-- 인덱스
CREATE INDEX "user_profiles_userId_profileType_idx" ON "user_profiles"("userId", "profileType");
CREATE INDEX "user_profiles_groupId_profileType_idx" ON "user_profiles"("groupId", "profileType");
CREATE INDEX "instant_meetings_code_idx" ON "instant_meetings"("code");
CREATE INDEX "instant_meetings_creatorId_idx" ON "instant_meetings"("creatorId");
CREATE INDEX "instant_meetings_expiresAt_idx" ON "instant_meetings"("expiresAt");
CREATE INDEX "instant_profiles_meetingId_isActive_idx" ON "instant_profiles"("meetingId", "isActive");
CREATE INDEX "instant_interests_fromProfileId_idx" ON "instant_interests"("fromProfileId");
CREATE INDEX "instant_interests_meetingId_idx" ON "instant_interests"("meetingId");
CREATE INDEX "instant_matches_meetingId_idx" ON "instant_matches"("meetingId");
CREATE INDEX "profile_activities_profileId_activityType_idx" ON "profile_activities"("profileId", "activityType");
CREATE INDEX "profile_activities_createdAt_idx" ON "profile_activities"("createdAt");

-- 외래키 제약조건
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "instant_meetings" ADD CONSTRAINT "instant_meetings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instant_profiles" ADD CONSTRAINT "instant_profiles_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_profiles" ADD CONSTRAINT "instant_profiles_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "instant_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_interests" ADD CONSTRAINT "instant_interests_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "instant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_interests" ADD CONSTRAINT "instant_interests_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "instant_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_matches" ADD CONSTRAINT "instant_matches_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "instant_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_matches" ADD CONSTRAINT "instant_matches_profile1Id_fkey" FOREIGN KEY ("profile1Id") REFERENCES "instant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instant_matches" ADD CONSTRAINT "instant_matches_profile2Id_fkey" FOREIGN KEY ("profile2Id") REFERENCES "instant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "profile_activities" ADD CONSTRAINT "profile_activities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 특징 기반 검색을 위한 GIN 인덱스
CREATE INDEX "instant_profiles_features_idx" ON "instant_profiles" USING GIN ("features" jsonb_path_ops);

-- 매칭 스코어 계산 함수
CREATE OR REPLACE FUNCTION calculate_feature_match_score(
  target_features JSONB,
  candidate_features JSONB,
  weights JSONB DEFAULT '{"upperColor": 0.25, "lowerType": 0.20, "glasses": 0.15, "hairLength": 0.15}'::JSONB
) RETURNS FLOAT AS $$
DECLARE
  score FLOAT := 0;
  total_weight FLOAT := 0;
  key TEXT;
  weight FLOAT;
BEGIN
  FOR key, weight IN 
    SELECT * FROM jsonb_each_text(weights)
  LOOP
    IF target_features->key IS NOT NULL 
       AND candidate_features->key IS NOT NULL THEN
      IF target_features->key = candidate_features->key THEN
        score := score + weight::FLOAT;
      END IF;
      total_weight := total_weight + weight::FLOAT;
    END IF;
  END LOOP;
  
  RETURN CASE 
    WHEN total_weight > 0 THEN score / total_weight 
    ELSE 0 
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 자동 만료 처리를 위한 트리거
CREATE OR REPLACE FUNCTION auto_expire_instant_data() RETURNS TRIGGER AS $$
BEGIN
  -- 만료된 즉석 모임 비활성화
  UPDATE instant_meetings 
  SET "isActive" = false 
  WHERE "expiresAt" < NOW() AND "isActive" = true;
  
  -- 만료된 프로필 비활성화
  UPDATE user_profiles 
  SET "isActive" = false 
  WHERE "expiresAt" < NOW() AND "isActive" = true AND "profileType" = 'INSTANT';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 매시간 실행될 크론 작업 (pg_cron 확장 필요)
-- SELECT cron.schedule('expire-instant-data', '0 * * * *', 'SELECT auto_expire_instant_data();');