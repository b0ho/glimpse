-- ============================================================================
-- V4: Enrich Test Data for Extended Schema
-- Description: V3에서 추가된 컬럼들에 대한 풍부한 테스트 데이터
-- Date: 2025-01-14
-- ============================================================================

-- ============================================================================
-- 1. user_like 확장 데이터 업데이트
-- ============================================================================

-- 기존 좋아요에 확장 필드 추가
UPDATE user_like SET 
    is_super_like = true,
    is_anonymous = false,
    message = '프로필이 정말 인상적이에요! 같이 커피 한잔 어떠세요?',
    is_seen = true,
    seen_at = NOW() - INTERVAL '29 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '1 month'
WHERE id = 'like-001';

UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = false,
    is_seen = true,
    seen_at = NOW() - INTERVAL '29 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '1 month'
WHERE id = 'like-002';

UPDATE user_like SET 
    is_super_like = true,
    is_anonymous = true,
    message = '같은 회사라니 반가워요 🎉',
    is_seen = true,
    seen_at = NOW() - INTERVAL '13 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '2 weeks'
WHERE id = 'like-003';

UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = true,
    is_seen = true,
    seen_at = NOW() - INTERVAL '13 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '2 weeks'
WHERE id = 'like-004';

UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = false,
    message = '서강대 선배님 반갑습니다!',
    is_seen = true,
    seen_at = NOW() - INTERVAL '6 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '1 week'
WHERE id = 'like-005';

UPDATE user_like SET 
    is_super_like = true,
    is_anonymous = false,
    is_seen = true,
    seen_at = NOW() - INTERVAL '6 days',
    is_matched = true,
    matched_at = NOW() - INTERVAL '1 week'
WHERE id = 'like-006';

-- 대기 중인 좋아요에 만료 시간 설정
UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = true,
    expires_at = NOW() + INTERVAL '4 days',
    is_seen = false
WHERE id = 'like-007';

UPDATE user_like SET 
    is_super_like = true,
    is_anonymous = true,
    message = '안녕하세요! 프로필 보고 관심이 생겼어요 ☺️',
    expires_at = NOW() + INTERVAL '2 days',
    is_seen = true,
    seen_at = NOW() - INTERVAL '1 day'
WHERE id = 'like-008';

UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = true,
    expires_at = NOW() + INTERVAL '5 days',
    is_seen = false
WHERE id = 'like-009';

UPDATE user_like SET 
    is_super_like = false,
    is_anonymous = true,
    expires_at = NOW() + INTERVAL '6 days',
    is_seen = false
WHERE id = 'like-010';

UPDATE user_like SET 
    is_super_like = true,
    is_anonymous = true,
    message = '영화 덕후 그룹에서 봤어요! 취향이 비슷한 것 같아요',
    expires_at = NOW() + INTERVAL '6 days' + INTERVAL '20 hours',
    is_seen = false
WHERE id = 'like-011';

-- 추가 좋아요 데이터 (다양한 상태)
INSERT INTO user_like (id, sender_id, receiver_id, group_id, status, liked_at, is_super_like, is_anonymous, message, is_seen, seen_at, expires_at, is_matched, matched_at, created_at, updated_at) VALUES
-- 만료된 좋아요
('like-012', 'user-008', 'user-016', 'group-013', 'EXPIRED', NOW() - INTERVAL '10 days', false, true, null, true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days', false, null, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
-- 거절된 좋아요
('like-013', 'user-010', 'user-020', 'group-012', 'REJECTED', NOW() - INTERVAL '5 days', false, true, null, true, NOW() - INTERVAL '4 days', null, false, null, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
-- 새로운 대기 좋아요들
('like-014', 'user-012', 'user-002', 'group-010', 'PENDING', NOW() - INTERVAL '6 hours', true, true, '영화 취향이 비슷해 보여요! 같이 영화 보러 가요 🎬', false, null, NOW() + INTERVAL '6 days' + INTERVAL '18 hours', false, null, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('like-015', 'user-016', 'user-006', 'group-014', 'PENDING', NOW() - INTERVAL '12 hours', false, true, null, false, null, NOW() + INTERVAL '6 days' + INTERVAL '12 hours', false, null, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
('like-016', 'user-019', 'user-009', 'group-010', 'PENDING', NOW() - INTERVAL '2 hours', true, true, '영화 추천해주세요! 📚', false, null, NOW() + INTERVAL '6 days' + INTERVAL '22 hours', false, null, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

-- ============================================================================
-- 2. notification 확장 데이터 업데이트
-- ============================================================================

-- 기존 알림 업데이트 (V3에서 message → content로 변경됨)
UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-001',
    image_url = 'https://i.pravatar.cc/300?img=5'
WHERE id = 'notif-001';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-001',
    image_url = 'https://i.pravatar.cc/300?img=12'
WHERE id = 'notif-002';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '2 seconds',
    action_url = '/chat/match-001',
    image_url = 'https://i.pravatar.cc/300?img=5'
WHERE id = 'notif-003';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-002',
    image_url = 'https://i.pravatar.cc/300?img=10'
WHERE id = 'notif-004';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-002',
    image_url = 'https://i.pravatar.cc/300?img=14'
WHERE id = 'notif-005';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-003',
    image_url = 'https://i.pravatar.cc/300?img=27'
WHERE id = 'notif-006';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/matches/match-003',
    image_url = 'https://i.pravatar.cc/300?img=18'
WHERE id = 'notif-007';

-- 읽지 않은 알림 업데이트
UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/likes',
    expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'notif-008';

UPDATE notification SET 
    is_pushed = true,
    pushed_at = created_at + INTERVAL '1 second',
    action_url = '/likes',
    expires_at = NOW() + INTERVAL '4 days'
WHERE id = 'notif-009';

UPDATE notification SET 
    is_pushed = false,
    action_url = '/chat/match-001',
    image_url = 'https://i.pravatar.cc/300?img=5'
WHERE id = 'notif-010';

-- 추가 알림 데이터
INSERT INTO notification (id, user_id, type, title, content, is_read, read_at, is_pushed, pushed_at, action_url, image_url, expires_at, created_at) VALUES
-- 시스템 알림
('notif-011', 'user-001', 'SYSTEM', '프리미엄 갱신 알림', '프리미엄 구독이 3일 후 만료됩니다. 지금 갱신하세요!', false, null, true, NOW() - INTERVAL '1 day', '/subscription', null, NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('notif-012', 'user-003', 'SYSTEM', '새로운 기능 안내', '슈퍼 좋아요 기능이 추가되었습니다! 지금 확인해보세요.', true, NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '3 days', '/features', null, null, NOW() - INTERVAL '3 days'),
-- 그룹 관련 알림
('notif-013', 'user-005', 'GROUP', '그룹 가입 승인', '게임 좋아하는 사람들 그룹 가입이 승인되었습니다', true, NOW() - INTERVAL '1 month', true, NOW() - INTERVAL '1 month', '/groups/group-013', 'https://i.pravatar.cc/300?img=16', null, NOW() - INTERVAL '1 month'),
('notif-014', 'user-018', 'GROUP', '새 멤버 가입', '강남 러닝 크루에 새로운 멤버가 가입했습니다', true, NOW() - INTERVAL '2 months', true, NOW() - INTERVAL '2 months', '/groups/group-014', null, null, NOW() - INTERVAL '2 months'),
-- 슈퍼 좋아요 알림
('notif-015', 'user-014', 'SUPER_LIKE', '슈퍼 좋아요를 받았어요! 💖', '누군가 회원님에게 슈퍼 좋아요를 보냈습니다', false, null, true, NOW() - INTERVAL '5 days', '/likes', null, NOW() + INTERVAL '2 days', NOW() - INTERVAL '5 days'),
-- 프로필 조회 알림 (프리미엄)
('notif-016', 'user-009', 'PROFILE_VIEW', '프로필 조회', '3명이 회원님의 프로필을 조회했습니다', true, NOW() - INTERVAL '1 day', true, NOW() - INTERVAL '2 days', '/profile/viewers', null, null, NOW() - INTERVAL '2 days'),
-- 활동 알림
('notif-017', 'user-006', 'ACTIVITY', '오늘의 추천', '오늘의 추천 프로필이 도착했습니다! 지금 확인하세요', false, null, true, NOW() - INTERVAL '4 hours', '/discover', null, NOW() + INTERVAL '20 hours', NOW() - INTERVAL '4 hours'),
('notif-018', 'user-016', 'ACTIVITY', '주간 리포트', '지난 주 활동 리포트가 준비되었습니다', true, NOW() - INTERVAL '3 days', true, NOW() - INTERVAL '4 days', '/reports/weekly', null, null, NOW() - INTERVAL '4 days');

-- ============================================================================
-- 3. payment 확장 데이터 업데이트
-- ============================================================================

-- 기존 결제에 확장 필드 추가
UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-001',
    product_name = '프리미엄 월간 구독',
    stripe_payment_intent_id = 'pi_test_001',
    toss_payment_key = 'toss_pay_001',
    paid_at = created_at,
    metadata = '{"source": "mobile_app", "campaign": "new_year_promo"}'::jsonb
WHERE id = 'pay-001';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-002',
    product_name = '프리미엄 월간 구독',
    kakao_tid = 'kakao_tid_001',
    paid_at = created_at,
    metadata = '{"source": "mobile_app"}'::jsonb
WHERE id = 'pay-002';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-003',
    product_name = '베이직 구독',
    paid_at = created_at,
    metadata = '{"source": "web"}'::jsonb
WHERE id = 'pay-003';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-004',
    product_name = '프리미엄 연간 구독',
    toss_payment_key = 'toss_pay_004',
    paid_at = created_at,
    metadata = '{"source": "mobile_app", "discount": "yearly_30"}'::jsonb
WHERE id = 'pay-004';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-005',
    product_name = '프리미엄 월간 구독',
    kakao_tid = 'kakao_tid_005',
    paid_at = created_at
WHERE id = 'pay-005';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-006',
    product_name = '프리미엄 월간 구독',
    toss_payment_key = 'toss_pay_006',
    paid_at = created_at
WHERE id = 'pay-006';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-007',
    product_name = '베이직 구독',
    kakao_tid = 'kakao_tid_007',
    paid_at = created_at
WHERE id = 'pay-007';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_id = 'sub-008',
    product_name = '프리미엄 월간 구독',
    paid_at = created_at
WHERE id = 'pay-008';

UPDATE payment SET 
    product_type = 'SUBSCRIPTION',
    product_name = '프리미엄 월간 구독 갱신',
    toss_payment_key = 'toss_pay_009',
    paid_at = created_at,
    metadata = '{"renewal": true}'::jsonb
WHERE id = 'pay-009';

UPDATE payment SET 
    product_type = 'CREDITS',
    product_name = '크레딧 5개 패키지',
    credits_purchased = 5,
    kakao_tid = 'kakao_tid_010',
    paid_at = created_at
WHERE id = 'pay-010';

-- 추가 결제 데이터 (다양한 상태)
INSERT INTO payment (id, user_id, amount, currency, status, method, product_type, product_id, product_name, credits_purchased, toss_payment_key, kakao_tid, paid_at, failed_at, failure_reason, refunded_at, refund_amount, refund_reason, metadata, created_at) VALUES
-- 크레딧 구매
('pay-011', 'user-002', 2500.00, 'KRW', 'COMPLETED', 'TOSS', 'CREDITS', null, '크레딧 5개 패키지', 5, 'toss_pay_011', null, NOW() - INTERVAL '1 week', null, null, null, null, null, '{"source": "mobile_app"}'::jsonb, NOW() - INTERVAL '1 week'),
('pay-012', 'user-007', 9000.00, 'KRW', 'COMPLETED', 'KAKAO_PAY', 'CREDITS', null, '크레딧 20개 패키지', 20, null, 'kakao_tid_012', NOW() - INTERVAL '3 days', null, null, null, null, null, null, NOW() - INTERVAL '3 days'),
-- 실패한 결제
('pay-013', 'user-005', 9900.00, 'KRW', 'FAILED', 'CARD', 'SUBSCRIPTION', null, '프리미엄 월간 구독', null, null, null, null, NOW() - INTERVAL '2 weeks', '카드 한도 초과', null, null, null, null, NOW() - INTERVAL '2 weeks'),
-- 환불된 결제
('pay-014', 'user-004', 9900.00, 'KRW', 'REFUNDED', 'TOSS', 'SUBSCRIPTION', null, '프리미엄 월간 구독', null, 'toss_pay_014', null, NOW() - INTERVAL '1 month', null, null, NOW() - INTERVAL '3 weeks', 9900.00, '서비스 불만족', '{"refund_request_id": "REF-001"}'::jsonb, NOW() - INTERVAL '1 month'),
-- 부분 환불
('pay-015', 'user-008', 19000.00, 'KRW', 'PARTIALLY_REFUNDED', 'KAKAO_PAY', 'CREDITS', null, '크레딧 50개 패키지', 50, null, 'kakao_tid_015', NOW() - INTERVAL '2 months', null, null, NOW() - INTERVAL '6 weeks', 9500.00, '미사용 크레딧 환불', null, NOW() - INTERVAL '2 months'),
-- 대기 중 결제
('pay-016', 'user-010', 9900.00, 'KRW', 'PENDING', 'TOSS', 'SUBSCRIPTION', null, '프리미엄 월간 구독', null, 'toss_pay_016', null, null, null, null, null, null, null, '{"awaiting_confirmation": true}'::jsonb, NOW() - INTERVAL '5 minutes');

-- ============================================================================
-- 4. subscription 확장 데이터 업데이트
-- ============================================================================

-- 기존 구독에 확장 필드 추가 (V3에서 type→plan, start_date→started_at, end_date→expires_at로 변경됨)
UPDATE subscription SET 
    price = 9900.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at,
    stripe_subscription_id = 'sub_stripe_001',
    metadata = '{"source": "mobile_app"}'::jsonb
WHERE id = 'sub-001';

UPDATE subscription SET 
    price = 9900.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at,
    metadata = '{"source": "mobile_app"}'::jsonb
WHERE id = 'sub-002';

UPDATE subscription SET 
    price = 5000.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = false,
    metadata = '{"tier": "basic"}'::jsonb
WHERE id = 'sub-003';

UPDATE subscription SET 
    price = 99000.00,
    currency = 'KRW',
    billing_cycle = 'YEARLY',
    auto_renew = true,
    next_billing_date = expires_at,
    discount_percentage = 17,
    metadata = '{"yearly_discount": true}'::jsonb
WHERE id = 'sub-004';

UPDATE subscription SET 
    price = 9900.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at
WHERE id = 'sub-005';

UPDATE subscription SET 
    price = 9900.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at
WHERE id = 'sub-006';

UPDATE subscription SET 
    price = 5000.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at
WHERE id = 'sub-007';

UPDATE subscription SET 
    price = 9900.00,
    currency = 'KRW',
    billing_cycle = 'MONTHLY',
    auto_renew = true,
    next_billing_date = expires_at,
    promo_code = 'SUMMER2024',
    discount_percentage = 10,
    discount_amount = 990.00
WHERE id = 'sub-008';

-- 추가 구독 데이터 (다양한 상태)
INSERT INTO subscription (id, user_id, plan, status, started_at, expires_at, cancelled_at, cancel_reason, price, currency, billing_cycle, auto_renew, next_billing_date, stripe_subscription_id, promo_code, discount_percentage, metadata, created_at, updated_at) VALUES
-- 취소된 구독
('sub-009', 'user-004', 'PREMIUM_MONTHLY', 'CANCELLED', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month', NOW() - INTERVAL '5 weeks', '서비스를 더 이상 사용하지 않음', 9900.00, 'KRW', 'MONTHLY', false, null, null, null, null, null, NOW() - INTERVAL '2 months', NOW() - INTERVAL '5 weeks'),
-- 만료된 구독
('sub-010', 'user-005', 'BASIC', 'EXPIRED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months', null, null, 5000.00, 'KRW', 'MONTHLY', false, null, null, null, null, null, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months'),
-- 일시정지된 구독
('sub-011', 'user-010', 'PREMIUM_MONTHLY', 'PAUSED', NOW() - INTERVAL '1 month', NOW() + INTERVAL '2 weeks', null, null, 9900.00, 'KRW', 'MONTHLY', true, null, null, null, null, '{"pause_reason": "해외 여행", "resume_date": "2025-02-01"}'::jsonb, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 week'),
-- 프로모션 구독
('sub-012', 'user-020', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '1 week', NOW() + INTERVAL '3 weeks', null, null, 4950.00, 'KRW', 'MONTHLY', true, NOW() + INTERVAL '3 weeks', null, 'WELCOME50', 50, '{"first_subscription": true}'::jsonb, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

-- ============================================================================
-- 5. group_member 확장 데이터 업데이트
-- ============================================================================

-- 기존 그룹 멤버에 확장 필드 추가
UPDATE group_member SET 
    is_verified = true,
    verified_at = joined_at + INTERVAL '1 day',
    verification_method = 'EMAIL_DOMAIN',
    is_active = true,
    contribution_points = 150,
    last_active_at = NOW() - INTERVAL '2 hours',
    notifications_enabled = true,
    notification_settings = '{"likes": true, "messages": true, "matches": true}'::jsonb
WHERE id = 'gm-001';

UPDATE group_member SET 
    is_verified = true,
    verified_at = joined_at + INTERVAL '2 days',
    verification_method = 'EMAIL_DOMAIN',
    is_active = true,
    contribution_points = 85,
    last_active_at = NOW() - INTERVAL '1 day',
    notifications_enabled = true
WHERE id = 'gm-002';

-- 나머지 회사 그룹 멤버들
UPDATE group_member SET 
    is_verified = true,
    verified_at = joined_at + INTERVAL '1 day',
    verification_method = 'EMAIL_DOMAIN',
    is_active = true,
    contribution_points = FLOOR(RANDOM() * 200),
    last_active_at = NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 7),
    notifications_enabled = true
WHERE id IN ('gm-003', 'gm-004', 'gm-005', 'gm-006', 'gm-007', 'gm-008', 'gm-009', 'gm-010');

-- 대학 그룹 멤버들
UPDATE group_member SET 
    is_verified = true,
    verified_at = joined_at + INTERVAL '3 days',
    verification_method = 'STUDENT_ID',
    is_active = true,
    contribution_points = FLOOR(RANDOM() * 100),
    last_active_at = NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 14),
    notifications_enabled = true
WHERE id IN ('gm-011', 'gm-012', 'gm-013', 'gm-014', 'gm-015', 'gm-016', 'gm-017', 'gm-018', 'gm-019');

-- 취미 그룹 멤버들 (인증 불필요)
UPDATE group_member SET 
    is_verified = false,
    is_active = true,
    contribution_points = FLOOR(RANDOM() * 50),
    last_active_at = NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30),
    notifications_enabled = CASE WHEN RANDOM() > 0.3 THEN true ELSE false END
WHERE id IN ('gm-020', 'gm-021', 'gm-022', 'gm-023', 'gm-024', 'gm-025', 'gm-026', 'gm-027', 'gm-028', 'gm-029', 'gm-030', 'gm-031', 'gm-032', 'gm-033', 'gm-034', 'gm-035', 'gm-036');

-- 탈퇴/정지 멤버 추가
INSERT INTO group_member (id, group_id, user_id, role, joined_at, is_verified, is_active, left_at, contribution_points, created_at, updated_at) VALUES
-- 탈퇴한 멤버
('gm-037', 'group-010', 'user-008', 'MEMBER', NOW() - INTERVAL '2 months', false, false, NOW() - INTERVAL '1 month', 15, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
-- 정지된 멤버
('gm-038', 'group-012', 'user-020', 'MEMBER', NOW() - INTERVAL '3 months', false, false, null, 5, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 weeks');

UPDATE group_member SET 
    banned_at = NOW() - INTERVAL '2 weeks',
    ban_reason = '부적절한 행동'
WHERE id = 'gm-038';

-- ============================================================================
-- 6. group_invite 확장 데이터 추가
-- ============================================================================

INSERT INTO group_invite (id, group_id, inviter_id, invitee_id, status, invitee_phone, invitee_email, invite_code, expires_at, accepted_at, declined_at, message, created_at, updated_at) VALUES
-- 수락된 초대
('ginv-001', 'group-010', 'user-009', 'user-012', 'ACCEPTED', null, 'leejy@naver.com', 'INV-MOVIE-001', NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 months' + INTERVAL '3 days', null, '영화 같이 봐요! 🎬', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months' + INTERVAL '3 days'),
('ginv-002', 'group-011', 'user-003', 'user-011', 'ACCEPTED', '010-1111-2222', null, 'INV-CAFE-001', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '1 month' + INTERVAL '2 days', null, '카페 투어 같이 다녀요 ☕', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month' + INTERVAL '2 days'),
-- 대기 중인 초대
('ginv-003', 'group-010', 'user-009', null, 'PENDING', '010-5555-1234', null, 'INV-MOVIE-002', NOW() + INTERVAL '5 days', null, null, '영화 덕후 모임에 초대합니다!', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('ginv-004', 'group-014', 'user-018', null, 'PENDING', null, 'friend@gmail.com', 'INV-RUN-001', NOW() + INTERVAL '7 days', null, null, '같이 뛰어요! 🏃', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('ginv-005', 'group-015', 'user-015', 'user-011', 'PENDING', null, null, 'INV-ART-001', NOW() + INTERVAL '6 days', null, null, '전시회 같이 가실래요?', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
-- 거절된 초대
('ginv-006', 'group-012', 'user-004', 'user-008', 'DECLINED', null, null, 'INV-SOCCER-001', NOW() - INTERVAL '1 week', null, NOW() - INTERVAL '2 weeks' + INTERVAL '5 days', '주말 축구 같이 해요!', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks' + INTERVAL '5 days'),
-- 만료된 초대
('ginv-007', 'group-013', 'user-005', null, 'EXPIRED', '010-9999-8888', null, 'INV-GAME-001', NOW() - INTERVAL '3 days', null, null, '게임 같이 해요!', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days');

-- ============================================================================
-- 7. chat_message 확장 데이터 업데이트
-- ============================================================================

-- 기존 메시지에 확장 필드 추가
UPDATE chat_message SET 
    is_edited = false,
    is_deleted = false
WHERE id IN ('msg-001', 'msg-002', 'msg-003', 'msg-004', 'msg-005', 'msg-006', 'msg-007', 'msg-008', 'msg-009', 'msg-010', 'msg-011', 'msg-012', 'msg-013', 'msg-014', 'msg-015', 'msg-016', 'msg-017', 'msg-018', 'msg-019', 'msg-020', 'msg-021', 'msg-022');

-- 편집된 메시지 추가
INSERT INTO chat_message (id, match_id, sender_id, content, type, is_read, read_at, is_edited, edited_at, is_deleted, created_at, updated_at) VALUES
('msg-023', 'match-001', 'user-011', '오늘 저녁 어때요? (수정: 내일 저녁이요!)', 'TEXT', true, NOW() - INTERVAL '1 hour', true, NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes', false, NOW() - INTERVAL '1 hour' - INTERVAL '10 minutes', NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes');

-- 삭제된 메시지 추가
INSERT INTO chat_message (id, match_id, sender_id, content, type, is_read, read_at, is_edited, is_deleted, deleted_at, created_at, updated_at) VALUES
('msg-024', 'match-002', 'user-003', '이 메시지는 삭제되었습니다', 'TEXT', true, NOW() - INTERVAL '10 days', false, true, NOW() - INTERVAL '10 days' + INTERVAL '1 hour', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '1 hour');

-- 미디어 메시지 추가
INSERT INTO chat_message (id, match_id, sender_id, content, type, is_read, read_at, is_edited, is_deleted, media_url, media_type, metadata, created_at, updated_at) VALUES
-- 이미지
('msg-025', 'match-001', 'user-001', '오늘 본 카페 사진이에요 ☕', 'IMAGE', true, NOW() - INTERVAL '25 days', false, false, 'https://picsum.photos/400/300?random=1', 'image/jpeg', '{"width": 400, "height": 300}'::jsonb, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('msg-026', 'match-001', 'user-011', '여기 분위기 좋네요! 다음엔 여기로 가요', 'TEXT', true, NOW() - INTERVAL '25 days' + INTERVAL '5 minutes', false, false, null, null, null, NOW() - INTERVAL '25 days' + INTERVAL '5 minutes', NOW() - INTERVAL '25 days' + INTERVAL '5 minutes'),
-- 위치 공유
('msg-027', 'match-002', 'user-013', '여기서 만나요!', 'LOCATION', true, NOW() - INTERVAL '11 days', false, false, null, null, '{"latitude": 37.3947, "longitude": 127.1112, "address": "판교역 1번 출구"}'::jsonb, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
-- 스티커
('msg-028', 'match-003', 'user-017', null, 'STICKER', true, NOW() - INTERVAL '5 days', false, false, 'https://example.com/stickers/heart.gif', 'image/gif', '{"sticker_pack": "love", "sticker_id": "heart_01"}'::jsonb, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- ============================================================================
-- 8. message_reaction 테스트 데이터 추가
-- ============================================================================

INSERT INTO message_reaction (id, message_id, user_id, emoji, created_at) VALUES
('react-001', 'msg-001', 'user-011', '❤️', NOW() - INTERVAL '1 month'),
('react-002', 'msg-002', 'user-001', '😊', NOW() - INTERVAL '1 month'),
('react-003', 'msg-005', 'user-011', '👍', NOW() - INTERVAL '28 days'),
('react-004', 'msg-008', 'user-001', '💕', NOW() - INTERVAL '27 days'),
('react-005', 'msg-011', 'user-011', '🎬', NOW() - INTERVAL '2 hours'),
('react-006', 'msg-012', 'user-013', '👋', NOW() - INTERVAL '2 weeks'),
('react-007', 'msg-015', 'user-003', '😋', NOW() - INTERVAL '12 days'),
('react-008', 'msg-018', 'user-017', '🎓', NOW() - INTERVAL '1 week'),
('react-009', 'msg-025', 'user-011', '☕', NOW() - INTERVAL '25 days'),
('react-010', 'msg-027', 'user-003', '📍', NOW() - INTERVAL '11 days');

-- ============================================================================
-- 9. group_like 테스트 데이터 추가
-- ============================================================================

INSERT INTO group_like (id, group_id, user_id, created_at) VALUES
('glike-001', 'group-010', 'user-001', NOW() - INTERVAL '2 months'),
('glike-002', 'group-010', 'user-003', NOW() - INTERVAL '6 weeks'),
('glike-003', 'group-011', 'user-012', NOW() - INTERVAL '1 month'),
('glike-004', 'group-011', 'user-017', NOW() - INTERVAL '3 weeks'),
('glike-005', 'group-012', 'user-006', NOW() - INTERVAL '2 months'),
('glike-006', 'group-014', 'user-012', NOW() - INTERVAL '2 months'),
('glike-007', 'group-015', 'user-011', NOW() - INTERVAL '3 weeks'),
('glike-008', 'group-015', 'user-017', NOW() - INTERVAL '2 weeks');

-- ============================================================================
-- 10. 통계 업데이트
-- ============================================================================

-- 그룹 통계 업데이트
UPDATE groups SET total_likes = 2, daily_active_users = 4, weekly_active_users = 8 WHERE id = 'group-010';
UPDATE groups SET total_likes = 2, daily_active_users = 2, weekly_active_users = 5 WHERE id = 'group-011';
UPDATE groups SET total_likes = 1, total_matches = 0, daily_active_users = 2, weekly_active_users = 4 WHERE id = 'group-012';
UPDATE groups SET total_likes = 0, daily_active_users = 1, weekly_active_users = 3 WHERE id = 'group-013';
UPDATE groups SET total_likes = 1, daily_active_users = 2, weekly_active_users = 3 WHERE id = 'group-014';
UPDATE groups SET total_likes = 2, daily_active_users = 3, weekly_active_users = 5 WHERE id = 'group-015';

-- 매칭 통계 업데이트 (삼성, 카카오, 서강대 그룹)
UPDATE groups SET total_matches = 1 WHERE id IN ('group-001', 'group-003', 'group-009');


