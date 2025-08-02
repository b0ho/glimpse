'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * 채팅 메시지 타입 정의
 * @interface ChatMessage
 * @property {string} id - 메시지 고유 ID
 * @property {string} content - 메시지 내용
 * @property {string} senderId - 발신자 ID
 * @property {string} matchId - 매칭 ID (채팅방 ID)
 * @property {boolean} [isEncrypted] - 메시지 암호화 여부 (선택적)
 */
interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  matchId: string;
  isEncrypted?: boolean;
}

/**
 * Socket.IO 연결 및 채팅 기능을 관리하는 커스텀 훅
 * 
 * @description
 * 이 훅은 Socket.IO 클라이언트를 초기화하고, 채팅 관련 기능들을 제공합니다.
 * 컴포넌트가 마운트될 때 자동으로 소켓 연결을 생성하고, 
 * 언마운트될 때 연결을 정리합니다.
 * 
 * @example
 * ```tsx
 * const ChatComponent = () => {
 *   const { socket, isConnected, joinChat, sendMessage } = useSocket();
 *   
 *   useEffect(() => {
 *     if (isConnected) {
 *       joinChat('match123');
 *     }
 *   }, [isConnected]);
 *   
 *   const handleSend = () => {
 *     sendMessage({
 *       id: 'msg123',
 *       content: 'Hello!',
 *       senderId: 'user123',
 *       matchId: 'match123'
 *     });
 *   };
 * };
 * ```
 * 
 * @returns {Object} 소켓 관련 상태와 메서드들
 * @returns {Socket | null} socket - Socket.IO 클라이언트 인스턴스
 * @returns {boolean} isConnected - 소켓 연결 상태
 * @returns {Function} joinChat - 채팅방 입장 함수
 * @returns {Function} leaveChat - 채팅방 퇴장 함수
 * @returns {Function} sendMessage - 메시지 전송 함수
 * @returns {Function} startTyping - 타이핑 시작 알림 함수
 * @returns {Function} stopTyping - 타이핑 중지 알림 함수
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    /**
     * Socket.IO 클라이언트 인스턴스 생성
     * @todo 환경 변수로 URL 관리 필요
     */
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket']
    });

    /**
     * 소켓 연결 성공 이벤트 핸들러
     */
    socketInstance.on('connect', () => {
      console.log('Socket.IO 연결됨');
      setIsConnected(true);
    });

    /**
     * 소켓 연결 해제 이벤트 핸들러
     */
    socketInstance.on('disconnect', () => {
      console.log('Socket.IO 연결 해제됨');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup: 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  /**
   * 특정 채팅방에 입장
   * 
   * @param {string} matchId - 입장할 채팅방의 매칭 ID
   * 
   * @example
   * ```typescript
   * joinChat('match_abc123');
   * ```
   */
  const joinChat = (matchId: string) => {
    if (socket) {
      socket.emit('join_chat', matchId);
    }
  };

  /**
   * 특정 채팅방에서 퇴장
   * 
   * @param {string} matchId - 퇴장할 채팅방의 매칭 ID
   * 
   * @example
   * ```typescript
   * leaveChat('match_abc123');
   * ```
   */
  const leaveChat = (matchId: string) => {
    if (socket) {
      socket.emit('leave_chat', matchId);
    }
  };

  /**
   * 채팅 메시지 전송
   * 
   * @param {ChatMessage} message - 전송할 메시지 객체
   * @param {string} message.id - 메시지 고유 ID
   * @param {string} message.content - 메시지 내용
   * @param {string} message.senderId - 발신자 ID
   * @param {string} message.matchId - 매칭 ID (채팅방 ID)
   * @param {boolean} [message.isEncrypted] - 메시지 암호화 여부
   * 
   * @example
   * ```typescript
   * sendMessage({
   *   id: 'msg_123',
   *   content: '안녕하세요!',
   *   senderId: 'user_456',
   *   matchId: 'match_789',
   *   isEncrypted: true
   * });
   * ```
   */
  const sendMessage = (message: ChatMessage) => {
    if (socket) {
      socket.emit('chat_message', message);
    }
  };

  /**
   * 타이핑 시작 알림 전송
   * 
   * @param {string} matchId - 채팅방의 매칭 ID
   * @param {string} userId - 타이핑 중인 사용자 ID
   * 
   * @example
   * ```typescript
   * startTyping('match_789', 'user_456');
   * ```
   */
  const startTyping = (matchId: string, userId: string) => {
    if (socket) {
      socket.emit('typing_start', { matchId, userId });
    }
  };

  /**
   * 타이핑 중지 알림 전송
   * 
   * @param {string} matchId - 채팅방의 매칭 ID
   * @param {string} userId - 타이핑을 중지한 사용자 ID
   * 
   * @example
   * ```typescript
   * stopTyping('match_789', 'user_456');
   * ```
   */
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