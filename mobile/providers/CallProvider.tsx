import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { callService } from '../services/callService';
import { webRTCService } from '../services/webrtcService';
import { VideoCallScreen } from '../components/call/VideoCallScreen';
import { IncomingCallModal } from '../components/call/IncomingCallModal';

interface CallContextType {
  initiateCall: (userId: string, userName: string, callType: 'video' | 'audio') => Promise<void>;
  isInCall: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider= ({ children }) => {
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [activeCallData, setActiveCallData] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Set up incoming call listener
    callService.onIncomingCall((call) => {
      setIncomingCallData(call);
      setShowIncomingCall(true);
    });

    // Set up call end listener
    callService.onCallEnd(() => {
      setShowVideoCall(false);
      setActiveCallData(null);
      setIsInCall(false);
    });

    return () => {
      callService.cleanup();
      webRTCService.cleanup();
    };
  }, []);

  const initiateCall = async (userId: string, userName: string, callType: 'video' | 'audio') => {
    try {
      if (isInCall) {
        Alert.alert(t('call:status.inCall'), t('call:errors.alreadyInCall'));
        return;
      }

      // Start the call
      await callService.initiateCall(userId, userName, callType);
      
      // Set up call data
      setActiveCallData({
        remoteUserId: userId,
        remoteUserName: userName,
        callType,
        isIncoming: false,
      });
      
      setIsInCall(true);
      setShowVideoCall(true);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert(t('common:status.error'), t('call:errors.cannotStartCall'));
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCallData) return;

    try {
      // Accept the call
      await callService.acceptCall();
      
      // Set up call data
      setActiveCallData({
        remoteUserId: incomingCallData.fromUserId,
        remoteUserName: incomingCallData.fromUserName,
        callType: incomingCallData.callType,
        isIncoming: true,
      });
      
      setShowIncomingCall(false);
      setIsInCall(true);
      setShowVideoCall(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
      Alert.alert(t('common:status.error'), t('call:errors.cannotAcceptCall'));
    }
  };

  const handleRejectCall = () => {
    callService.rejectCall();
    setShowIncomingCall(false);
    setIncomingCallData(null);
  };

  const handleEndCall = () => {
    callService.endCall();
    webRTCService.endCall();
    setShowVideoCall(false);
    setActiveCallData(null);
    setIsInCall(false);
  };

  return (
    <CallContext.Provider value={{ initiateCall, isInCall }}>
      {children}
      
      {/* Incoming Call Modal */}
      {showIncomingCall && incomingCallData && (
        <IncomingCallModal
          visible={showIncomingCall}
          callerName={incomingCallData.fromUserName}
          callType={incomingCallData.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Video Call Screen */}
      {showVideoCall && activeCallData && (
        <VideoCallScreen
          remoteUserId={activeCallData.remoteUserId}
          remoteUserName={activeCallData.remoteUserName}
          isIncoming={activeCallData.isIncoming}
          onCallEnd={handleEndCall}
        />
      )}
    </CallContext.Provider>
  );
};