import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CallContextType {
  initiateCall: (roomId: string, callType: 'video' | 'audio') => void;
  isInCall: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);

  const initiateCall = (roomId: string, callType: 'video' | 'audio') => {
    // TODO: Implement call initiation logic
    console.log(`Initiating ${callType} call for room ${roomId}`);
    setIsInCall(true);
    
    // Auto end call after 5 seconds for demo
    setTimeout(() => {
      setIsInCall(false);
    }, 5000);
  };

  return (
    <CallContext.Provider value={{ initiateCall, isInCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};