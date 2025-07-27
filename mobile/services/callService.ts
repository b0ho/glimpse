import { io } from './chat/socketService';
import { webRTCService } from './webrtcService';
import { notificationService } from './notificationService';
import { Alert } from 'react-native';

interface CallInvite {
  callId: string;
  fromUserId: string;
  fromUserName: string;
  callType: 'video' | 'audio';
  timestamp: number;
}

interface CallState {
  activeCall: CallInvite | null;
  isInCall: boolean;
  incomingCall: CallInvite | null;
}

class CallService {
  private callState: CallState = {
    activeCall: null,
    isInCall: false,
    incomingCall: null,
  };

  private onIncomingCallCallback?: (call: CallInvite) => void;
  private onCallEndCallback?: () => void;

  constructor() {
    this.setupSocketListeners();
  }

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

  // Initiate a call
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
        if (this.callState.activeCall?.callId === callId && !webRTCService.getCallStatus()) {
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

  // Handle incoming call invite
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

  // Accept incoming call
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

  // Reject incoming call
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

  // Cancel outgoing call
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

  // End active call
  endCall() {
    this.callState.activeCall = null;
    this.callState.isInCall = false;
    this.clearIncomingCall();

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  // Clear incoming call
  private clearIncomingCall() {
    this.callState.incomingCall = null;
    notificationService.clearCallNotification();
  }

  // Get call state
  getCallState(): CallState {
    return { ...this.callState };
  }

  // Check if in call
  isInCall(): boolean {
    return this.callState.isInCall;
  }

  // Get active call
  getActiveCall(): CallInvite | null {
    return this.callState.activeCall;
  }

  // Get incoming call
  getIncomingCall(): CallInvite | null {
    return this.callState.incomingCall;
  }

  // Event listeners
  onIncomingCall(callback: (call: CallInvite) => void) {
    this.onIncomingCallCallback = callback;
  }

  onCallEnd(callback: () => void) {
    this.onCallEndCallback = callback;
  }

  // Cleanup
  cleanup() {
    this.endCall();
    io.off('call-invite');
    io.off('call-cancelled');
    io.off('call-rejected');
    io.off('call-timeout');
  }
}

export const callService = new CallService();