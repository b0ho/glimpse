/**
 * 채팅 관련 헬퍼 함수들
 */

import { Message } from '@/types';
import { TypingUser } from '../types/chatTypes';

/**
 * 메시지 중복 확인
 */
export const isDuplicateMessage = (messages: Message[], newMessage: Message): boolean => {
  return messages.some(msg => 
    msg.id === newMessage.id || 
    (msg.content === newMessage.content && 
     Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
  );
};

/**
 * 메시지 정렬 (시간순)
 */
export const sortMessagesByTime = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

/**
 * 타이핑 사용자 타임아웃 체크 (3초)
 */
export const cleanupTypingUsers = (typingUsers: TypingUser[]): TypingUser[] => {
  const now = Date.now();
  const TYPING_TIMEOUT = 3000; // 3초
  
  return typingUsers.filter(user => 
    now - user.timestamp < TYPING_TIMEOUT
  );
};

/**
 * 읽지 않은 메시지 개수 계산
 */
export const calculateUnreadCount = (messages: Message[], userId: string): number => {
  return messages.filter(msg => 
    msg.senderId !== userId && !msg.isRead
  ).length;
};

/**
 * 마지막 메시지 가져오기
 */
export const getLastMessage = (messages: Message[]): Message | null => {
  if (messages.length === 0) return null;
  return messages[messages.length - 1];
};

/**
 * 메시지 페이지네이션 처리
 */
export const mergeMessages = (existingMessages: Message[], newMessages: Message[]): Message[] => {
  const messageMap = new Map<string, Message>();
  
  // 기존 메시지 추가
  existingMessages.forEach(msg => {
    messageMap.set(msg.id, msg);
  });
  
  // 새 메시지 추가 (중복 제거)
  newMessages.forEach(msg => {
    messageMap.set(msg.id, msg);
  });
  
  // 시간순 정렬
  return sortMessagesByTime(Array.from(messageMap.values()));
};

/**
 * 채팅방 ID로 메시지 필터링
 */
export const filterMessagesByRoom = (
  messages: Record<string, Message[]>, 
  roomId: string
): Message[] => {
  return messages[roomId] || [];
};

/**
 * 오프라인 메시지 필터링
 */
export const filterOfflineMessages = (
  queue: Array<{ roomId: string; content: string; timestamp: number }>,
  roomId: string
): Array<{ roomId: string; content: string; timestamp: number }> => {
  return queue.filter(msg => msg.roomId === roomId);
};

/**
 * 메시지 포맷팅 (시간 표시)
 */
export const formatMessageTime = (timestamp: Date | string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // 오늘
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 어제
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '어제';
  }
  
  // 그 외
  return date.toLocaleDateString('ko-KR', { 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * 메시지 그룹화 (날짜별)
 */
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  const grouped: Record<string, Message[]> = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(msg);
  });
  
  return grouped;
};