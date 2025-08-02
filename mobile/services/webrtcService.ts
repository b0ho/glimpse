import { 
  MediaStream,
  MediaStreamTrack,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices
} from 'react-native-webrtc';
import { io } from '../services/chat/socketService';
import { createError } from '../utils/error';

/**
 * WebRTC 설정 인터페이스
 * @interface WebRTCConfig
 * @property {Array} iceServers - ICE 서버 목록
 */
interface WebRTCConfig {
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

/**
 * 통화 상태 인터페이스
 * @interface CallState
 * @property {string} callId - 통화 ID
 * @property {string} remoteUserId - 상대방 사용자 ID
 * @property {MediaStream | null} localStream - 로컬 미디어 스트림
 * @property {MediaStream | null} remoteStream - 원격 미디어 스트림
 * @property {RTCPeerConnection | null} peerConnection - Peer 연결
 * @property {boolean} isVideoEnabled - 비디오 활성화 여부
 * @property {boolean} isAudioEnabled - 오디오 활성화 여부
 * @property {'video' | 'audio'} callType - 통화 유형
 * @property {string} callStatus - 통화 상태
 */
interface CallState {
  callId: string;
  remoteUserId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  callType: 'video' | 'audio';
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
}

/**
 * WebRTC 서비스 클래스
 * @class WebRTCService
 * @description WebRTC를 사용한 음성/영상 통화 기능 구현
 */
class WebRTCService {
  /** WebRTC 설정 */
  private config: WebRTCConfig = {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
    ]
  };

  /** 통화 상태 */
  private callState: CallState = {
    callId: '',
    remoteUserId: '',
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    callType: 'video',
    callStatus: 'idle'
  };

  /** 원격 스트림 콜백 */
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  /** 통화 종료 콜백 */
  private onCallEndedCallback?: () => void;
  /** 통화 상태 변경 콜백 */
  private onCallStatusChangedCallback?: (status: CallState['callStatus']) => void;

  /**
   * WebRTCService 생성자
   * @constructor
   * @description Socket 리스너 설정
   */
  constructor() {
    this.setupSocketListeners();
  }

  /**
   * Socket 리스너 설정
   * @private
   * @description WebRTC 시그널링을 위한 Socket.IO 이벤트 리스너 등록
   */
  private setupSocketListeners() {
    // Listen for incoming call offers
    io.on('call-offer', async (data: {
      callId: string;
      fromUserId: string;
      offer: any;
      callType: 'video' | 'audio';
    }) => {
      await this.handleIncomingCall(data);
    });

    // Listen for call answers
    io.on('call-answer', async (data: {
      answer: any;
    }) => {
      await this.handleCallAnswer(data.answer);
    });

    // Listen for ICE candidates
    io.on('ice-candidate', async (data: {
      candidate: any;
    }) => {
      await this.handleIceCandidate(data.candidate);
    });

    // Listen for call end
    io.on('call-ended', () => {
      this.endCall();
    });
  }

  /**
   * 통화 시작
   * @async
   * @param {string} remoteUserId - 상대방 사용자 ID
   * @param {'video' | 'audio'} [callType='video'] - 통화 유형
   * @returns {Promise<string>} 통화 ID
   * @throws {Error} 통화 시작 실패 시
   * @description WebRTC 연결을 시작하고 offer를 생성하여 전송
   */
  async initiateCall(remoteUserId: string, callType: 'video' | 'audio' = 'video'): Promise<string> {
    try {
      // Generate call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update call state
      this.callState = {
        ...this.callState,
        callId,
        remoteUserId,
        callType,
        callStatus: 'calling'
      };

      // Get local stream
      await this.setupLocalStream(callType === 'video');

      // Create peer connection
      await this.createPeerConnection();

      // Create offer
      const offer = await this.callState.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      await this.callState.peerConnection!.setLocalDescription(offer);

      // Send offer via Socket.IO
      io.emit('call-offer', {
        callId,
        toUserId: remoteUserId,
        offer,
        callType
      });

      this.updateCallStatus('calling');
      return callId;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      this.endCall();
      throw error;
    }
  }

  /**
   * 로컬 미디어 스트림 설정
   * @private
   * @async
   * @param {boolean} includeVideo - 비디오 포함 여부
   * @returns {Promise<MediaStream>} 미디어 스트림
   * @throws {Error} 미디어 접근 권한 없음
   * @description 카메라와 마이크 접근 권한을 요청하고 스트림 생성
   */
  private async setupLocalStream(includeVideo: boolean) {
    try {
      const constraints = {
        audio: true,
        video: includeVideo ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      const stream = await mediaDevices.getUserMedia(constraints);
      this.callState.localStream = stream;
      this.callState.isVideoEnabled = includeVideo;
      this.callState.isAudioEnabled = true;

      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw createError(403, '카메라 또는 마이크 권한이 필요합니다.');
    }
  }

  /**
   * Peer 연결 생성
   * @private
   * @async
   * @throws {Error} 연결 생성 실패 시
   * @description RTCPeerConnection을 생성하고 이벤트 핸들러 설정
   */
  private async createPeerConnection() {
    try {
      const pc = new RTCPeerConnection(this.config);

      // Add local stream tracks
      if (this.callState.localStream) {
        this.callState.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.callState.localStream!);
        });
      }

      // Handle remote stream
      (pc as any).onaddstream = (event: any) => {
        if (event.stream) {
          this.callState.remoteStream = event.stream;
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(event.stream);
          }
        }
      };

      // Handle ICE candidates  
      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          io.emit('ice-candidate', {
            toUserId: this.callState.remoteUserId,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      (pc as any).oniceconnectionstatechange = () => {
        const state = (pc as any).iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          this.updateCallStatus('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          this.endCall();
        }
      };

      this.callState.peerConnection = pc;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      throw error;
    }
  }

  /**
   * 수신 통화 처리
   * @private
   * @async
   * @param {Object} data - 통화 데이터
   * @param {string} data.callId - 통화 ID
   * @param {string} data.fromUserId - 발신자 ID
   * @param {any} data.offer - WebRTC offer
   * @param {'video' | 'audio'} data.callType - 통화 유형
   * @description 수신된 WebRTC offer를 처리하고 연결 준비
   */
  private async handleIncomingCall(data: {
    callId: string;
    fromUserId: string;
    offer: any;
    callType: 'video' | 'audio';
  }) {
    try {
      // Update call state
      this.callState = {
        ...this.callState,
        callId: data.callId,
        remoteUserId: data.fromUserId,
        callType: data.callType,
        callStatus: 'ringing'
      };

      // Setup local stream
      await this.setupLocalStream(data.callType === 'video');

      // Create peer connection
      await this.createPeerConnection();

      // Set remote description
      await this.callState.peerConnection!.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      this.updateCallStatus('ringing');
    } catch (error) {
      console.error('Failed to handle incoming call:', error);
      this.rejectCall();
    }
  }

  /**
   * 수신 통화 수락
   * @async
   * @throws {Error} 수락할 통화가 없거나 실패 시
   * @description WebRTC answer를 생성하여 전송하고 통화 연결
   */
  async acceptCall() {
    try {
      if (this.callState.callStatus !== 'ringing' || !this.callState.peerConnection) {
        throw new Error('No incoming call to accept');
      }

      // Create answer
      const answer = await this.callState.peerConnection.createAnswer();
      await this.callState.peerConnection.setLocalDescription(answer);

      // Send answer via Socket.IO
      io.emit('call-answer', {
        toUserId: this.callState.remoteUserId,
        answer
      });

      this.updateCallStatus('connected');
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.endCall();
      throw error;
    }
  }

  /**
   * 수신 통화 거절
   * @description 수신 통화를 거절하고 연결 종료
   */
  rejectCall() {
    io.emit('call-rejected', {
      toUserId: this.callState.remoteUserId,
      callId: this.callState.callId
    });
    this.endCall();
  }

  /**
   * 통화 응답 처리
   * @private
   * @async
   * @param {any} answer - WebRTC answer
   * @description 수신된 answer를 처리하여 연결 완성
   */
  private async handleCallAnswer(answer: any) {
    try {
      if (!this.callState.peerConnection) {
        throw new Error('No peer connection');
      }

      await this.callState.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      this.updateCallStatus('connected');
    } catch (error) {
      console.error('Failed to handle call answer:', error);
      this.endCall();
    }
  }

  /**
   * ICE candidate 처리
   * @private
   * @async
   * @param {any} candidate - ICE candidate
   * @description 수신된 ICE candidate를 연결에 추가
   */
  private async handleIceCandidate(candidate: any) {
    try {
      if (!this.callState.peerConnection) {
        return;
      }

      await this.callState.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * 비디오 토글
   * @returns {boolean | undefined} 비디오 활성화 상태
   * @description 비디오 트랙을 켜거나 끄기
   */
  toggleVideo() {
    if (!this.callState.localStream) return;

    const videoTrack = this.callState.localStream
      .getTracks()
      .find(track => track.kind === 'video');

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.callState.isVideoEnabled = videoTrack.enabled;
    }

    return this.callState.isVideoEnabled;
  }

  /**
   * 오디오 토글
   * @returns {boolean | undefined} 오디오 활성화 상태
   * @description 오디오 트랙을 켜거나 끄기
   */
  toggleAudio() {
    if (!this.callState.localStream) return;

    const audioTrack = this.callState.localStream
      .getTracks()
      .find(track => track.kind === 'audio');

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.callState.isAudioEnabled = audioTrack.enabled;
    }

    return this.callState.isAudioEnabled;
  }

  /**
   * 카메라 전환
   * @async
   * @description 전면/후면 카메라 전환
   */
  async switchCamera() {
    if (!this.callState.localStream || this.callState.callType !== 'video') return;

    const videoTrack = this.callState.localStream
      .getTracks()
      .find(track => track.kind === 'video');

    if (videoTrack) {
      // @ts-ignore - _switchCamera is available in react-native-webrtc
      videoTrack._switchCamera();
    }
  }

  /**
   * 통화 종료
   * @description 모든 스트림과 연결을 정리하고 통화 종료
   */
  endCall() {
    // Send call ended event
    if (this.callState.remoteUserId && this.callState.callStatus !== 'idle') {
      io.emit('call-ended', {
        toUserId: this.callState.remoteUserId,
        callId: this.callState.callId
      });
    }

    // Clean up streams
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => track.stop());
      this.callState.localStream = null;
    }

    if (this.callState.remoteStream) {
      this.callState.remoteStream.getTracks().forEach(track => track.stop());
      this.callState.remoteStream = null;
    }

    // Clean up peer connection
    if (this.callState.peerConnection) {
      this.callState.peerConnection.close();
      this.callState.peerConnection = null;
    }

    // Reset call state
    this.callState = {
      callId: '',
      remoteUserId: '',
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      callType: 'video',
      callStatus: 'idle'
    };

    this.updateCallStatus('ended');

    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }
  }

  /**
   * 통화 상태 업데이트
   * @private
   * @param {CallState['callStatus']} status - 새로운 상태
   * @description 통화 상태를 업데이트하고 콜백 호출
   */
  private updateCallStatus(status: CallState['callStatus']) {
    this.callState.callStatus = status;
    if (this.onCallStatusChangedCallback) {
      this.onCallStatusChangedCallback(status);
    }
  }

  /**
   * 로컬 스트림 가져오기
   * @returns {MediaStream | null} 로컬 미디어 스트림
   */
  getLocalStream() {
    return this.callState.localStream;
  }

  /**
   * 원격 스트림 가져오기
   * @returns {MediaStream | null} 원격 미디어 스트림
   */
  getRemoteStream() {
    return this.callState.remoteStream;
  }

  /**
   * 통화 상태 가져오기
   * @returns {CallState['callStatus']} 현재 통화 상태
   */
  getCallStatus() {
    return this.callState.callStatus;
  }

  /**
   * 전체 통화 상태 가져오기
   * @returns {CallState} 현재 통화 상태 전체
   */
  getCallState() {
    return { ...this.callState };
  }

  /**
   * 원격 스트림 이벤트 리스너 등록
   * @param {Function} callback - 원격 스트림 콜백
   * @description 원격 스트림이 수신될 때 호출될 콜백 등록
   */
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * 통화 종료 이벤트 리스너 등록
   * @param {Function} callback - 통화 종료 콜백
   * @description 통화가 종료될 때 호출될 콜백 등록
   */
  onCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback;
  }

  /**
   * 통화 상태 변경 이벤트 리스너 등록
   * @param {Function} callback - 상태 변경 콜백
   * @description 통화 상태가 변경될 때 호출될 콜백 등록
   */
  onCallStatusChanged(callback: (status: CallState['callStatus']) => void) {
    this.onCallStatusChangedCallback = callback;
  }

  /**
   * 리소스 정리
   * @description 모든 통화를 종료하고 Socket 리스너 제거
   */
  cleanup() {
    this.endCall();
    io.off('call-offer');
    io.off('call-answer');
    io.off('ice-candidate');
    io.off('call-ended');
  }
}

/**
 * WebRTC 서비스 싱글톤 인스턴스
 * @constant {WebRTCService}
 * @description 앱 전체에서 사용할 WebRTC 서비스 인스턴스
 */
export const webRTCService = new WebRTCService();