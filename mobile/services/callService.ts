import { io } from './chat/socketService';
import { notificationService } from './notificationService';
import { Alert } from 'react-native';

// 조건부로 webRTCService import (Expo Go 호환성)
let webRTCService: any = null;
try {
  webRTCService = require('./webrtcService').webRTCService;
} catch (error) {
  console.warn('WebRTC service not available in this environment');
}

/**
 * 통화 초대 인터페이스
 * @interface CallInvite
 * @property {string} callId - 통화 ID
 * @property {string} fromUserId - 발신자 사용자 ID
 * @property {string} fromUserName - 발신자 이름
 * @property {'video' | 'audio'} callType - 통화 유형
 * @property {number} timestamp - 타임스탬프
 */
interface CallInvite {
  callId: string;
  fromUserId: string;
  fromUserName: string;
  callType: 'video' | 'audio';
  timestamp: number;
}

/**
 * 통화 상태 인터페이스
 * @interface CallState
 * @property {CallInvite | null} activeCall - 현재 활성 통화
 * @property {boolean} isInCall - 통화 중 여부
 * @property {CallInvite | null} incomingCall - 수신 통화
 */
interface CallState {
  activeCall: CallInvite | null;
  isInCall: boolean;
  incomingCall: CallInvite | null;
}

/**
 * 통화 서비스 클래스
 * @class CallService
 * @description 음성/영상 통화 관리, Socket.IO를 통한 실시간 시그널링
 */
class CallService {
  /** 통화 상태 */
  private callState: CallState = {
    activeCall: null,
    isInCall: false,
    incomingCall: null,
  };

  /** 수신 통화 콜백 */
  private onIncomingCallCallback?: (call: CallInvite) => void;
  /** 통화 종료 콜백 */
  private onCallEndCallback?: () => void;

  /**
   * CallService 생성자
   * @constructor
   * @description Socket 리스너 설정
   */
  constructor() {
    this.setupSocketListeners();
  }

  /**
   * Socket 리스너 설정
   * @private
   * @description 통화 관련 Socket.IO 이벤트 리스너 등록
   */
  private setupSocketListeners() {
    // Listen for incoming call invites
    io.on('call-invite', (data: {
      callId: string;
      fromUserId: string;
      fromUserName: string;
      callType: 'video' | 'audio';
    }) => {
      this.handleIncomingCallInvite(data);
    });

    // Listen for call cancelled by caller
    io.on('call-cancelled', () => {
      this.clearIncomingCall();
    });

    // Listen for call rejected
    io.on('call-rejected', () => {
      Alert.alert('통화 거절됨', '상대방이 통화를 거절했습니다.');
      this.endCall();
    });

    // Listen for call timeout
    io.on('call-timeout', () => {
      Alert.alert('통화 연결 실패', '응답이 없어 통화가 취소되었습니다.');
      this.endCall();
    });
  }

  /**
   * 통화 시작
   * @async
   * @param {string} toUserId - 수신자 사용자 ID
   * @param {string} toUserName - 수신자 이름
   * @param {'video' | 'audio'} callType - 통화 유형
   * @returns {Promise<void>}
   * @description 새로운 통화를 시작하고 상대방에게 통화 초대 전송
   */
  async initiateCall(
    toUserId: string,
    toUserName: string,
    callType: 'video' | 'audio'
  ): Promise<void> {
    if (this.callState.isInCall) {
      Alert.alert('통화 중', '이미 통화 중입니다.');
      return;
    }

    try {
      // Send call invite via Socket.IO
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      io.emit('call-invite', {
        callId,
        toUserId,
        callType,
      });

      this.callState.activeCall = {
        callId,
        fromUserId: toUserId,
        fromUserName: toUserName,
        callType,
        timestamp: Date.now(),
      };
      this.callState.isInCall = true;

      // Set timeout for call invite (30 seconds)
      setTimeout(() => {
        if (this.callState.activeCall?.callId === callId && webRTCService && !webRTCService.getCallStatus()) {
          this.cancelCall();
          Alert.alert('통화 연결 실패', '응답이 없어 통화가 취소되었습니다.');
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert('오류', '통화를 시작할 수 없습니다.');
      this.endCall();
    }
  }

  /**
   * 수신 통화 초대 처리
   * @private
   * @param {Object} data - 통화 초대 데이터
   * @param {string} data.callId - 통화 ID
   * @param {string} data.fromUserId - 발신자 ID
   * @param {string} data.fromUserName - 발신자 이름
   * @param {'video' | 'audio'} data.callType - 통화 유형
   * @description 수신된 통화 초대를 처리하고 알림 표시
   */
  private handleIncomingCallInvite(data: {
    callId: string;
    fromUserId: string;
    fromUserName: string;
    callType: 'video' | 'audio';
  }) {
    if (this.callState.isInCall) {
      // Busy - reject the call
      io.emit('call-busy', {
        toUserId: data.fromUserId,
        callId: data.callId,
      });
      return;
    }

    const callInvite: CallInvite = {
      ...data,
      timestamp: Date.now(),
    };

    this.callState.incomingCall = callInvite;

    // Show notification if app is in background
    notificationService.showCallNotification(
      data.fromUserName,
      data.callType
    );

    // Trigger callback for UI
    if (this.onIncomingCallCallback) {
      this.onIncomingCallCallback(callInvite);
    }

    // Auto-reject after 30 seconds if not answered
    setTimeout(() => {
      if (this.callState.incomingCall?.callId === data.callId) {
        this.rejectCall();
      }
    }, 30000);
  }

  /**
   * 수신 통화 수락
   * @async
   * @returns {Promise<void>}
   * @description 수신된 통화를 수락하고 연결 처리
   */
  async acceptCall(): Promise<void> {
    const incomingCall = this.callState.incomingCall;
    if (!incomingCall) {
      return;
    }

    try {
      // Update call state
      this.callState.activeCall = incomingCall;
      this.callState.isInCall = true;
      this.callState.incomingCall = null;

      // Send acceptance via Socket.IO
      io.emit('call-accepted', {
        toUserId: incomingCall.fromUserId,
        callId: incomingCall.callId,
      });

      // Clear notification
      notificationService.clearCallNotification();
    } catch (error) {
      console.error('Failed to accept call:', error);
      Alert.alert('오류', '통화를 수락할 수 없습니다.');
      this.endCall();
    }
  }

  /**
   * 수신 통화 거절
   * @description 수신된 통화를 거절하고 발신자에게 알림
   */
  rejectCall() {
    const incomingCall = this.callState.incomingCall;
    if (!incomingCall) {
      return;
    }

    // Send rejection via Socket.IO
    io.emit('call-rejected', {
      toUserId: incomingCall.fromUserId,
      callId: incomingCall.callId,
    });

    this.clearIncomingCall();
  }

  /**
   * 발신 통화 취소
   * @description 발신한 통화를 취소하고 상대방에게 알림
   */
  cancelCall() {
    const activeCall = this.callState.activeCall;
    if (!activeCall || this.callState.incomingCall) {
      return;
    }

    // Send cancellation via Socket.IO
    io.emit('call-cancelled', {
      toUserId: activeCall.fromUserId,
      callId: activeCall.callId,
    });

    this.endCall();
  }

  /**
   * 활성 통화 종료
   * @description 현재 진행 중인 통화를 종료하고 상태 초기화
   */
  endCall() {
    this.callState.activeCall = null;
    this.callState.isInCall = false;
    this.clearIncomingCall();

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  /**
   * 수신 통화 초기화
   * @private
   * @description 수신 통화 정보를 초기화하고 알림 제거
   */
  private clearIncomingCall() {
    this.callState.incomingCall = null;
    notificationService.clearCallNotification();
  }

  /**
   * 통화 상태 가져오기
   * @returns {CallState} 현재 통화 상태
   * @description 현재 통화 상태의 복사본을 반환
   */
  getCallState(): CallState {
    return { ...this.callState };
  }

  /**
   * 통화 중 여부 확인
   * @returns {boolean} 통화 중 여부
   * @description 현재 통화 중인지 확인
   */
  isInCall(): boolean {
    return this.callState.isInCall;
  }

  /**
   * 활성 통화 가져오기
   * @returns {CallInvite | null} 활성 통화 정보
   * @description 현재 진행 중인 통화 정보를 반환
   */
  getActiveCall(): CallInvite | null {
    return this.callState.activeCall;
  }

  /**
   * 수신 통화 가져오기
   * @returns {CallInvite | null} 수신 통화 정보
   * @description 대기 중인 수신 통화 정보를 반환
   */
  getIncomingCall(): CallInvite | null {
    return this.callState.incomingCall;
  }

  /**
   * 수신 통화 이벤트 리스너 등록
   * @param {Function} callback - 수신 통화 콜백
   * @description 수신 통화가 있을 때 호출될 콜백 등록
   */
  onIncomingCall(callback: (call: CallInvite) => void) {
    this.onIncomingCallCallback = callback;
  }

  /**
   * 통화 종료 이벤트 리스너 등록
   * @param {Function} callback - 통화 종료 콜백
   * @description 통화가 종료될 때 호출될 콜백 등록
   */
  onCallEnd(callback: () => void) {
    this.onCallEndCallback = callback;
  }

  /**
   * 리소스 정리
   * @description 모든 통화를 종료하고 Socket 리스너 제거
   */
  cleanup() {
    this.endCall();
    io.off('call-invite');
    io.off('call-cancelled');
    io.off('call-rejected');
    io.off('call-timeout');
  }
}

/**
 * 통화 서비스 싱글톤 인스턴스
 * @constant {CallService}
 * @description 앱 전체에서 사용할 통화 서비스 인스턴스
 */
export const callService = new CallService();