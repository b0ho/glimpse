/**
 * 관심상대 검색 관련 유틸리티 함수
 */
import { InterestType } from '@/types/interest';
import { Platform, Alert } from 'react-native';

/**
 * InterestType에 대한 한글 라벨 반환
 */
export const getTypeLabel = (type: InterestType): string => {
  const labels: Record<InterestType, string> = {
    [InterestType.PHONE]: '전화번호',
    [InterestType.EMAIL]: '이메일',
    [InterestType.SOCIAL_ID]: '소셜 계정',
    [InterestType.NAME]: '이름',
    [InterestType.GROUP]: '특정 그룹',
    [InterestType.LOCATION]: '장소',
    [InterestType.NICKNAME]: '닉네임',
    [InterestType.COMPANY]: '회사',
    [InterestType.SCHOOL]: '학교',
    [InterestType.HOBBY]: '취미/관심사',
    [InterestType.PLATFORM]: '플랫폼',
    [InterestType.GAME_ID]: '게임 아이디',
  };
  return labels[type] || '기타';
};

/**
 * 매칭 정보에서 검색 정보 추출
 */
export const getSearchInfo = (match: any) => {
  if (match.matchType && match.matchValue) {
    return {
      type: getTypeLabel(match.matchType),
      value: match.matchValue,
    };
  }
  return null;
};

/**
 * 삭제 확인 다이얼로그 표시
 */
export const showDeleteConfirm = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('이 검색을 삭제하시겠습니까?\n\n삭제 후 7일간 동일한 유형을 다시 등록할 수 없습니다.');
      resolve(confirmed);
    } else {
      Alert.alert(
        '검색 삭제',
        '이 검색을 삭제하시겠습니까?\n\n삭제 후 7일간 동일한 유형을 다시 등록할 수 없습니다.',
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
        ]
      );
    }
  });
};

/**
 * 구독 제한 메시지 반환
 */
export const getSubscriptionLimitMessage = (limit: number): string => {
  return `무료 회원은 최대 ${limit}개까지만 등록 가능합니다. 프리미엄으로 업그레이드하여 무제한 등록하세요!`;
};