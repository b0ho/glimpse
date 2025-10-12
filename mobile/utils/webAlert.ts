/**
 * 크로스 플랫폼 Alert 유틸리티
 * @module utils/webAlert
 * @description Web과 Native 플랫폼 모두에서 작동하는 통합 Alert 인터페이스
 *
 * 주요 기능:
 * - Web: window.alert / window.confirm 사용
 * - Native: React Native Alert API 사용
 * - 플랫폼별 차이를 추상화한 일관된 API
 *
 * @example
 * import { showAlert } from '@/utils/webAlert';
 *
 * // 단순 알림
 * showAlert('알림', '저장되었습니다');
 *
 * // 확인/취소 버튼
 * showAlert('확인', '삭제하시겠습니까?', [
 *   { text: '취소', style: 'cancel' },
 *   { text: '삭제', style: 'destructive', onPress: () => handleDelete() }
 * ]);
 */
import { Alert, Platform } from 'react-native';

/**
 * Alert 버튼 인터페이스
 * @interface AlertButton
 */
interface AlertButton {
  /** 버튼 텍스트 */
  text?: string;
  /** 버튼 클릭 시 콜백 함수 */
  onPress?: () => void;
  /** 버튼 스타일 (기본, 취소, 파괴적 액션) */
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * 웹 호환 Alert 객체
 * @namespace WebCompatibleAlert
 * @description Web과 Native에서 통일된 Alert API 제공
 */
export const WebCompatibleAlert = {
  /**
   * 플랫폼에 맞는 Alert를 표시합니다
   *
   * @description
   * Web에서는 최대 2개의 버튼(confirm/cancel)만 지원.
   * Native에서는 React Native Alert API 사용.
   *
   * @param {string} title - Alert 제목
   * @param {string} [message] - Alert 메시지
   * @param {AlertButton[]} [buttons] - 버튼 배열
   * @param {any} [options] - Native Alert 옵션
   *
   * @example
   * WebCompatibleAlert.alert('저장', '변경사항을 저장하시겠습니까?', [
   *   { text: '취소', style: 'cancel' },
   *   { text: '저장', onPress: () => save() }
   * ]);
   */
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: any
  ) => {
    if (Platform.OS === 'web') {
      // 웹 플랫폼에서의 처리
      if (!buttons || buttons.length === 0) {
        // 단순 알림
        window.alert(`${title}${message ? '\n\n' + message : ''}`);
        return;
      }

      if (buttons.length === 1) {
        // 확인 버튼만 있는 경우
        window.alert(`${title}${message ? '\n\n' + message : ''}`);
        const button = buttons[0];
        if (button.onPress) {
          button.onPress();
        }
        return;
      }

      if (buttons.length === 2) {
        // 확인/취소 버튼이 있는 경우
        const confirmed = window.confirm(`${title}${message ? '\n\n' + message : ''}`);
        
        // 취소 버튼 찾기 (style이 'cancel'인 버튼)
        const cancelButton = buttons.find(b => b.style === 'cancel');
        const confirmButton = buttons.find(b => b.style !== 'cancel');
        
        if (confirmed && confirmButton?.onPress) {
          confirmButton.onPress();
        } else if (!confirmed && cancelButton?.onPress) {
          cancelButton.onPress();
        }
        return;
      }

      // 3개 이상의 버튼이 있는 경우 (웹에서는 제한적)
      // 첫 두 버튼만 사용
      const confirmed = window.confirm(`${title}${message ? '\n\n' + message : ''}`);
      if (confirmed && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!confirmed && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      // 네이티브 플랫폼에서는 기본 Alert 사용
      Alert.alert(title, message, buttons, options);
    }
  },
};

/**
 * WebCompatibleAlert.alert의 단축 함수
 * @function showAlert
 * @description 더 간단하게 사용할 수 있는 Alert 함수 별칭
 *
 * @example
 * import { showAlert } from '@/utils/webAlert';
 * showAlert('알림', '완료되었습니다');
 */
export const showAlert = WebCompatibleAlert.alert;