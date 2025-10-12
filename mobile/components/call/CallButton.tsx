/**
 * CallButton 컴포넌트
 *
 * @module CallButton
 * @description 채팅 화면에서 영상통화 및 음성통화를 시작하기 위한 버튼 컴포넌트
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * CallButton Props 인터페이스
 *
 * @interface CallButtonProps
 */
interface CallButtonProps {
  /** 통화 타입 (비디오 또는 오디오) */
  type: 'video' | 'audio';
  /** 버튼 클릭 시 실행될 핸들러 */
  onPress: () => void;
  /** 버튼 비활성화 여부 */
  disabled?: boolean;
}

/**
 * CallButton 컴포넌트
 *
 * @component
 * @param {CallButtonProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 통화 버튼 UI
 *
 * @description
 * 영상통화 또는 음성통화를 시작할 수 있는 버튼을 렌더링합니다.
 * disabled 상태일 때는 투명도가 낮아지고 클릭이 불가능합니다.
 *
 * @example
 * ```tsx
 * <CallButton type="video" onPress={handleVideoCall} />
 * <CallButton type="audio" onPress={handleAudioCall} disabled={!isConnected} />
 * ```
 *
 * @category Component
 * @subcategory Call
 */
export const CallButton: React.FC<CallButtonProps> = ({ type, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{type === 'video' ? '영상통화' : '음성통화'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
});