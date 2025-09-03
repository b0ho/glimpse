/**
 * 관심상대 타입 관련 상수
 */
import { InterestType } from '@/types/interest';

/**
 * 관심 타입별 설정
 */
export const INTEREST_TYPE_CONFIG = [
  { 
    type: InterestType.PHONE, 
    label: '전화번호', 
    icon: 'call-outline', 
    color: '#4CAF50',
    placeholder: '010-1234-5678'
  },
  { 
    type: InterestType.EMAIL, 
    label: '이메일', 
    icon: 'mail-outline', 
    color: '#2196F3',
    placeholder: 'example@email.com'
  },
  { 
    type: InterestType.SOCIAL_ID, 
    label: '소셜 계정', 
    icon: 'logo-instagram', 
    color: '#E91E63',
    placeholder: '@username'
  },
  { 
    type: InterestType.BIRTHDATE, 
    label: '생년월일', 
    icon: 'calendar-outline', 
    color: '#9C27B0',
    placeholder: 'YYYY-MM-DD'
  },
  { 
    type: InterestType.GROUP, 
    label: '특정 그룹', 
    icon: 'people-outline', 
    color: '#9C27B0',
    placeholder: '그룹명 입력'
  },
  { 
    type: InterestType.LOCATION, 
    label: '장소/인상착의', 
    icon: 'location-outline', 
    color: '#FF9800',
    placeholder: '장소나 인상착의 설명'
  },
  { 
    type: InterestType.NICKNAME, 
    label: '닉네임', 
    icon: 'at-outline', 
    color: '#607D8B',
    placeholder: '사용자 닉네임'
  },
  { 
    type: InterestType.COMPANY, 
    label: '회사', 
    icon: 'business-outline', 
    color: '#3F51B5',
    placeholder: '회사명'
  },
  { 
    type: InterestType.SCHOOL, 
    label: '학교', 
    icon: 'school-outline', 
    color: '#00BCD4',
    placeholder: '학교명'
  },
  { 
    type: InterestType.PART_TIME_JOB, 
    label: '알바', 
    icon: 'time-outline', 
    color: '#FF5722',
    placeholder: '알바 장소'
  },
  { 
    type: InterestType.PLATFORM, 
    label: '기타 플랫폼', 
    icon: 'globe-outline', 
    color: '#9C27B0',
    placeholder: '플랫폼명'
  },
  { 
    type: InterestType.GAME_ID, 
    label: '게임 아이디', 
    icon: 'game-controller-outline', 
    color: '#673AB7',
    placeholder: '게임 아이디'
  },
];

/**
 * 소셜 플랫폼 옵션
 */
export const SOCIAL_PLATFORM_OPTIONS = [
  { label: '인스타그램', value: 'instagram', icon: 'logo-instagram', color: '#E4405F' },
  { label: '페이스북', value: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
  { label: '틱톡', value: 'tiktok', icon: 'logo-tiktok', color: '#000000' },
  { label: '트위터', value: 'twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { label: '카카오톡', value: 'kakao', icon: 'chatbubbles-outline', color: '#FEE500' },
  { label: '라인', value: 'line', icon: 'chatbubble-ellipses-outline', color: '#00C300' },
  { label: '기타', value: 'other', icon: 'ellipsis-horizontal', color: '#666666' },
];

/**
 * 게임 플랫폼 옵션
 */
export const GAME_PLATFORM_OPTIONS = [
  { label: '리그 오브 레전드', value: 'lol' },
  { label: '배틀그라운드', value: 'pubg' },
  { label: '오버워치', value: 'overwatch' },
  { label: '발로란트', value: 'valorant' },
  { label: '메이플스토리', value: 'maplestory' },
  { label: '로스트아크', value: 'lostark' },
  { label: 'FC 온라인', value: 'fconline' },
  { label: '스팀', value: 'steam' },
  { label: '플레이스테이션', value: 'playstation' },
  { label: '엑스박스', value: 'xbox' },
  { label: '닌텐도', value: 'nintendo' },
  { label: '기타', value: 'other' },
];

/**
 * 회사 규모 옵션
 */
export const COMPANY_SIZE_OPTIONS = [
  { label: '대기업', value: 'large' },
  { label: '중견기업', value: 'medium' },
  { label: '중소기업', value: 'small' },
  { label: '스타트업', value: 'startup' },
  { label: '공기업', value: 'public' },
  { label: '외국계', value: 'foreign' },
  { label: '기타', value: 'other' },
];

/**
 * 학교 레벨 옵션
 */
export const SCHOOL_LEVEL_OPTIONS = [
  { label: '고등학교', value: 'high' },
  { label: '대학교', value: 'university' },
  { label: '대학원', value: 'graduate' },
  { label: '기타', value: 'other' },
];

/**
 * 관심 기간 옵션
 */
export const INTEREST_DURATION_OPTIONS = {
  BASIC: { label: '3일', value: '3days', days: 3 },
  ADVANCED: { label: '2주', value: '2weeks', days: 14 },
  PREMIUM: { label: '무제한', value: 'unlimited', days: 365 },
};