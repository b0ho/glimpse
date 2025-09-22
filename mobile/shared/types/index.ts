/**
 * 📦 타입 정의 모음 - Glimpse 앱의 모든 타입 정의
 * 
 * 도메인별로 분리된 타입 모듈들을 재-export합니다.
 * 각 도메인은 독립적으로 관리되며 필요한 경우 상호 참조가 가능합니다.
 * 
 * @packageDocumentation
 */

// Core domain types
export * from './user.types';
export * from './common.types';
export * from './auth.types';

// Feature domain types
export * from './group.types';
export * from './like.types';
export * from './chat.types';
export * from './payment.types';
export * from './notification.types';
export * from './location.types';
export * from './community.types';
export * from './content.types';
export * from './company.types';

// i18n types
export * from './i18n';

// Legacy compatibility (deprecated - will be removed in future)
// These are maintained for backward compatibility during migration
import { AppMode } from './common.types';
import { ModeTexts } from './common.types';

/**
 * @deprecated Use import from common.types directly
 * 모드별 UI 텍스트 상수 - 데이팅/친구 모드에 따른 UI 텍스트 정의
 */
export const MODE_TEXTS: Record<AppMode, ModeTexts> = {
  [AppMode.DATING]: {
    title: '데이팅',
    subtitle: '연인을 찾아보세요',
    likeButton: '호감있어요',
    matchMessage: '매칭되었습니다',
    noMoreProfiles: '더 이상 프로필이 없습니다',
    notificationTypes: {
      match: '매칭 알림',
      message: '메시지 알림',
      like: '좋아요 알림',
      group: '그룹 알림'
    }
  },
  [AppMode.FRIENDSHIP]: {
    title: '친구찾기',
    subtitle: '새로운 친구를 만나보세요',
    likeButton: '친해지고 싶어요',
    matchMessage: '친구가 되었습니다',
    noMoreProfiles: '더 이상 친구 추천이 없습니다',
    notificationTypes: {
      match: '친구 연결 알림',
      message: '메시지 알림',
      like: '관심 표시 알림',
      group: '그룹 알림'
    }
  }
};