'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO 연결됨');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO 연결 해제됨');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinChat = (matchId: string) => {
    if (socket) {
      socket.emit('join_chat', matchId);
    }
  };

  const leaveChat = (matchId: string) => {
    if (socket) {
      socket.emit('leave_chat', matchId);
    }
  };

  const sendMessage = (message: {
    id: string;
    content: string;
    senderId: string;
    matchId: string;
    isEncrypted?: boolean;
  }) => {
    if (socket) {
      socket.emit('chat_message', message);
    }
  };

  const startTyping = (matchId: string, userId: string) => {
    if (socket) {
      socket.emit('typing_start', { matchId, userId });
    }
  };

  const stopTyping = (matchId: string, userId: string) => {
    if (socket) {
      socket.emit('typing_stop', { matchId, userId });
    }
  };

  return {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping
  };
}