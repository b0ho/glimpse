import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface AudioRecordingOptions {
  maxDuration?: number; // 최대 녹음 시간 (초)
  quality?: 'low' | 'medium' | 'high';
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingOptions: Audio.RecordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  };

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // 녹음 권한 요청
  async requestRecordingPermission(): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Failed to request recording permission:', error);
      return false;
    }
  }

  // 녹음 시작
  async startRecording(options?: AudioRecordingOptions): Promise<void> {
    try {
      const hasPermission = await this.requestRecordingPermission();
      if (!hasPermission) {
        throw new Error('Recording permission not granted');
      }

      // 이전 녹음이 있으면 정지
      if (this.recording) {
        await this.stopRecording();
      }

      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 품질에 따라 옵션 조정
      const recordingOptions = { ...this.recordingOptions };
      if (options?.quality === 'low') {
        recordingOptions.android.bitRate = 64000;
        recordingOptions.ios.bitRate = 64000;
      } else if (options?.quality === 'medium') {
        recordingOptions.android.bitRate = 96000;
        recordingOptions.ios.bitRate = 96000;
      }

      // 녹음 준비
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      this.recording = recording;

      // 최대 녹음 시간 설정
      if (options?.maxDuration) {
        setTimeout(() => {
          this.stopRecording();
        }, options.maxDuration * 1000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  // 녹음 정지
  async stopRecording(): Promise<{ uri: string; duration: number } | null> {
    try {
      if (!this.recording) {
        return null;
      }

      const status = await this.recording.getStatusAsync();
      await this.recording.stopAndUnloadAsync();

      const uri = this.recording.getURI();
      const duration = status.durationMillis / 1000; // 초 단위로 변환

      // 오디오 모드 리셋
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      return { uri, duration };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      throw error;
    }
  }

  // 녹음 일시정지
  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.pauseAsync();
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  // 녹음 재개
  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.startAsync();
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  // 녹음 상태 가져오기
  async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    try {
      if (!this.recording) {
        return null;
      }

      return await this.recording.getStatusAsync();
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  // 오디오 재생
  async playSound(uri: string, onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void): Promise<void> {
    try {
      // 이전 사운드가 있으면 정지
      if (this.sound) {
        await this.stopSound();
      }

      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 사운드 로드 및 재생
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      this.sound = sound;
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  // 오디오 일시정지
  async pauseSound(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No active sound');
      }

      await this.sound.pauseAsync();
    } catch (error) {
      console.error('Failed to pause sound:', error);
      throw error;
    }
  }

  // 오디오 재개
  async resumeSound(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No active sound');
      }

      await this.sound.playAsync();
    } catch (error) {
      console.error('Failed to resume sound:', error);
      throw error;
    }
  }

  // 오디오 정지
  async stopSound(): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    } catch (error) {
      console.error('Failed to stop sound:', error);
      this.sound = null;
    }
  }

  // 재생 상태 가져오기
  async getPlaybackStatus(): Promise<AVPlaybackStatus | null> {
    try {
      if (!this.sound) {
        return null;
      }

      return await this.sound.getStatusAsync();
    } catch (error) {
      console.error('Failed to get playback status:', error);
      return null;
    }
  }

  // 재생 위치 설정
  async setPlaybackPosition(positionMillis: number): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No active sound');
      }

      await this.sound.setPositionAsync(positionMillis);
    } catch (error) {
      console.error('Failed to set playback position:', error);
      throw error;
    }
  }

  // 파일 크기 가져오기
  async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? fileInfo.size || 0 : 0;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  // 임시 파일 삭제
  async deleteTempFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete temp file:', error);
    }
  }

  // 오디오 파일을 base64로 변환
  async convertToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Failed to convert to base64:', error);
      throw error;
    }
  }

  // 리소스 정리
  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        await this.stopRecording();
      }
      if (this.sound) {
        await this.stopSound();
      }
    } catch (error) {
      console.error('Failed to cleanup audio resources:', error);
    }
  }
}

export const audioService = new AudioService();