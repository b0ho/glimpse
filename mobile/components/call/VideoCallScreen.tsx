import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { webRTCService } from '../../services/webrtcService';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoCallScreenProps {
  remoteUserId: string;
  remoteUserName: string;
  isIncoming: boolean;
  onCallEnd: () => void;
}

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  remoteUserId,
  remoteUserName,
  isIncoming,
  onCallEnd,
}) => {
  const [callStatus, setCallStatus] = useState<string>('initializing');
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();

    // Set up event listeners
    webRTCService.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });

    webRTCService.onCallEnded(() => {
      handleEndCall();
    });

    webRTCService.onCallStatusChanged((status) => {
      setCallStatus(status);
      if (status === 'connected') {
        startCallTimer();
      }
    });

    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
      webRTCService.cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      if (isIncoming) {
        // For incoming calls, accept the call
        setCallStatus('connecting');
        const stream = webRTCService.getLocalStream();
        setLocalStream(stream);
      } else {
        // For outgoing calls, initiate the call
        setCallStatus('calling');
        await webRTCService.initiateCall(remoteUserId, 'video');
        const stream = webRTCService.getLocalStream();
        setLocalStream(stream);
      }
    } catch (error) {
      console.error('Failed to initialize call:', error);
      handleEndCall();
    }
  };

  const handleAcceptCall = async () => {
    try {
      await webRTCService.acceptCall();
      setCallStatus('connected');
    } catch (error) {
      console.error('Failed to accept call:', error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    webRTCService.rejectCall();
    handleEndCall();
  };

  const handleEndCall = () => {
    webRTCService.endCall();
    if (callTimer) {
      clearInterval(callTimer);
    }
    onCallEnd();
  };

  const toggleVideo = () => {
    const enabled = webRTCService.toggleVideo();
    setIsVideoEnabled(enabled ?? false);
  };

  const toggleAudio = () => {
    const enabled = webRTCService.toggleAudio();
    setIsAudioEnabled(enabled ?? false);
  };

  const switchCamera = async () => {
    await webRTCService.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  };

  const startCallTimer = () => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    setCallTimer(timer);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallStatus = () => {
    switch (callStatus) {
      case 'calling':
        return '통화 연결 중...';
      case 'ringing':
        return '벨이 울리고 있습니다...';
      case 'connecting':
        return '연결 중...';
      case 'connected':
        return formatDuration(callDuration);
      default:
        return '초기화 중...';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Remote Video (Full Screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {remoteUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.remoteUserName}>{remoteUserName}</Text>
          <Text style={styles.callStatusText}>{renderCallStatus()}</Text>
        </View>
      )}

      {/* Local Video (Picture-in-Picture) */}
      {localStream && isVideoEnabled && (
        <TouchableOpacity style={styles.localVideoContainer} onPress={switchCamera}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera}
          />
        </TouchableOpacity>
      )}

      {/* Call Info Overlay */}
      <SafeAreaView style={styles.callInfoOverlay}>
        <View style={styles.callInfo}>
          <Text style={styles.remoteUserNameOverlay}>{remoteUserName}</Text>
          {callStatus === 'connected' && (
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          )}
        </View>
      </SafeAreaView>

      {/* Call Controls */}
      <SafeAreaView style={styles.controlsContainer}>
        {isIncoming && callStatus === 'ringing' ? (
          <View style={styles.incomingCallControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.rejectButton]}
              onPress={handleRejectCall}
            >
              <Ionicons name="close" size={30} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.acceptButton]}
              onPress={handleAcceptCall}
            >
              <Ionicons name="call" size={30} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeCallControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isVideoEnabled && styles.controlButtonDisabled,
              ]}
              onPress={toggleVideo}
            >
              <Ionicons
                name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                !isAudioEnabled && styles.controlButtonDisabled,
              ]}
              onPress={toggleAudio}
            >
              <Ionicons
                name={isAudioEnabled ? 'mic' : 'mic-off'}
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
              disabled={!isVideoEnabled}
            >
              <Ionicons name="camera-reverse" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkgray,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  avatarText: {
    ...FONTS.h1,
    color: COLORS.white,
    fontSize: 48,
  },
  remoteUserName: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SIZES.base,
  },
  callStatusText: {
    ...FONTS.body3,
    color: COLORS.lightGray,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  callInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  callInfo: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: SIZES.padding,
  },
  remoteUserNameOverlay: {
    ...FONTS.h3,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  callDuration: {
    ...FONTS.body3,
    color: COLORS.white,
    marginTop: SIZES.base,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
  },
  incomingCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  activeCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  endCallButton: {
    backgroundColor: COLORS.error,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});