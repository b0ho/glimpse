/**
 * Expo 패키지 타입 정의
 * @description expo-audio, expo-video 패키지의 누락된 타입 선언
 */

declare module 'expo-audio' {
  import { ComponentType } from 'react';

  /**
   * 재생 상태 인터페이스
   */
  export interface AVPlaybackStatus {
    isLoaded: boolean;
    uri?: string;
    progressUpdateIntervalMillis?: number;
    durationMillis?: number;
    positionMillis?: number;
    playableDurationMillis?: number;
    seekMillisToleranceBefore?: number;
    seekMillisToleranceAfter?: number;
    shouldPlay?: boolean;
    isPlaying?: boolean;
    isBuffering?: boolean;
    rate?: number;
    shouldCorrectPitch?: boolean;
    volume?: number;
    isMuted?: boolean;
    isLooping?: boolean;
    didJustFinish?: boolean;
    error?: string;
  }

  /**
   * Audio 네임스페이스
   */
  export namespace Audio {
    /**
     * 녹음 상태 인터페이스
     */
    export interface RecordingStatus {
      canRecord: boolean;
      isRecording: boolean;
      isDoneRecording: boolean;
      durationMillis: number;
      metering?: number;
      uri?: string;
    }

    /**
     * 녹음 옵션
     */
    export interface RecordingOptions {
      android?: {
        extension?: string;
        outputFormat?: number;
        audioEncoder?: number;
        sampleRate?: number;
        numberOfChannels?: number;
        bitRate?: number;
      };
      ios?: {
        extension?: string;
        outputFormat?: number | string;
        audioQuality?: number;
        sampleRate?: number;
        numberOfChannels?: number;
        bitRate?: number;
        linearPCMBitDepth?: number;
        linearPCMIsBigEndian?: boolean;
        linearPCMIsFloat?: boolean;
      };
      web?: {
        mimeType?: string;
        bitsPerSecond?: number;
      };
    }
    /**
     * 녹음 클래스
     */
    export class Recording {
      prepareToRecordAsync(options: RecordingOptions): Promise<void>;
      startAsync(): Promise<void>;
      pauseAsync(): Promise<void>;
      stopAndUnloadAsync(): Promise<void>;
      getStatusAsync(): Promise<RecordingStatus>;
      getURI(): string | null;
    }

    /**
     * 사운드 클래스
     */
    export class Sound {
      static createAsync(
        source: { uri: string },
        initialStatus?: { shouldPlay?: boolean },
        onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void
      ): Promise<{ sound: Sound }>;

      playAsync(): Promise<void>;
      pauseAsync(): Promise<void>;
      stopAsync(): Promise<void>;
      unloadAsync(): Promise<void>;
      getStatusAsync(): Promise<AVPlaybackStatus>;
      setPositionAsync(positionMillis: number): Promise<void>;
    }

    /**
     * Android 출력 포맷
     */
    export enum AndroidOutputFormat {
      DEFAULT = 0,
      THREE_GPP = 1,
      MPEG_4 = 2,
      AMR_NB = 3,
      AMR_WB = 4,
      AAC_ADTS = 6,
      MPEG_2_TS = 8,
      WEBM = 9,
    }

    /**
     * Android 오디오 인코더
     */
    export enum AndroidAudioEncoder {
      DEFAULT = 0,
      AMR_NB = 1,
      AMR_WB = 2,
      AAC = 3,
      HE_AAC = 4,
      AAC_ELD = 5,
    }

    /**
     * iOS 출력 포맷
     */
    export enum IOSOutputFormat {
      LINEARPCM = 'lpcm',
      AC3 = 'ac-3',
      MPEG4AAC = 'aac ',
      MPEGLAYER1 = '.mp1',
      MPEGLAYER2 = '.mp2',
      MPEGLAYER3 = '.mp3',
      APPLEIMA4 = 'ima4',
    }

    /**
     * iOS 오디오 품질
     */
    export enum IOSAudioQuality {
      MIN = 0,
      LOW = 0x20,
      MEDIUM = 0x40,
      HIGH = 0x60,
      MAX = 0x7f,
    }

    /**
     * 오디오 모드 설정
     */
    export function setAudioModeAsync(mode: {
      allowsRecordingIOS?: boolean;
      playsInSilentModeIOS?: boolean;
      staysActiveInBackground?: boolean;
      shouldDuckAndroid?: boolean;
      playThroughEarpieceAndroid?: boolean;
    }): Promise<void>;

    /**
     * 권한 요청
     */
    export function requestPermissionsAsync(): Promise<{
      status: 'granted' | 'denied' | 'undetermined';
      canAskAgain: boolean;
      granted: boolean;
      expires: 'never' | number;
    }>;
  }
}

declare module 'expo-video' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  /**
   * 비디오 속성
   */
  export interface VideoProps {
    source: { uri: string };
    style?: ViewStyle;
    resizeMode?: ResizeMode;
    shouldPlay?: boolean;
    isLooping?: boolean;
    onPlaybackStatusUpdate?: (status: any) => void;
    ref?: any;
  }

  /**
   * 비디오 컴포넌트
   */
  export const Video: ComponentType<VideoProps>;

  /**
   * 비디오 리사이즈 모드
   */
  export enum ResizeMode {
    CONTAIN = 'contain',
    COVER = 'cover',
    STRETCH = 'stretch',
  }
}
