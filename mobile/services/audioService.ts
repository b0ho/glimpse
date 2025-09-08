import { Audio, AVPlaybackStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * 오디오 녹음 옵션 인터페이스
 * @interface AudioRecordingOptions
 * @property {number} [maxDuration] - 최대 녹음 시간 (초)
 * @property {'low' | 'medium' | 'high'} [quality] - 녹음 품질
 */
interface AudioRecordingOptions {
  maxDuration?: number; // 최대 녹음 시간 (초)
  quality?: 'low' | 'medium' | 'high';
}

/**
 * 오디오 서비스 클래스
 * @class AudioService
 * @description 오디오 녹음, 재생, 파일 관리 기능 제공
 */
class AudioService {
  /** 현재 녹음 인스턴스 */
  private recording: Audio.Recording | null = null;
  /** 현재 재생 중인 사운드 인스턴스 */
  private sound: Audio.Sound | null = null;
  /** 녹음 옵션 설정 */
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

  /**
   * AudioService 생성자
   * @constructor
   * @description 오디오 서비스 초기화
   */
  constructor() {
    this.initializeAudio();
  }

  /**
   * 오디오 초기화
   * @private
   * @async
   * @description 오디오 모드 설정 및 초기화
   */
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

  /**
   * 녹음 권한 요청
   * @async
   * @returns {Promise<boolean>} 권한 허용 여부
   * @description 오디오 녹음 권한을 요청하고 결과를 반환
   */
  async requestRecordingPermission(): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Failed to request recording permission:', error);
      return false;
    }
  }

  /**
   * 녹음 시작
   * @async
   * @param {AudioRecordingOptions} [options] - 녹음 옵션
   * @returns {Promise<void>}
   * @throws {Error} 권한이 없거나 녹음 시작 실패 시
   * @description 오디오 녹음을 시작하고 옵션에 따라 설정 적용
   */
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

  /**
   * 녹음 정지
   * @async
   * @returns {Promise<{uri: string; duration: number} | null>} 녹음 파일 URI와 길이
   * @description 현재 녹음을 정지하고 파일 정보를 반환
   */
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

  /**
   * 녹음 일시정지
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 활성 녹음이 없을 때
   * @description 현재 진행 중인 녹음을 일시정지
   */
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

  /**
   * 녹음 재개
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 활성 녹음이 없을 때
   * @description 일시정지된 녹음을 재개
   */
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

  /**
   * 녹음 상태 가져오기
   * @async
   * @returns {Promise<Audio.RecordingStatus | null>} 녹음 상태 정보
   * @description 현재 녹음의 상태 정보를 반환
   */
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

  /**
   * 오디오 재생
   * @async
   * @param {string} uri - 재생할 오디오 파일 URI
   * @param {Function} [onPlaybackStatusUpdate] - 재생 상태 업데이트 콜백
   * @returns {Promise<void>}
   * @throws {Error} 재생 실패 시
   * @description 지정된 URI의 오디오 파일을 재생
   */
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

  /**
   * 오디오 일시정지
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 활성 사운드가 없을 때
   * @description 현재 재생 중인 오디오를 일시정지
   */
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

  /**
   * 오디오 재개
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 활성 사운드가 없을 때
   * @description 일시정지된 오디오 재생을 재개
   */
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

  /**
   * 오디오 정지
   * @async
   * @returns {Promise<void>}
   * @description 현재 재생 중인 오디오를 정지하고 리소스 해제
   */
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

  /**
   * 재생 상태 가져오기
   * @async
   * @returns {Promise<AVPlaybackStatus | null>} 재생 상태 정보
   * @description 현재 재생 중인 오디오의 상태 정보를 반환
   */
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

  /**
   * 재생 위치 설정
   * @async
   * @param {number} positionMillis - 재생 위치 (밀리초)
   * @returns {Promise<void>}
   * @throws {Error} 활성 사운드가 없을 때
   * @description 오디오의 재생 위치를 지정된 시간으로 이동
   */
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

  /**
   * 파일 크기 가져오기
   * @async
   * @param {string} uri - 파일 URI
   * @returns {Promise<number>} 파일 크기 (바이트)
   * @description 지정된 URI의 파일 크기를 바이트 단위로 반환
   */
  async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? fileInfo.size || 0 : 0;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  /**
   * 임시 파일 삭제
   * @async
   * @param {string} uri - 삭제할 파일 URI
   * @returns {Promise<void>}
   * @description 지정된 URI의 임시 파일을 삭제
   */
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

  /**
   * 오디오 파일을 base64로 변환
   * @async
   * @param {string} uri - 변환할 파일 URI
   * @returns {Promise<string>} Base64 인코딩된 문자열
   * @throws {Error} 변환 실패 시
   * @description 오디오 파일을 Base64 문자열로 변환
   */
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

  /**
   * 리소스 정리
   * @async
   * @returns {Promise<void>}
   * @description 모든 오디오 리소스를 정리하고 해제
   */
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

/**
 * 오디오 서비스 싱글톤 인스턴스
 * @constant {AudioService}
 * @description 앱 전체에서 사용할 오디오 서비스 인스턴스
 */
export const audioService = new AudioService();