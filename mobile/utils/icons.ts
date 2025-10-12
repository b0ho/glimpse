/**
 * 아이콘 상수 모듈
 * @module utils/icons
 * @description Ionicons 기반 아이콘 이름 상수 및 타입 정의
 *
 * 주요 기능:
 * - 네비게이션, 액션, 상태별 아이콘 분류
 * - 타입 안전성을 위한 TypeScript 타입 export
 * - 일관된 아이콘 사용을 위한 중앙 집중식 관리
 *
 * @see https://icons.expo.fyi/ - Ionicons 아이콘 목록
 *
 * @example
 * import { NAVIGATION_ICONS, UI_ICONS } from '@/utils/icons';
 * <Ionicons name={NAVIGATION_ICONS.Home} size={24} />
 * <Ionicons name={UI_ICONS.CAMERA} size={32} />
 */

/**
 * 네비게이션 탭 아이콘
 * @constant
 * @description 하단 탭 네비게이션에서 사용하는 아이콘
 */
export const NAVIGATION_ICONS = {
  Home: 'home',
  Groups: 'people',
  Interest: 'search',
  Matches: 'chatbubbles',
  Profile: 'person',
} as const;

/**
 * 액션 아이콘
 * @constant
 * @description 생성, 수정, 삭제 등 사용자 액션을 나타내는 아이콘
 */
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

/**
 * 상태 아이콘
 * @constant
 * @description 좋아요, 로딩, 성공, 에러 등 상태를 나타내는 아이콘
 */
export const STATE_ICONS = {
  LIKED: 'heart',
  UNLIKED: 'heart-outline',
  LOADING: 'hourglass',
  SUCCESS: 'checkmark-circle',
  ERROR: 'alert-circle',
  WARNING: 'warning',
} as const;

/**
 * 그룹 타입 아이콘
 * @constant
 * @description 그룹 종류(회사, 유저 생성, 인스턴스, 위치)를 나타내는 아이콘
 */
export const GROUP_TYPE_ICONS = {
  OFFICIAL: 'business',
  CREATED: 'people',
  INSTANCE: 'time',
  LOCATION: 'location',
} as const;

/**
 * 기타 UI 아이콘
 * @constant
 * @description 화살표, 닫기, 메뉴, 카메라 등 범용 UI 아이콘
 */
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

/**
 * 네비게이션 아이콘 이름 타입
 * @typedef {string} NavigationIconName
 */
export type NavigationIconName = typeof NAVIGATION_ICONS[keyof typeof NAVIGATION_ICONS];

/**
 * 액션 아이콘 이름 타입
 * @typedef {string} ActionIconName
 */
export type ActionIconName = typeof ACTION_ICONS[keyof typeof ACTION_ICONS];

/**
 * 상태 아이콘 이름 타입
 * @typedef {string} StateIconName
 */
export type StateIconName = typeof STATE_ICONS[keyof typeof STATE_ICONS];

/**
 * 그룹 타입 아이콘 이름 타입
 * @typedef {string} GroupTypeIconName
 */
export type GroupTypeIconName = typeof GROUP_TYPE_ICONS[keyof typeof GROUP_TYPE_ICONS];

/**
 * UI 아이콘 이름 타입
 * @typedef {string} UIIconName
 */
export type UIIconName = typeof UI_ICONS[keyof typeof UI_ICONS];

/**
 * 모든 아이콘 타입의 통합 타입
 * @typedef {string} IconName
 */
export type IconName = NavigationIconName | ActionIconName | StateIconName | GroupTypeIconName | UIIconName;