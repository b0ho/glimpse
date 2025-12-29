-- ============================================================================
-- Glimpse Test Data Seed
-- Version: 2.0.0
-- Description: Realistic test data for Korean dating app
-- ============================================================================

-- ============================================================================
-- Users - 20명의 테스트 사용자
-- ============================================================================

-- 남성 사용자 (10명)
INSERT INTO users (id, clerk_id, email, phone_number, real_name, nickname, anonymous_id, gender, birthdate, age, bio, profile_image, height, education, company_name, department, school, mbti, drinking, smoking, is_verified, is_premium, premium_level, credits, created_at, updated_at) VALUES
('user-001', 'clerk_kim001', 'kimjh@samsung.com', '010-1234-5678', '김준호', '준호', 'anon-001', 'MALE', '1995-03-15', 29, '안녕하세요! 개발자입니다. 음악과 영화를 좋아해요 🎵', 'https://i.pravatar.cc/300?img=12', 178, '서울대학교 컴퓨터공학과', '삼성전자', 'SW개발팀', '서울대학교', 'INTJ', 'SOMETIMES', 'NO', true, true, 'PREMIUM', 50, NOW() - INTERVAL '3 months', NOW()),
('user-002', 'clerk_lee002', 'leesu@naver.com', '010-2345-6789', '이수진', '수진', 'anon-002', 'MALE', '1993-07-22', 31, '네이버에서 일하고 있어요. 운동과 여행을 즐깁니다 ✈️', 'https://i.pravatar.cc/300?img=13', 175, '연세대학교 경영학과', '네이버', '서비스기획팀', '연세대학교', 'ENFP', 'YES', 'NO', true, false, null, 3, NOW() - INTERVAL '2 months', NOW()),
('user-003', 'clerk_park003', 'parkmh@kakao.com', '010-3456-7890', '박민혁', '민혁', 'anon-003', 'MALE', '1996-11-08', 28, '카카오 디자이너입니다. 카페 투어가 취미예요 ☕', 'https://i.pravatar.cc/300?img=14', 180, '홍익대학교 시각디자인', '카카오', 'UX디자인팀', '홍익대학교', 'ISFP', 'SOMETIMES', 'NO', true, true, 'PREMIUM', 100, NOW() - INTERVAL '4 months', NOW()),
('user-004', 'clerk_choi004', 'choijw@coupang.com', '010-4567-8901', '최재원', '재원', 'anon-004', 'MALE', '1994-05-30', 30, '쿠팡에서 물류 시스템 개발해요. 축구 좋아합니다 ⚽', 'https://i.pravatar.cc/300?img=15', 182, 'KAIST 산업공학과', '쿠팡', '물류시스템팀', 'KAIST', 'ESTJ', 'YES', 'NO', true, false, null, 0, NOW() - INTERVAL '1 month', NOW()),
('user-005', 'clerk_jung005', 'jungdh@line.com', '010-5678-9012', '정동현', '동현', 'anon-005', 'MALE', '1997-09-12', 27, '라인 프론트엔드 개발자. 게임과 애니 좋아해요 🎮', 'https://i.pravatar.cc/300?img=16', 173, '성균관대 소프트웨어학과', '라인', '프론트엔드팀', '성균관대학교', 'INTP', 'NO', 'NO', false, false, null, 1, NOW() - INTERVAL '2 weeks', NOW()),
('user-006', 'clerk_kang006', 'kangsh@baemin.com', '010-6789-0123', '강승호', '승호', 'anon-006', 'MALE', '1995-12-25', 29, '배민에서 데이터 분석해요. 맛집 탐방 좋아합니다 🍕', 'https://i.pravatar.cc/300?img=17', 177, '고려대학교 통계학과', '우아한형제들', '데이터분석팀', '고려대학교', 'ISTJ', 'SOMETIMES', 'NO', true, true, 'BASIC', 20, NOW() - INTERVAL '5 months', NOW()),
('user-007', 'clerk_yoon007', 'yoonms@toss.com', '010-7890-1234', '윤민석', '민석', 'anon-007', 'MALE', '1994-02-18', 30, '토스 백엔드 개발자. 등산과 사진 취미예요 📷', 'https://i.pravatar.cc/300?img=18', 176, '서강대학교 컴퓨터공학과', '토스', '백엔드개발팀', '서강대학교', 'ENTJ', 'YES', 'NO', true, false, null, 5, NOW() - INTERVAL '6 months', NOW()),
('user-008', 'clerk_han008', 'hanjh@kurly.com', '010-8901-2345', '한준혁', '준혁', 'anon-008', 'MALE', '1996-08-05', 28, '컬리 풀스택 개발자. 요리하는 거 좋아해요 🍳', 'https://i.pravatar.cc/300?img=19', 181, '한양대학교 컴퓨터소프트웨어', '컬리', '풀스택개발팀', '한양대학교', 'ENFJ', 'SOMETIMES', 'NO', false, false, null, 2, NOW() - INTERVAL '3 weeks', NOW()),
('user-009', 'clerk_lim009', 'limys@kakaobank.com', '010-9012-3456', '임영수', '영수', 'anon-009', 'MALE', '1993-04-28', 31, '카카오뱅크 PM입니다. 독서와 영화 감상 좋아합니다 📚', 'https://i.pravatar.cc/300?img=20', 174, '서울대학교 경영학과', '카카오뱅크', '상품기획팀', '서울대학교', 'INFJ', 'NO', 'NO', true, true, 'PREMIUM', 80, NOW() - INTERVAL '7 months', NOW()),
('user-010', 'clerk_son010', 'sonkh@socar.com', '010-0123-4567', '손기현', '기현', 'anon-010', 'MALE', '1997-10-14', 27, '쏘카 모바일 개발자. 드라이브와 캠핑 좋아해요 🏕️', 'https://i.pravatar.cc/300?img=21', 179, '중앙대학교 전자전기공학', '쏘카', '모바일개발팀', '중앙대학교', 'ISTP', 'YES', 'NO', false, false, null, 1, NOW() - INTERVAL '1 month', NOW());

-- 여성 사용자 (10명)
INSERT INTO users (id, clerk_id, email, phone_number, real_name, nickname, anonymous_id, gender, birthdate, age, bio, profile_image, height, education, company_name, department, school, mbti, drinking, smoking, is_verified, is_premium, premium_level, credits, created_at, updated_at) VALUES
('user-011', 'clerk_kim011', 'kimsy@samsung.com', '010-1111-2222', '김소연', '소연', 'anon-011', 'FEMALE', '1996-06-20', 28, '삼성 마케터예요. 카페와 전시회 좋아합니다 🎨', 'https://i.pravatar.cc/300?img=5', 165, '이화여대 경영학과', '삼성전자', '마케팅팀', '이화여자대학교', 'ENFP', 'SOMETIMES', 'NO', true, true, 'PREMIUM', 60, NOW() - INTERVAL '4 months', NOW()),
('user-012', 'clerk_lee012', 'leejy@naver.com', '010-2222-3333', '이지영', '지영', 'anon-012', 'FEMALE', '1995-03-15', 29, '네이버 UI 디자이너. 요가와 필라테스 즐겨요 🧘', 'https://i.pravatar.cc/300?img=9', 162, '서울대학교 디자인학부', '네이버', 'UI디자인팀', '서울대학교', 'INFP', 'NO', 'NO', true, false, null, 3, NOW() - INTERVAL '3 months', NOW()),
('user-013', 'clerk_park013', 'parkhr@kakao.com', '010-3333-4444', '박하린', '하린', 'anon-013', 'FEMALE', '1997-11-03', 27, '카카오 프론트엔드 개발자. 반려동물과 산책 좋아해요 🐕', 'https://i.pravatar.cc/300?img=10', 168, '숙명여대 IT공학과', '카카오', '프론트엔드팀', '숙명여자대학교', 'ISFJ', 'SOMETIMES', 'NO', true, true, 'PREMIUM', 90, NOW() - INTERVAL '5 months', NOW()),
('user-014', 'clerk_choi014', 'choieh@coupang.com', '010-4444-5555', '최은혜', '은혜', 'anon-014', 'FEMALE', '1994-08-22', 30, '쿠팡 HR 매니저입니다. 맛집과 여행 좋아합니다 🌍', 'https://i.pravatar.cc/300?img=24', 170, '연세대학교 심리학과', '쿠팡', '인사팀', '연세대학교', 'ESFJ', 'YES', 'NO', true, false, null, 0, NOW() - INTERVAL '2 months', NOW()),
('user-015', 'clerk_jung015', 'jungmj@line.com', '010-5555-6666', '정민지', '민지', 'anon-015', 'FEMALE', '1998-01-17', 26, '라인 UX 디자이너. 그림 그리기와 공예 좋아해요 🎨', 'https://i.pravatar.cc/300?img=25', 163, '홍익대학교 디자인학부', '라인', 'UX디자인팀', '홍익대학교', 'INFP', 'NO', 'NO', false, false, null, 2, NOW() - INTERVAL '1 month', NOW()),
('user-016', 'clerk_kang016', 'kangys@baemin.com', '010-6666-7777', '강윤서', '윤서', 'anon-016', 'FEMALE', '1996-05-09', 28, '배민 서비스 기획자. 베이킹과 요리 즐겨요 🍰', 'https://i.pravatar.cc/300?img=26', 166, '성균관대 경영학과', '우아한형제들', '서비스기획팀', '성균관대학교', 'ENFJ', 'SOMETIMES', 'NO', true, true, 'BASIC', 30, NOW() - INTERVAL '6 months', NOW()),
('user-017', 'clerk_yoon017', 'yoonjs@toss.com', '010-7777-8888', '윤지수', '지수', 'anon-017', 'FEMALE', '1995-09-30', 29, '토스 프로덕트 매니저. 영화와 뮤지컬 좋아합니다 🎭', 'https://i.pravatar.cc/300?img=27', 164, '서강대학교 경영학과', '토스', '프로덕트팀', '서강대학교', 'ENTJ', 'YES', 'NO', true, false, null, 4, NOW() - INTERVAL '4 months', NOW()),
('user-018', 'clerk_han018', 'hanse@kurly.com', '010-8888-9999', '한서영', '서영', 'anon-018', 'FEMALE', '1997-12-08', 27, '컬리 데이터 분석가. 러닝과 클라이밍 좋아해요 🏃', 'https://i.pravatar.cc/300?img=28', 169, '고려대학교 통계학과', '컬리', '데이터분석팀', '고려대학교', 'ISTJ', 'SOMETIMES', 'NO', false, false, null, 1, NOW() - INTERVAL '2 weeks', NOW()),
('user-019', 'clerk_lim019', 'limda@kakaobank.com', '010-9999-0000', '임다은', '다은', 'anon-019', 'FEMALE', '1994-07-25', 30, '카카오뱅크 마케터. 사진과 SNS 콘텐츠 제작 좋아해요 📸', 'https://i.pravatar.cc/300?img=29', 161, '이화여대 미디어학부', '카카오뱅크', '마케팅팀', '이화여자대학교', 'ESFP', 'YES', 'NO', true, true, 'PREMIUM', 70, NOW() - INTERVAL '5 months', NOW()),
('user-020', 'clerk_son020', 'sonhj@socar.com', '010-0000-1111', '손혜진', '혜진', 'anon-020', 'FEMALE', '1998-02-14', 26, '쏘카 마케팅 인턴. 패션과 뷰티에 관심 많아요 💄', 'https://i.pravatar.cc/300?img=30', 167, '중앙대학교 광고홍보학과', '쏘카', '마케팅팀', '중앙대학교', 'ENFP', 'NO', 'NO', false, false, null, 0, NOW() - INTERVAL '3 weeks', NOW());

-- ============================================================================
-- Groups - 다양한 그룹 (회사, 대학, 취미)
-- ============================================================================

INSERT INTO groups (id, name, description, type, category, profile_image, verification_required, verification_method, member_count, is_public, is_active, is_official, creator_id, created_at, updated_at) VALUES
-- 공식 회사 그룹
('group-001', '삼성전자', '삼성전자 임직원들의 만남의 장', 'OFFICIAL', 'COMPANY', 'https://logo.clearbit.com/samsung.com', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-001', NOW() - INTERVAL '6 months', NOW()),
('group-002', '네이버', '네이버 임직원 그룹', 'OFFICIAL', 'COMPANY', 'https://logo.clearbit.com/naver.com', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-002', NOW() - INTERVAL '6 months', NOW()),
('group-003', '카카오', '카카오 크루들의 소통 공간', 'OFFICIAL', 'COMPANY', 'https://logo.clearbit.com/kakao.com', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-003', NOW() - INTERVAL '6 months', NOW()),
('group-004', '쿠팡', '쿠팡 직원 커뮤니티', 'OFFICIAL', 'COMPANY', 'https://logo.clearbit.com/coupang.com', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-004', NOW() - INTERVAL '5 months', NOW()),
('group-005', '라인', '라인 플러스 임직원', 'OFFICIAL', 'COMPANY', 'https://logo.clearbit.com/linecorp.com', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-005', NOW() - INTERVAL '5 months', NOW()),

-- 공식 대학 그룹
('group-006', '서울대학교', '서울대 재학생/졸업생', 'OFFICIAL', 'UNIVERSITY', 'https://www.snu.ac.kr/images/sub/img_symbol01.png', true, 'EMAIL_DOMAIN', 3, true, true, true, 'user-001', NOW() - INTERVAL '6 months', NOW()),
('group-007', '연세대학교', '연세대 커뮤니티', 'OFFICIAL', 'UNIVERSITY', 'https://www.yonsei.ac.kr/sc/img/intro/img_symbol_01.png', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-002', NOW() - INTERVAL '6 months', NOW()),
('group-008', '고려대학교', '고려대 안암동 친구들', 'OFFICIAL', 'UNIVERSITY', 'https://www.korea.ac.kr/resources/images/sub/symbol_01.png', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-006', NOW() - INTERVAL '5 months', NOW()),
('group-009', '서강대학교', '서강대 백조들의 모임', 'OFFICIAL', 'UNIVERSITY', 'https://www.sogang.ac.kr/images/symbol.png', true, 'EMAIL_DOMAIN', 2, true, true, true, 'user-007', NOW() - INTERVAL '5 months', NOW()),

-- 사용자 생성 취미 그룹
('group-010', '🎬 영화 덕후 모임', '영화 좋아하는 사람들 모여라!', 'CREATED', 'HOBBY', null, false, null, 4, true, true, false, 'user-009', NOW() - INTERVAL '3 months', NOW()),
('group-011', '☕ 서울 카페 탐방', '힙한 카페 같이 다녀요', 'CREATED', 'FOOD', null, false, null, 3, true, true, false, 'user-003', NOW() - INTERVAL '2 months', NOW()),
('group-012', '⚽ 주말 축구 모임', '주말에 축구 같이 해요', 'CREATED', 'SPORTS', null, false, null, 3, true, true, false, 'user-004', NOW() - INTERVAL '4 months', NOW()),
('group-013', '🎮 게임 좋아하는 사람들', 'PC방, 콘솔 게임 다 환영', 'CREATED', 'GAMING', null, false, null, 2, true, true, false, 'user-005', NOW() - INTERVAL '2 months', NOW()),
('group-014', '🏃 강남 러닝 크루', '강남역 근처에서 같이 뛰어요', 'CREATED', 'SPORTS', null, false, null, 2, true, true, false, 'user-018', NOW() - INTERVAL '3 months', NOW()),
('group-015', '🎨 전시회 같이 가요', '미술, 사진 전시회 관심있는 분', 'CREATED', 'ART', null, false, null, 3, true, true, false, 'user-015', NOW() - INTERVAL '1 month', NOW());

-- ============================================================================
-- Group Members - 그룹 멤버십
-- ============================================================================

INSERT INTO group_member (id, group_id, user_id, role, joined_at) VALUES
-- 삼성전자
('gm-001', 'group-001', 'user-001', 'ADMIN', NOW() - INTERVAL '6 months'),
('gm-002', 'group-001', 'user-011', 'MEMBER', NOW() - INTERVAL '4 months'),

-- 네이버
('gm-003', 'group-002', 'user-002', 'ADMIN', NOW() - INTERVAL '6 months'),
('gm-004', 'group-002', 'user-012', 'MEMBER', NOW() - INTERVAL '3 months'),

-- 카카오
('gm-005', 'group-003', 'user-003', 'ADMIN', NOW() - INTERVAL '6 months'),
('gm-006', 'group-003', 'user-013', 'MEMBER', NOW() - INTERVAL '5 months'),

-- 쿠팡
('gm-007', 'group-004', 'user-004', 'ADMIN', NOW() - INTERVAL '5 months'),
('gm-008', 'group-004', 'user-014', 'MEMBER', NOW() - INTERVAL '2 months'),

-- 라인
('gm-009', 'group-005', 'user-005', 'ADMIN', NOW() - INTERVAL '5 months'),
('gm-010', 'group-005', 'user-015', 'MEMBER', NOW() - INTERVAL '1 month'),

-- 서울대
('gm-011', 'group-006', 'user-001', 'MEMBER', NOW() - INTERVAL '6 months'),
('gm-012', 'group-006', 'user-009', 'MEMBER', NOW() - INTERVAL '4 months'),
('gm-013', 'group-006', 'user-012', 'MEMBER', NOW() - INTERVAL '3 months'),

-- 연세대
('gm-014', 'group-007', 'user-002', 'MEMBER', NOW() - INTERVAL '6 months'),
('gm-015', 'group-007', 'user-014', 'MEMBER', NOW() - INTERVAL '2 months'),

-- 고려대
('gm-016', 'group-008', 'user-006', 'ADMIN', NOW() - INTERVAL '5 months'),
('gm-017', 'group-008', 'user-018', 'MEMBER', NOW() - INTERVAL '2 weeks'),

-- 서강대
('gm-018', 'group-009', 'user-007', 'ADMIN', NOW() - INTERVAL '5 months'),
('gm-019', 'group-009', 'user-017', 'MEMBER', NOW() - INTERVAL '4 months'),

-- 영화 덕후
('gm-020', 'group-010', 'user-009', 'ADMIN', NOW() - INTERVAL '3 months'),
('gm-021', 'group-010', 'user-012', 'MEMBER', NOW() - INTERVAL '2 months'),
('gm-022', 'group-010', 'user-017', 'MEMBER', NOW() - INTERVAL '1 month'),
('gm-023', 'group-010', 'user-019', 'MEMBER', NOW() - INTERVAL '3 weeks'),

-- 카페 탐방
('gm-024', 'group-011', 'user-003', 'ADMIN', NOW() - INTERVAL '2 months'),
('gm-025', 'group-011', 'user-011', 'MEMBER', NOW() - INTERVAL '1 month'),
('gm-026', 'group-011', 'user-013', 'MEMBER', NOW() - INTERVAL '2 weeks'),

-- 축구 모임
('gm-027', 'group-012', 'user-004', 'ADMIN', NOW() - INTERVAL '4 months'),
('gm-028', 'group-012', 'user-007', 'MEMBER', NOW() - INTERVAL '3 months'),
('gm-029', 'group-012', 'user-010', 'MEMBER', NOW() - INTERVAL '1 month'),

-- 게임
('gm-030', 'group-013', 'user-005', 'ADMIN', NOW() - INTERVAL '2 months'),
('gm-031', 'group-013', 'user-008', 'MEMBER', NOW() - INTERVAL '1 month'),

-- 러닝 크루
('gm-032', 'group-014', 'user-018', 'ADMIN', NOW() - INTERVAL '3 months'),
('gm-033', 'group-014', 'user-016', 'MEMBER', NOW() - INTERVAL '2 months'),

-- 전시회
('gm-034', 'group-015', 'user-015', 'ADMIN', NOW() - INTERVAL '1 month'),
('gm-035', 'group-015', 'user-012', 'MEMBER', NOW() - INTERVAL '3 weeks'),
('gm-036', 'group-015', 'user-019', 'MEMBER', NOW() - INTERVAL '2 weeks');

-- ============================================================================
-- User Likes - 좋아요
-- ============================================================================

INSERT INTO user_like (id, sender_id, receiver_id, group_id, status, liked_at) VALUES
-- 매칭된 좋아요 (상호 좋아요)
('like-001', 'user-001', 'user-011', 'group-001', 'MATCHED', NOW() - INTERVAL '1 month'),
('like-002', 'user-011', 'user-001', 'group-001', 'MATCHED', NOW() - INTERVAL '1 month'),

('like-003', 'user-003', 'user-013', 'group-003', 'MATCHED', NOW() - INTERVAL '2 weeks'),
('like-004', 'user-013', 'user-003', 'group-003', 'MATCHED', NOW() - INTERVAL '2 weeks'),

('like-005', 'user-007', 'user-017', 'group-009', 'MATCHED', NOW() - INTERVAL '1 week'),
('like-006', 'user-017', 'user-007', 'group-009', 'MATCHED', NOW() - INTERVAL '1 week'),

-- 대기 중인 좋아요
('like-007', 'user-002', 'user-012', 'group-002', 'PENDING', NOW() - INTERVAL '3 days'),
('like-008', 'user-004', 'user-014', 'group-004', 'PENDING', NOW() - INTERVAL '5 days'),
('like-009', 'user-005', 'user-015', 'group-005', 'PENDING', NOW() - INTERVAL '2 days'),
('like-010', 'user-006', 'user-018', 'group-008', 'PENDING', NOW() - INTERVAL '1 day'),
('like-011', 'user-009', 'user-019', 'group-010', 'PENDING', NOW() - INTERVAL '4 hours');

-- ============================================================================
-- Matches - 매칭 (상호 좋아요 후 생성)
-- ============================================================================

INSERT INTO matches (id, user1_id, user2_id, group_id, status, is_anonymous, matched_at, last_message_at, message_count, created_at, updated_at) VALUES
('match-001', 'user-001', 'user-011', 'group-001', 'ACTIVE', false, NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 hours', 47, NOW() - INTERVAL '1 month', NOW()),
('match-002', 'user-003', 'user-013', 'group-003', 'ACTIVE', false, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '30 minutes', 23, NOW() - INTERVAL '2 weeks', NOW()),
('match-003', 'user-007', 'user-017', 'group-009', 'ACTIVE', false, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 hour', 15, NOW() - INTERVAL '1 week', NOW());

-- ============================================================================
-- Chat Messages - 채팅 메시지
-- ============================================================================

INSERT INTO chat_message (id, match_id, sender_id, content, type, is_read, read_at, created_at) VALUES
-- match-001 대화 (김준호 & 김소연)
('msg-001', 'match-001', 'user-001', '안녕하세요! 반갑습니다 😊', 'TEXT', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('msg-002', 'match-001', 'user-011', '안녕하세요~ 프로필 보니까 개발자시네요!', 'TEXT', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('msg-003', 'match-001', 'user-001', '네! 삼성에서 일하고 있어요. 마케팅팀이시죠?', 'TEXT', true, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('msg-004', 'match-001', 'user-011', '맞아요 ㅎㅎ 같은 회사라니 신기하네요', 'TEXT', true, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('msg-005', 'match-001', 'user-001', '주말에 시간 되시면 커피 한잔 어떠세요?', 'TEXT', true, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('msg-006', 'match-001', 'user-011', '좋아요! 강남쪽 어떠세요?', 'TEXT', true, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('msg-007', 'match-001', 'user-001', '완벽해요! 토요일 2시는 어떠세요?', 'TEXT', true, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
('msg-008', 'match-001', 'user-011', '좋아요~ 그럼 그때 뵙겠습니다 💕', 'TEXT', true, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
('msg-009', 'match-001', 'user-001', '오늘 만나서 정말 좋았어요!', 'TEXT', true, NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
('msg-010', 'match-001', 'user-011', '저도요! 다음에 또 만나요 ^^', 'TEXT', true, NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
('msg-011', 'match-001', 'user-001', '혹시 이번주 영화 보러 갈래요?', 'TEXT', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

-- match-002 대화 (박민혁 & 박하린)
('msg-012', 'match-002', 'user-003', '안녕하세요! 같은 카카오네요 👋', 'TEXT', true, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('msg-013', 'match-002', 'user-013', '어머 정말요? UX팀이신가요?', 'TEXT', true, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('msg-014', 'match-002', 'user-003', '네! 프론트엔드팀이시죠?', 'TEXT', true, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('msg-015', 'match-002', 'user-013', '맞아요 ㅎㅎ 점심 같이 먹어요!', 'TEXT', true, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('msg-016', 'match-002', 'user-003', '좋아요! 내일 판교 어때요?', 'TEXT', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('msg-017', 'match-002', 'user-013', '퇴근하고 저녁 먹을까요?', 'TEXT', true, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),

-- match-003 대화 (윤민석 & 윤지수)
('msg-018', 'match-003', 'user-007', '안녕하세요! 같은 학교 출신이시네요', 'TEXT', true, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('msg-019', 'match-003', 'user-017', '서강대 선배님이신가요? ^^', 'TEXT', true, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('msg-020', 'match-003', 'user-007', '네! 14학번이에요', 'TEXT', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('msg-021', 'match-003', 'user-017', '저는 15학번이에요! 1년 차이네요', 'TEXT', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('msg-022', 'match-003', 'user-007', '주말에 모교 근처에서 만날까요?', 'TEXT', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- ============================================================================
-- Notifications - 알림
-- ============================================================================

INSERT INTO notification (id, user_id, type, title, message, is_read, read_at, created_at) VALUES
('notif-001', 'user-001', 'MATCH', '새로운 매칭!', '김소연님과 매칭되었습니다', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('notif-002', 'user-011', 'MATCH', '새로운 매칭!', '김준호님과 매칭되었습니다', true, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('notif-003', 'user-001', 'MESSAGE', '새 메시지', '김소연님이 메시지를 보냈습니다', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('notif-004', 'user-003', 'MATCH', '새로운 매칭!', '박하린님과 매칭되었습니다', true, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('notif-005', 'user-013', 'MATCH', '새로운 매칭!', '박민혁님과 매칭되었습니다', true, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('notif-006', 'user-007', 'MATCH', '새로운 매칭!', '윤지수님과 매칭되었습니다', true, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('notif-007', 'user-017', 'MATCH', '새로운 매칭!', '윤민석님과 매칭되었습니다', true, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('notif-008', 'user-002', 'LIKE', '새로운 좋아요!', '누군가 회원님을 좋아합니다', false, null, NOW() - INTERVAL '3 days'),
('notif-009', 'user-004', 'LIKE', '새로운 좋아요!', '누군가 회원님을 좋아합니다', false, null, NOW() - INTERVAL '5 days'),
('notif-010', 'user-012', 'MESSAGE', '새 메시지', '김소연님이 메시지를 보냈습니다', false, null, NOW() - INTERVAL '1 hour');

-- ============================================================================
-- Payments - 결제 내역
-- ============================================================================

INSERT INTO payment (id, user_id, amount, currency, status, payment_method, created_at) VALUES
('pay-001', 'user-001', 9900.00, 'KRW', 'COMPLETED', 'TOSS', NOW() - INTERVAL '3 months'),
('pay-002', 'user-003', 9900.00, 'KRW', 'COMPLETED', 'KAKAO_PAY', NOW() - INTERVAL '4 months'),
('pay-003', 'user-006', 5000.00, 'KRW', 'COMPLETED', 'CARD', NOW() - INTERVAL '5 months'),
('pay-004', 'user-009', 9900.00, 'KRW', 'COMPLETED', 'TOSS', NOW() - INTERVAL '7 months'),
('pay-005', 'user-011', 9900.00, 'KRW', 'COMPLETED', 'KAKAO_PAY', NOW() - INTERVAL '4 months'),
('pay-006', 'user-013', 9900.00, 'KRW', 'COMPLETED', 'TOSS', NOW() - INTERVAL '5 months'),
('pay-007', 'user-016', 5000.00, 'KRW', 'COMPLETED', 'KAKAO_PAY', NOW() - INTERVAL '6 months'),
('pay-008', 'user-019', 9900.00, 'KRW', 'COMPLETED', 'CARD', NOW() - INTERVAL '5 months'),
('pay-009', 'user-001', 9900.00, 'KRW', 'COMPLETED', 'TOSS', NOW() - INTERVAL '1 week'),
('pay-010', 'user-003', 2500.00, 'KRW', 'COMPLETED', 'KAKAO_PAY', NOW() - INTERVAL '2 days');

-- ============================================================================
-- Subscriptions - 구독
-- ============================================================================

INSERT INTO subscription (id, user_id, type, status, start_date, end_date, created_at) VALUES
('sub-001', 'user-001', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '1 week', NOW() + INTERVAL '3 weeks', NOW() - INTERVAL '1 week'),
('sub-002', 'user-003', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('sub-003', 'user-006', 'BASIC', 'ACTIVE', NOW() - INTERVAL '5 months', NOW() + INTERVAL '1 month', NOW() - INTERVAL '5 months'),
('sub-004', 'user-009', 'PREMIUM_YEARLY', 'ACTIVE', NOW() - INTERVAL '7 months', NOW() + INTERVAL '5 months', NOW() - INTERVAL '7 months'),
('sub-005', 'user-011', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '4 months', NOW() + INTERVAL '2 weeks', NOW() - INTERVAL '4 months'),
('sub-006', 'user-013', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '5 months', NOW() + INTERVAL '1 week', NOW() - INTERVAL '5 months'),
('sub-007', 'user-016', 'BASIC', 'ACTIVE', NOW() - INTERVAL '6 months', NOW() + INTERVAL '3 days', NOW() - INTERVAL '6 months'),
('sub-008', 'user-019', 'PREMIUM_MONTHLY', 'ACTIVE', NOW() - INTERVAL '5 months', NOW() + INTERVAL '10 days', NOW() - INTERVAL '5 months');

-- ============================================================================
-- User Interests - 사용자 관심사
-- ============================================================================

INSERT INTO user_interests (user_id, interest) VALUES
('user-001', '음악'), ('user-001', '영화'), ('user-001', '개발'),
('user-002', '운동'), ('user-002', '여행'), ('user-002', '독서'),
('user-003', '디자인'), ('user-003', '카페'), ('user-003', '사진'),
('user-004', '축구'), ('user-004', '맥주'), ('user-004', '게임'),
('user-005', '게임'), ('user-005', '애니메이션'), ('user-005', '코딩'),
('user-011', '전시회'), ('user-011', '카페'), ('user-011', '패션'),
('user-012', '요가'), ('user-012', '필라테스'), ('user-012', '영화'),
('user-013', '반려동물'), ('user-013', '산책'), ('user-013', '베이킹'),
('user-017', '뮤지컬'), ('user-017', '영화'), ('user-017', '맛집'),
('user-019', '사진'), ('user-019', 'SNS'), ('user-019', '여행');

-- ============================================================================
-- Group Tags - 그룹 태그
-- ============================================================================

INSERT INTO group_tags (group_id, tag) VALUES
('group-001', '삼성'), ('group-001', 'IT'), ('group-001', '대기업'),
('group-002', '네이버'), ('group-002', 'IT'), ('group-002', '포털'),
('group-003', '카카오'), ('group-003', 'IT'), ('group-003', '메신저'),
('group-010', '영화'), ('group-010', '문화'), ('group-010', '취미'),
('group-011', '카페'), ('group-011', '디저트'), ('group-011', '서울'),
('group-012', '축구'), ('group-012', '운동'), ('group-012', '주말'),
('group-013', '게임'), ('group-013', 'PC'), ('group-013', '콘솔'),
('group-014', '러닝'), ('group-014', '운동'), ('group-014', '강남'),
('group-015', '전시회'), ('group-015', '미술'), ('group-015', '문화');

