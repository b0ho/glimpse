import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { audioService } from '../../services/audioService';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { AVPlaybackStatus } from 'expo-audio';

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
export const VoiceMessagePlayer= ({
  uri,
  duration,
  isOwnMessage = false,
}) => {
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
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage,
    ]}>
      <TouchableOpacity
        onPress={handlePlayPause}
        style={styles.playButton}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOwnMessage ? COLORS.white : COLORS.primary} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={isOwnMessage ? COLORS.white : COLORS.primary}
          />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={playbackDuration}
          value={currentPosition}
          onSlidingComplete={handleSliderValueChange}
          minimumTrackTintColor={isOwnMessage ? COLORS.white : COLORS.primary}
          maximumTrackTintColor={isOwnMessage ? 'rgba(255,255,255,0.3)' : COLORS.lightGray}
          thumbTintColor={isOwnMessage ? COLORS.white : COLORS.primary}
        />
        <Text style={[
          styles.duration,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {formatTime(currentPosition)} / {formatTime(playbackDuration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    minWidth: 250,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: COLORS.lightGray,
    alignSelf: 'flex-start',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  waveformContainer: {
    flex: 1,
  },
  slider: {
    height: 40,
  },
  duration: {
    ...FONTS.body5,
    marginTop: -8,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.gray,
  },
});