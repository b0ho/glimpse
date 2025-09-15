/**
 * Glimpse Brand Colors - Munto Inspired Design System
 * 세련되고 모던한 한국형 소셜 플랫폼 디자인
 */

// Glimpse 브랜드 색상 정의
const COLORS = {
  // Primary Brand Colors - Munto에서 영감을 받은 색상
  primary: {
    mint: '#5EEAD4',       // 메인 민트 (Munto 스타일)
    pink: '#FDA4AF',       // 소프트 핑크 (톤 다운)
    coral: '#FB7185',      // 코랄 핑크
    peach: '#FDBA74',      // 피치
  },
  
  // Semantic Colors
  semantic: {
    success: '#34D399',    // 민트 그린
    warning: '#FCD34D',    // 옐로우
    error: '#F87171',      // 라이트 레드
    info: '#60A5FA',       // 스카이 블루
  },
  
  // Background Colors - Munto 스타일 극도로 깔끔한 배경
  background: {
    primary: '#FFFFFF',    // 순백색 메인 배경
    secondary: '#FAFAFA',  // 극히 연한 회색 (섹션 구분)
    tertiary: '#F8F9FA',   // 아주 미세한 회색
    card: '#FFFFFF',       // 카드는 항상 순백색
    elevated: '#FFFFFF',   // 떠있는 요소도 순백색
    overlay: 'rgba(0, 0, 0, 0.5)', // 오버레이
    
    // Dark mode
    dark: '#0F172A',       // 다크 배경
    cardDark: '#1E293B',   // 다크 카드
  },
  
  // Text Colors - 더 선명한 대비
  text: {
    primary: '#1F2937',    // 진한 회색 (제목)
    secondary: '#6B7280',  // 중간 회색 (본문)
    tertiary: '#9CA3AF',   // 연한 회색 (보조)
    muted: '#D1D5DB',      // 매우 연한 회색
    inverse: '#FFFFFF',    // 반전 텍스트
    
    // Dark mode
    primaryDark: '#F9FAFB',
    secondaryDark: '#E5E7EB',
  },
  
  // Border & Divider - Munto 스타일 극미세한 선
  border: {
    default: '#F0F0F0',    // 기본 테두리 (아주 미세)
    light: '#F5F5F5',      // 더 연한 테두리
    divider: '#E5E5E5',    // 구분선
    focus: '#5EEAD4',      // 포커스 테두리 (민트)
    
    // Dark mode
    dark: '#374151',
  },
  
  // Shadow Colors - 부드러운 그림자
  shadow: {
    sm: 'rgba(0, 0, 0, 0.04)',
    md: 'rgba(0, 0, 0, 0.06)',
    lg: 'rgba(0, 0, 0, 0.08)',
    xl: 'rgba(0, 0, 0, 0.12)',
    mint: 'rgba(94, 234, 212, 0.2)',
    pink: 'rgba(253, 164, 175, 0.2)',
  },
  
  // Category Colors - Munto 스타일 파스텔톤
  category: {
    party: '#FCA5A5',      // 파티 - 파스텔 레드
    food: '#FED7AA',       // 푸드 - 파스텔 오렌지
    growth: '#DDD6FE',     // 자기계발 - 파스텔 퍼플
    finance: '#FDE68A',    // 재테크 - 파스텔 옐로우
    language: '#A7F3D0',   // 외국어 - 파스텔 민트
    hobby: '#E9D5FF',      // 취미 - 파스텔 라벤더
    game: '#BFDBFE',       // 게임 - 파스텔 블루
    activity: '#A7F3D0',   // 액티비티 - 파스텔 그린
    culture: '#FBCFE8',    // 문화 - 파스텔 핑크
    travel: '#99F6E4',     // 여행 - 파스텔 터콰이즈
    social: '#FDE68A',     // 소셜 - 파스텔 옐로우
    love: '#FECACA',       // 연애 - 파스텔 로즈
  },
  
  // Badge Colors - 라벨용
  badge: {
    new: '#EF4444',        // NEW 빨간색
    hot: '#F59E0B',        // HOT 주황색
    recommend: '#5EEAD4',  // 추천 민트색
    earlybird: '#A78BFA',  // 얼리버드 보라색
    lastchance: '#F87171', // 마감임박 연한빨강
  },
  
  // Gray Scale - 더 부드러운 회색
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
};

module.exports = COLORS;