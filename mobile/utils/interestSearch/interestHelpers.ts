/**
 * 관심상대 검색 헬퍼 유틸리티
 * @module utils/interestSearch/interestHelpers
 * @description 관심상대 검색 기능 관련 유틸리티 함수들
 *
 * 주요 기능:
 * - InterestType별 한글 라벨 변환
 * - 매칭 정보 추출
 * - 삭제 확인 다이얼로그
 * - 구독 제한 메시지
 */
import { InterestType } from '@/types/interest';
import { Platform, Alert } from 'react-native';

/**
 * InterestType 열거형을 한글 라벨로 변환합니다
 *
 * @param {InterestType} type - 관심상대 타입
 * @returns {string} 한글 라벨 문자열
 *
 * @example
 * getTypeLabel(InterestType.PHONE); // '전화번호'
 * getTypeLabel(InterestType.EMAIL); // '이메일'
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
 * 매칭 객체에서 검색 타입과 값을 추출합니다
 *
 * @param {any} match - 매칭 데이터 객체
 * @returns {{type: string, value: string} | null} 검색 정보 또는 null
 *
 * @example
 * const match = { matchType: InterestType.PHONE, matchValue: '010-1234-5678' };
 * getSearchInfo(match); // { type: '전화번호', value: '010-1234-5678' }
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
 * 크로스 플랫폼 삭제 확인 다이얼로그를 표시합니다
 *
 * @description
 * Web에서는 window.confirm, Native에서는 Alert.alert 사용.
 * 7일 쿨다운 정책에 대한 경고 메시지 포함.
 *
 * @returns {Promise<boolean>} 사용자가 확인을 눌렀으면 true
 *
 * @example
 * const confirmed = await showDeleteConfirm();
 * if (confirmed) {
 *   // 삭제 로직 실행
 * }
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
 * 무료 회원의 등록 제한 메시지를 생성합니다
 *
 * @param {number} limit - 무료 회원 등록 한도
 * @returns {string} 프리미엄 업그레이드 유도 메시지
 *
 * @example
 * getSubscriptionLimitMessage(3);
 * // '무료 회원은 최대 3개까지만 등록 가능합니다. 프리미엄으로 업그레이드하여 무제한 등록하세요!'
 */
export const getSubscriptionLimitMessage = (limit: number): string => {
  return `무료 회원은 최대 ${limit}개까지만 등록 가능합니다. 프리미엄으로 업그레이드하여 무제한 등록하세요!`;
};