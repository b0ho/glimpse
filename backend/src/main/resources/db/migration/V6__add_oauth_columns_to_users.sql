-- ============================================================================
-- V6: Users 테이블에 OAuth 컬럼 추가
-- Google, Kakao, Naver 소셜 로그인 지원
-- ============================================================================

-- OAuth ID 컬럼 추가 (provider_providerId 형식)
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255) UNIQUE;

-- OAuth 제공자 컬럼 추가 (google, kakao, naver)
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);

-- 코멘트 추가
COMMENT ON COLUMN users.oauth_id IS 'OAuth 고유 ID (provider_providerId 형식, 예: google_123456789)';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth 제공자 (google, kakao, naver)';

