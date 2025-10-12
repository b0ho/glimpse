import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { audioService } from '../../services/audioService';
import { AVPlaybackStatus } from 'expo-audio';
import { cn } from '@/lib/utils';

/**
 * VoiceMessagePlayer 컴포넌트 Props
 * @interface VoiceMessagePlayerProps
 */
interface VoiceMessagePlayerProps {
  /** 음성 파일 URI */
  uri: string;
  /** 음성 메시지 길이(초) */
  duration: number;
  /** 내 메시지 여부 */
  isOwnMessage?: boolean;
}

/**
 * 음성 메시지 플레이어 컴포넌트 - 음성 메시지 재생 및 제어
 * @component
 * @param {VoiceMessagePlayerProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 음성 메시지 플레이어 UI
 * @description 음성 메시지를 재생하고 진행 상황을 표시하는 플레이어 컴포넌트
 */
export const VoiceMessagePlayer = ({
  uri,
  duration,
  isOwnMessage = false,
}: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(duration);

  useEffect(() => {
    return () => {
      audioService.stopSound();
    };
  }, []);

  /**
   * 재생/일시정지 토글 핸들러
   * @returns {Promise<void>}
   */
  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await audioService.pauseSound();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioService.playSound(uri, onPlaybackStatusUpdate);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to play/pause audio:', error);
      setIsLoading(false);
    }
  };

  /**
   * 재생 상태 업데이트 핸들러
   * @param {AVPlaybackStatus} status - 재생 상태
   * @returns {void}
   */
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis / 1000);
      if (status.durationMillis) {
        setPlaybackDuration(status.durationMillis / 1000);
      }
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
      }
    }
  };

  /**
   * 슬라이더 값 변경 핸들러
   * @param {number} value - 슬라이더 값(초)
   * @returns {Promise<void>}
   */
  const handleSliderValueChange = async (value: number) => {
    try {
      await audioService.setPlaybackPosition(value * 1000);
      setCurrentPosition(value);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  /**
   * 시간 포맷팅
   * @param {number} seconds - 초 단위 시간
   * @returns {string} 포맷된 시간 문자열 (mm:ss)
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className={cn(
      "flex-row items-center p-4 rounded-xl min-w-64 max-w-4/5",
      isOwnMessage 
        ? "bg-blue-500 self-end" 
        : "bg-gray-200 dark:bg-gray-700 self-start"
    )}>
      <TouchableOpacity
        onPress={handlePlayPause}
        className="w-9 h-9 rounded-full bg-black/10 justify-center items-center mr-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color={isOwnMessage ? "#FFFFFF" : "#3B82F6"} 
          />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={isOwnMessage ? "#FFFFFF" : "#3B82F6"}
          />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        <Slider
          style={{ height: 40 }}
          minimumValue={0}
          maximumValue={playbackDuration}
          value={currentPosition}
          onSlidingComplete={handleSliderValueChange}
          minimumTrackTintColor={isOwnMessage ? "#FFFFFF" : "#3B82F6"}
          maximumTrackTintColor={isOwnMessage ? "rgba(255,255,255,0.3)" : "#D1D5DB"}
          thumbTintColor={isOwnMessage ? "#FFFFFF" : "#3B82F6"}
        />
        <Text className={cn(
          "text-xs -mt-2",
          isOwnMessage ? "text-white" : "text-gray-600 dark:text-gray-300"
        )}>
          {formatTime(currentPosition)} / {formatTime(playbackDuration)}
        </Text>
      </View>
    </View>
  );
};