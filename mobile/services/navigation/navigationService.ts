import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';

/** 네비게이션 참조 객체 */
let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

/**
 * 네비게이션 서비스 객체
 * @namespace navigationService
 * @description React Navigation을 컴포넌트 외부에서 제어하기 위한 서비스
 */
export const navigationService = {
  /**
   * 네비게이션 참조 설정
   * @param {NavigationContainerRef<RootStackParamList>} ref - 네비게이션 컨테이너 참조
   * @description 앱 시작 시 네비게이션 참조를 설정
   */
  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    navigationRef = ref;
  },

  /**
   * 화면 네비게이션
   * @template RouteName
   * @param {RouteName} name - 이동할 화면 이름
   * @param {RootStackParamList[RouteName]} [params] - 화면 파라미터
   * @description 지정된 화면으로 네비게이션
   */
  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.navigate(name as any, params as any);
    }
  },

  /**
   * 이전 화면으로 돌아가기
   * @description 네비게이션 스택에서 이전 화면으로 이동
   */
  goBack() {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.goBack();
    }
  },

  /**
   * 네비게이션 스택 초기화
   * @param {any[]} routes - 새로운 라우트 배열
   * @description 네비게이션 스택을 초기화하고 새로운 라우트로 설정
   */
  reset(routes: any[]) {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes,
      });
    }
  },

  /**
   * 현재 라우트 가져오기
   * @returns {object | null} 현재 라우트 정보 또는 null
   * @description 현재 활성화된 라우트 정보를 반환
   */
  getCurrentRoute() {
    if (navigationRef && navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  },

  /**
   * 네비게이션 준비 상태 확인
   * @returns {boolean} 네비게이션 준비 여부
   * @description 네비게이션이 사용 가능한 상태인지 확인
   */
  isReady() {
    return navigationRef && navigationRef.isReady();
  }
};