import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * CallButton 컴포넌트 Props
 * @interface CallButtonProps
 */
interface CallButtonProps {
  /** 통화 타입 */
  type: 'video' | 'audio';
  /** 버튼 클릭 핸들러 */
  onPress: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 아이콘 크기 */
  size?: number;
}

/**
 * 통화 버튼 컴포넌트 - 음성/영상 통화 시작 버튼
 * @component
 * @param {CallButtonProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 통화 버튼 UI
 * @description 음성 또는 영상 통화를 시작하는 버튼 컴포넌트
 */
export const CallButton = ({
  type,
  onPress,
  disabled = false,
  loading = false,
  size = 24,
}: CallButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons
          name={type === 'video' ? 'videocam' : 'call'}
          size={size}
          color={disabled ? COLORS.gray : COLORS.primary}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});