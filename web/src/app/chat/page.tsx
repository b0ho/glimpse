'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // 새 메시지가 왔을 때 스크롤 맨 아래로
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="h-[80vh] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>💬 Glimpse Chat</CardTitle>
                <CardDescription>실시간 채팅 테스트</CardDescription>
              </div>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? '● 연결됨' : '● 연결 끊김'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4" ref={scrollAreaRef}>
              <div className="space-y-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    메시지가 없습니다. 첫 번째 메시지를 보내보세요!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.senderId === userId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.senderId !== userId && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.senderId.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`group relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.senderId === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm break-words">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === userId
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                        </div>
                      </div>

                      {message.senderId === userId && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            나
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex w-full gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!isConnected || !newMessage.trim()}
              >
                전송
              </Button>
            </form>
          </CardFooter>
        </Card>

        <Card className="mt-4 p-4">
          <div className="text-sm text-muted-foreground space-y-1 text-center">
            <div>Match ID: <span className="font-mono">{matchId}</span></div>
            <div>User ID: <span className="font-mono">{userId.slice(0, 8)}...</span></div>
            <div className="pt-2">
              💡 새 브라우저 탭을 열어서 실시간 채팅을 테스트해보세요!
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}