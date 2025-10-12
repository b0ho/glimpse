/**
 * 통화 버튼 컴포넌트
 *
 * @module CallButton
 * @description 채팅 화면에서 음성/영상 통화를 시작하는 버튼 컴포넌트
 */

import React from 'react';
import { TouchableOpacity, Text} from 'react-native';

/**
 * CallButton Props 인터페이스
 *
 * @interface CallButtonProps
 */
interface CallButtonProps {
  /** 통화 타입 (영상/음성) */
  type: 'video' | 'audio';
  /** 버튼 클릭 핸들러 */
  onPress: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 통화 버튼 컴포넌트
 *
 * @component
 * @param {CallButtonProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 통화 버튼 UI
 *
 * @description
 * 채팅 화면에서 음성 또는 영상 통화를 시작할 수 있는 버튼을 제공합니다.
 *
 * @example
 * ```tsx
 * <CallButton
 *   type="video"
 *   onPress={() => startVideoCall()}
 *   disabled={false}
 * />
 * ```
 *
 * @category Component
 * @subcategory Call
 */
export const CallButton: React.FC<CallButtonProps> = ({ type, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      className="button" 
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text">{type === 'video' ? '영상통화' : '음성통화'}</Text>
    </TouchableOpacity>
  );
};

