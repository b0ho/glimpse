import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { audioService } from '../../services/audioService';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

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
export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSend,
  onCancel,
}) => {
  const { t } = useAndroidSafeTranslation('chat');
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      Alert.alert(t('common:errors.error'), t('voiceRecording:voiceRecording.recordingError'));
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
        Alert.alert(t('common:status.notification'), t('voiceRecording:voiceRecording.tooShort'));
      }
    } catch (error) {
      Alert.alert(t('common:errors.error'), t('voiceRecording:voiceRecording.saveError'));
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
      <TouchableOpacity 
        className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center"
        onPress={startRecording}
      >
        <Ionicons name="mic" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity 
          onPress={cancelRecording} 
          className="p-2"
        >
          <Ionicons name="close" size={24} color={colors.ERROR} />
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 justify-center">
          <Animated.View
            className="w-3 h-3 rounded-full bg-red-500 mr-2"
            style={{
              transform: [{ scale: animatedValue }],
            }}
          />
          <Text className="text-base text-gray-900 dark:text-white">
            {formatDuration(recordingDuration)}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {isPaused ? (
            <TouchableOpacity 
              onPress={resumeRecording} 
              className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center"
            >
              <Ionicons name="play" size={20} color={colors.PRIMARY} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={pauseRecording} 
              className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center"
            >
              <Ionicons name="pause" size={20} color={colors.PRIMARY} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={stopRecording} 
            className="w-9 h-9 rounded-full bg-blue-500 justify-center items-center"
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 음성 파형 시각화 (간단한 버전) */}
      <View className="flex-row items-center justify-around h-10 px-4">
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            className={cn(
              "w-0.5 bg-blue-500 rounded-sm",
              isRecording && !isPaused ? "opacity-100" : "opacity-30"
            )}
            style={{
              height: Math.random() * 30 + 10,
            }}
          />
        ))}
      </View>
    </View>
  );
};