-- ============================================================================
-- V3: Extend Schema to Match Entity Definitions
-- Description: 엔티티와 DB 스키마 일치를 위한 확장 마이그레이션
-- Date: 2025-01-14
-- ============================================================================

-- ============================================================================
-- 1. user_like 테이블 확장
-- ============================================================================
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS is_super_like BOOLEAN DEFAULT false;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT false;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS is_matched BOOLEAN DEFAULT false;
ALTER TABLE user_like ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP;

-- ============================================================================
-- 2. message_reaction 테이블 - 컬럼명 변경
-- ============================================================================
ALTER TABLE message_reaction RENAME COLUMN reaction TO emoji;

-- ============================================================================
-- 3. notification 테이블 확장
-- ============================================================================
-- 컬럼명 변경: message -> content
ALTER TABLE notification RENAME COLUMN message TO content;
-- data 컬럼을 action_data로 변경
ALTER TABLE notification RENAME COLUMN data TO action_data;
-- 추가 컬럼
ALTER TABLE notification ADD COLUMN IF NOT EXISTS is_pushed BOOLEAN DEFAULT false;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);
ALTER TABLE notification ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE notification ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- ============================================================================
-- 4. payment 테이블 확장
-- ============================================================================
-- 컬럼명 변경: payment_method -> method
ALTER TABLE payment RENAME COLUMN payment_method TO method;
-- 추가 컬럼
ALTER TABLE payment ADD COLUMN IF NOT EXISTS product_type VARCHAR(100);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS product_id VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS credits_purchased INTEGER;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS toss_payment_key VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS kakao_tid VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS external_reference VARCHAR(255);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- 5. subscription 테이블 확장
-- ============================================================================
-- 컬럼명 변경
ALTER TABLE subscription RENAME COLUMN type TO plan;
ALTER TABLE subscription RENAME COLUMN start_date TO started_at;
ALTER TABLE subscription RENAME COLUMN end_date TO expires_at;
-- 추가 컬럼
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KRW';
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS external_reference VARCHAR(255);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- 6. group_member 테이블 확장
-- ============================================================================
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS verification_method VARCHAR(100);
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS left_at TIMESTAMP;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS contribution_points INTEGER DEFAULT 0;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE group_member ADD COLUMN IF NOT EXISTS notification_settings JSONB;

-- ============================================================================
-- 7. group_invite 테이블 확장
-- ============================================================================
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS invitee_phone VARCHAR(50);
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS invitee_email VARCHAR(255);
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS invite_code VARCHAR(100) UNIQUE;
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP;
ALTER TABLE group_invite ADD COLUMN IF NOT EXISTS message TEXT;

-- ============================================================================
-- 8. chat_message 테이블 확장 (엔티티에 있는 추가 필드)
-- ============================================================================
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS media_url VARCHAR(500);
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- 인덱스 추가 (성능 최적화)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_like_is_matched ON user_like(is_matched);
CREATE INDEX IF NOT EXISTS idx_user_like_expires_at ON user_like(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_expires_at ON notification(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_expires_at ON subscription(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_member_is_active ON group_member(is_active);
CREATE INDEX IF NOT EXISTS idx_group_invite_invite_code ON group_invite(invite_code);


