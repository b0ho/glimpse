-- ============================================================================
-- V5: Refresh Tokens 테이블 추가
-- JWT 기반 인증 시스템을 위한 Refresh Token 저장소
-- ============================================================================

-- Refresh Tokens 테이블
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_token_revoked ON refresh_tokens(revoked);

-- 만료된 토큰 자동 삭제를 위한 함수 (PostgreSQL)
-- 매일 자정에 실행하도록 크론잡으로 설정 가능
-- SELECT delete_expired_refresh_tokens();

CREATE OR REPLACE FUNCTION delete_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON TABLE refresh_tokens IS 'JWT Refresh Token 저장소';
COMMENT ON COLUMN refresh_tokens.id IS '고유 식별자 (UUID)';
COMMENT ON COLUMN refresh_tokens.user_id IS '사용자 ID (FK)';
COMMENT ON COLUMN refresh_tokens.token IS 'Refresh Token 값';
COMMENT ON COLUMN refresh_tokens.device_info IS '디바이스 정보';
COMMENT ON COLUMN refresh_tokens.ip_address IS '접속 IP 주소';
COMMENT ON COLUMN refresh_tokens.user_agent IS '브라우저/앱 User-Agent';
COMMENT ON COLUMN refresh_tokens.expires_at IS '만료 시간';
COMMENT ON COLUMN refresh_tokens.created_at IS '생성 시간';
COMMENT ON COLUMN refresh_tokens.last_used_at IS '마지막 사용 시간';
COMMENT ON COLUMN refresh_tokens.revoked IS '폐기 여부';

