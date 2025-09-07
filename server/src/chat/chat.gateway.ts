import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

/**
 * 채팅 웹소켓 게이트웨이
 *
 * 실시간 메시지 전송, 타이핑 상태, 읽음 표시 등을 처리합니다.
 */
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: (origin, callback) => {
      // 허용된 도메인 목록
      const allowedOrigins = [
        // Development origins
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:19000',
        'http://localhost:3000',
        'http://localhost:3001',
        'exp://192.168.0.2:8081',
        // Production origins - CRITICAL FIX
        'https://www.glimpse.contact',
        'https://glimpse.contact',
        'https://glimpse-mobile.vercel.app',
        'https://glimpse-web.vercel.app',
        'https://glimpse-admin.vercel.app',
        'https://glimpse.vercel.app',
        // Environment variable fallbacks
        process.env.CLIENT_URL,
        process.env.WEB_URL,
      ].filter(Boolean);

      // 개발 환경에서는 localhost 허용
      if (process.env.NODE_ENV === 'development') {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (origin.includes('localhost') || origin.includes('192.168')) {
          callback(null, true);
        } else {
          callback(new Error('WebSocket CORS 정책에 의해 차단되었습니다.'));
        }
      } else {
        // 운영 환경에서는 명시적으로 허용된 도메인만
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('WebSocket CORS 정책에 의해 차단되었습니다.'));
        }
      }
    },
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('Chat WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // 사용자 소켓 매핑 정리
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter((id) => id !== client.id);

      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        this.userSockets.delete(userId);
      }

      this.socketUsers.delete(client.id);
    }
  }

  /**
   * 사용자 인증 및 소켓 매핑
   */
  @SubscribeMessage('auth')
  async handleAuth(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    // 소켓-사용자 매핑
    this.socketUsers.set(client.id, userId);

    const userSockets = this.userSockets.get(userId) || [];
    userSockets.push(client.id);
    this.userSockets.set(userId, userSockets);

    // 사용자의 모든 활성 매치 룸에 조인
    const chatSummary = await this.chatService.getChatSummary(userId);
    for (const chat of (chatSummary as any).chats || []) {
      client.join(`match:${chat.matchId}`);
    }

    return { success: true, message: 'Authenticated successfully' };
  }

  /**
   * 매치 룸 조인
   */
  @SubscribeMessage('join-match')
  async handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId } = data;
    client.join(`match:${matchId}`);

    // 읽지 않은 메시지 수 전송
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      const chatSummary = await this.chatService.getChatSummary(userId);
      const matchChat = ((chatSummary as any).chats || []).find(
        (chat: any) => chat.matchId === matchId,
      );

      if (matchChat) {
        client.emit('unread-count', {
          matchId,
          unreadCount: matchChat.unreadCount,
        });
      }
    }

    return { success: true, message: `Joined match ${matchId}` };
  }

  /**
   * 매치 룸 나가기
   */
  @SubscribeMessage('leave-match')
  handleLeaveMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId } = data;
    client.leave(`match:${matchId}`);
    return { success: true, message: `Left match ${matchId}` };
  }

  /**
   * 메시지 전송
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: { matchId: string; message: SendMessageDto },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, message } = data;
    const userId = this.socketUsers.get(client.id);

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // 메시지 저장
      const sentMessage = await this.chatService.sendMessage(
        matchId,
        userId,
        message,
      );

      // 매치 룸의 모든 사용자에게 메시지 브로드캐스트
      this.server.to(`match:${matchId}`).emit('new-message', {
        matchId,
        message: sentMessage,
      });

      // 푸시 알림 트리거 (TODO: NotificationService 통합)

      return { success: true, message: sentMessage };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 타이핑 상태 업데이트
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { matchId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, isTyping } = data;
    const userId = this.socketUsers.get(client.id);

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // 타이핑 상태 업데이트
    await this.chatService.setTypingStatus(matchId, userId, { isTyping });

    // 다른 사용자에게 타이핑 상태 브로드캐스트
    client.to(`match:${matchId}`).emit('user-typing', {
      matchId,
      userId,
      isTyping,
    });

    return { success: true };
  }

  /**
   * 메시지 읽음 처리
   */
  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId } = data;
    const userId = this.socketUsers.get(client.id);

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // 메시지 읽음 처리
    const result = await this.chatService.markAllMessagesAsRead(
      matchId,
      userId,
    );

    // 상대방에게 읽음 상태 알림
    client.to(`match:${matchId}`).emit('messages-read', {
      matchId,
      userId,
      readAt: new Date(),
    });

    return { success: true, ...result };
  }

  /**
   * 메시지 반응 추가/제거
   */
  @SubscribeMessage('toggle-reaction')
  async handleToggleReaction(
    @MessageBody() data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { messageId, emoji } = data;
    const userId = this.socketUsers.get(client.id);

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await this.chatService.toggleMessageReaction(
        messageId,
        userId,
        { emoji },
      );

      // TODO: 해당 매치의 모든 사용자에게 반응 업데이트 브로드캐스트

      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 사용자에게 직접 메시지 전송
   */
  sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId) || [];
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * 매치의 모든 사용자에게 메시지 전송
   */
  sendToMatch(matchId: string, event: string, data: any) {
    this.server.to(`match:${matchId}`).emit(event, data);
  }
}
