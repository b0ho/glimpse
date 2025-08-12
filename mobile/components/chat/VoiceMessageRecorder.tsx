import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { audioService } from '../../services/audioService';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

/**
 * VoiceMessageRecorder 컴포넌트 Props
 * @interface VoiceMessageRecorderProps
 */
interface VoiceMessageRecorderProps {
  /** 음성 메시지 전송 핸들러 */
  onSend: (audioUri: string, duration: number) => void;
  /** 녹음 취소 핸들러 */
  onCancel: () => void;
}

/**
 * 음성 메시지 녹음 컴포넌트 - 음성 메시지 녹음 및 전송
 * @component
 * @param {VoiceMessageRecorderProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 음성 녹음 UI
 * @description 음성 녹음, 일시정지, 재개, 취소 및 전송 기능을 제공하는 컴포넌트
 */
export const VoiceMessageRecorder= ({
  onSend,
  onCancel,
}) => {
  const { t } = useTranslation('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audioService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // 녹음 중일 때 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 녹음 시간 업데이트
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      animatedValue.stopAnimation();
      animatedValue.setValue(1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused, animatedValue]);

  /**
   * 음성 녹음 시작
   * @returns {Promise<void>}
   */
  const startRecording = async () => {
    try {
      await audioService.startRecording({
        maxDuration: 300, // 최대 5분
        quality: 'high',
      });
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      Alert.alert(t('errors.error'), t('voiceRecording.recordingError'));
    }
  };

  /**
   * 음성 녹음 중지 및 전송
   * @returns {Promise<void>}
   */
  const stopRecording = async () => {
    try {
      const result = await audioService.stopRecording();
      if (result && result.duration > 1) {
        // 1초 이상 녹음된 경우만 전송
        onSend(result.uri, result.duration);
      } else {
        Alert.alert(t('status.notification'), t('voiceRecording.tooShort'));
      }
    } catch (error) {
      Alert.alert(t('errors.error'), t('voiceRecording.saveError'));
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
    }
  };

  /**
   * 음성 녹음 일시정지
   * @returns {Promise<void>}
   */
  const pauseRecording = async () => {
    try {
      await audioService.pauseRecording();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  /**
   * 음성 녹음 재개
   * @returns {Promise<void>}
   */
  const resumeRecording = async () => {
    try {
      await audioService.resumeRecording();
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  /**
   * 음성 녹음 취소
   * @returns {Promise<void>}
   */
  const cancelRecording = async () => {
    try {
      await audioService.stopRecording();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      onCancel();
    }
  };

  /**
   * 녹음 시간 포맷팅
   * @param {number} seconds - 초 단위 시간
   * @returns {string} 포맷된 시간 문자열 (mm:ss)
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
        <Ionicons name="mic" size={24} color={COLORS.white} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.recordingContainer}>
        <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={COLORS.error} />
        </TouchableOpacity>

        <View style={styles.recordingInfo}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              {
                transform: [{ scale: animatedValue }],
              },
            ]}
          />
          <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
        </View>

        <View style={styles.controls}>
          {isPaused ? (
            <TouchableOpacity onPress={resumeRecording} style={styles.controlButton}>
              <Ionicons name="play" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pauseRecording} style={styles.controlButton}>
              <Ionicons name="pause" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={stopRecording} style={styles.sendButton}>
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 음성 파형 시각화 (간단한 버전) */}
      <View style={styles.waveform}>
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.waveBar,
              {
                height: Math.random() * 30 + 10,
                opacity: isRecording && !isPaused ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  cancelButton: {
    padding: SIZES.base,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    marginRight: SIZES.base,
  },
  duration: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 40,
    paddingHorizontal: SIZES.padding,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
});