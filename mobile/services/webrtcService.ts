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

interface WebRTCConfig {
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

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

class WebRTCService {
  private config: WebRTCConfig = {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
    ]
  };

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

  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndedCallback?: () => void;
  private onCallStatusChangedCallback?: (status: CallState['callStatus']) => void;

  constructor() {
    this.setupSocketListeners();
  }

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

  // Initialize call
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

  // Setup local media stream
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

  // Create peer connection
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

  // Handle incoming call
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

  // Accept incoming call
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

  // Reject incoming call
  rejectCall() {
    io.emit('call-rejected', {
      toUserId: this.callState.remoteUserId,
      callId: this.callState.callId
    });
    this.endCall();
  }

  // Handle call answer
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

  // Handle ICE candidate
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

  // Toggle video
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

  // Toggle audio
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

  // Switch camera
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

  // End call
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

  // Update call status
  private updateCallStatus(status: CallState['callStatus']) {
    this.callState.callStatus = status;
    if (this.onCallStatusChangedCallback) {
      this.onCallStatusChangedCallback(status);
    }
  }

  // Getters
  getLocalStream() {
    return this.callState.localStream;
  }

  getRemoteStream() {
    return this.callState.remoteStream;
  }

  getCallStatus() {
    return this.callState.callStatus;
  }

  getCallState() {
    return { ...this.callState };
  }

  // Event listeners
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback;
  }

  onCallStatusChanged(callback: (status: CallState['callStatus']) => void) {
    this.onCallStatusChangedCallback = callback;
  }

  // Cleanup
  cleanup() {
    this.endCall();
    io.off('call-offer');
    io.off('call-answer');
    io.off('ice-candidate');
    io.off('call-ended');
  }
}

export const webRTCService = new WebRTCService();