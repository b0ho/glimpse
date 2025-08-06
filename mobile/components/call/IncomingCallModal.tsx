import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Vibration,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

/**
 * IncomingCallModal 컴포넌트 Props
 * @interface IncomingCallModalProps
 */
interface IncomingCallModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 통화 요청자 이름 */
  callerName: string;
  /** 통화 타입 */
  callType: 'video' | 'audio';
  /** 통화 수락 핸들러 */
  onAccept: () => void;
  /** 통화 거절 핸들러 */
  onReject: () => void;
}

/**
 * 수신 전화 모달 컴포넌트 - 음성/영상 통화 수신 알림
 * @component
 * @param {IncomingCallModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 수신 전화 모달 UI
 * @description 통화 수신 시 표시되는 모달로 진동과 애니메이션 효과 포함
 */
export const IncomingCallModal = ({
  visible,
  callerName,
  callType,
  onAccept,
  onReject,
}: IncomingCallModalProps) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // Start vibration pattern
      const pattern = [0, 200, 100, 200];
      Vibration.vibrate(pattern, true);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop vibration when modal is hidden
      Vibration.cancel();
    }

    return () => {
      Vibration.cancel();
    };
  }, [visible, pulseAnim]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.callCard}>
          <Text style={styles.incomingCallText}>수신 전화</Text>
          
          <Animated.View 
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.avatarText}>
              {callerName.charAt(0).toUpperCase()}
            </Text>
          </Animated.View>

          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callTypeText}>
            {callType === 'video' ? '영상 통화' : '음성 통화'}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <Ionicons name="close" size={30} color={COLORS.white} />
              <Text style={styles.actionButtonText}>거절</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={30} 
                color={COLORS.white} 
              />
              <Text style={styles.actionButtonText}>수락</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callCard: {
    backgroundColor: COLORS.darkgray,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
  },
  incomingCallText: {
    ...FONTS.body3,
    color: COLORS.lightGray,
    marginBottom: SIZES.padding,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  avatarText: {
    ...FONTS.h1,
    color: COLORS.white,
    fontSize: 40,
  },
  callerName: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SIZES.base,
  },
  callTypeText: {
    ...FONTS.body3,
    color: COLORS.lightGray,
    marginBottom: SIZES.padding * 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.base,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
});