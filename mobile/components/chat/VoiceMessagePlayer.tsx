import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { audioService } from '../../services/audioService';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { Audio, AVPlaybackStatus } from 'expo-av';

interface VoiceMessagePlayerProps {
  uri: string;
  duration: number;
  isOwnMessage?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
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

  const handleSliderValueChange = async (value: number) => {
    try {
      await audioService.setPlaybackPosition(value * 1000);
      setCurrentPosition(value);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

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