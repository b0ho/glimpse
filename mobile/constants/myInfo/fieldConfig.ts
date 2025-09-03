/**
 * 내 정보 필드 설정
 */

export const FIELD_LABELS: Record<string, string> = {
  phone: '전화번호',
  email: '이메일',
  socialId: '소셜 계정',
  birthdate: '생년월일',
  group: '특정 그룹/모임',
  location: '장소/인상착의',
  nickname: '닉네임',
  company: '회사',
  school: '학교',
  partTimeJob: '알바',
  platform: '기타 플랫폼',
  gameId: '게임 아이디',
};

export const FIELD_ICONS: Record<string, string> = {
  phone: 'call-outline',
  email: 'mail-outline',
  socialId: 'logo-instagram',
  birthdate: 'calendar-outline',
  group: 'people-outline',
  location: 'location-outline',
  nickname: 'at-outline',
  company: 'business-outline',
  school: 'school-outline',
  partTimeJob: 'briefcase-outline',
  platform: 'globe-outline',
  gameId: 'game-controller-outline',
};

export const FIELD_COLORS: Record<string, string> = {
  phone: '#4CAF50',
  email: '#2196F3',
  socialId: '#E91E63',
  birthdate: '#9C27B0',
  group: '#9C27B0',
  location: '#FF9800',
  nickname: '#607D8B',
  company: '#3F51B5',
  school: '#00BCD4',
  partTimeJob: '#F44336',
  platform: '#9C27B0',
  gameId: '#673AB7',
};

export const getFieldLabel = (key: string): string => {
  return FIELD_LABELS[key] || key;
};

export const getFieldIcon = (key: string): string => {
  return FIELD_ICONS[key] || 'help-outline';
};

export const getFieldColor = (key: string): string => {
  return FIELD_COLORS[key] || '#999999';
};