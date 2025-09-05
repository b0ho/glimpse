import { Alert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * 웹 플랫폼 호환 Alert 유틸리티
 * 웹에서는 브라우저 기본 confirm/alert 사용
 * 네이티브에서는 React Native Alert 사용
 */
export const WebCompatibleAlert = {
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

// 기본 Alert 대체
export const showAlert = WebCompatibleAlert.alert;