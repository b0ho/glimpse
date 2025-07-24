'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  matchId: string;
  timestamp: string;
  isEncrypted?: boolean;
}

export default function ChatPage() {
  const { socket, isConnected, joinChat, sendMessage } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchId] = useState('test-match-123');
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (socket) {
      // 테스트 채팅방 입장
      joinChat(matchId);

      // 메시지 수신 리스너
      socket.on('chat_message', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('chat_message');
      };
    }
  }, [socket, joinChat, matchId]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const message: ChatMessage = {
        id: 'msg-' + Date.now(),
        content: newMessage,
        senderId: userId,
        matchId,
        timestamp: new Date().toISOString(),
        isEncrypted: false
      };

      // 로컬에 메시지 추가 (본인이 보낸 메시지)
      setMessages(prev => [...prev, message]);
      
      // 서버로 메시지 전송
      sendMessage(message);
      
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">💬 Glimpse Chat Test</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-sm h-96 flex flex-col">
          {/* 메시지 영역 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                메시지가 없습니다. 첫 번째 메시지를 보내보세요!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === userId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.senderId === userId ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 입력 영역 */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <div>Match ID: {matchId}</div>
          <div>User ID: {userId}</div>
          <div className="mt-2">
            💡 새 브라우저 탭을 열어서 실시간 채팅을 테스트해보세요!
          </div>
        </div>
      </div>
    </div>
  );
}