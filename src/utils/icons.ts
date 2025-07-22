/**
 * 앱 전체에서 사용되는 아이콘 이름 상수
 * Ionicons 라이브러리 기반
 */

// 네비게이션 탭 아이콘
export const NAVIGATION_ICONS = {
  HOME: 'home',
  GROUPS: 'people',
  MATCHES: 'heart',
  PROFILE: 'person',
} as const;

// 액션 아이콘
export const ACTION_ICONS = {
  CREATE: 'create',
  ADD: 'add',
  EDIT: 'pencil',
  DELETE: 'trash',
  REFRESH: 'refresh',
  SEARCH: 'search',
  FILTER: 'funnel',
  SETTINGS: 'settings',
} as const;

// 상태 아이콘
export const STATE_ICONS = {
  LIKED: 'heart',
  UNLIKED: 'heart-outline',
  LOADING: 'hourglass',
  SUCCESS: 'checkmark-circle',
  ERROR: 'alert-circle',
  WARNING: 'warning',
} as const;

// 그룹 타입 아이콘
export const GROUP_TYPE_ICONS = {
  OFFICIAL: 'business',
  CREATED: 'people',
  INSTANCE: 'time',
  LOCATION: 'location',
} as const;

// 기타 UI 아이콘
export const UI_ICONS = {
  ARROW_RIGHT: 'chevron-forward',
  ARROW_LEFT: 'chevron-back',
  ARROW_UP: 'chevron-up',
  ARROW_DOWN: 'chevron-down',
  CLOSE: 'close',
  MENU: 'menu',
  NOTIFICATION: 'notifications',
  CAMERA: 'camera',
  IMAGE: 'image',
  SEND: 'send',
  CHAT: 'chatbubble',
} as const;

// 타입 정의
export type NavigationIconName = typeof NAVIGATION_ICONS[keyof typeof NAVIGATION_ICONS];
export type ActionIconName = typeof ACTION_ICONS[keyof typeof ACTION_ICONS];
export type StateIconName = typeof STATE_ICONS[keyof typeof STATE_ICONS];
export type GroupTypeIconName = typeof GROUP_TYPE_ICONS[keyof typeof GROUP_TYPE_ICONS];
export type UIIconName = typeof UI_ICONS[keyof typeof UI_ICONS];

// 모든 아이콘 타입
export type IconName = NavigationIconName | ActionIconName | StateIconName | GroupTypeIconName | UIIconName;