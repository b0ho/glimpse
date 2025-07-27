import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ChatService } from '../services/ChatService';
import { notificationService } from '../services/NotificationService';
import { PrismaClient } from '@prisma/client';
import { socketRateLimiter, RATE_LIMIT_CONFIGS, MessageSizeLimiter, connectionLimiter } from './rateLimiter';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const chatService = new ChatService();

// Store user socket mappings
const userSocketMap = new Map<string, string>();
const socketUserMap = new Map<string, string>();

// Clerk JWKS client for token verification
const jwksUri = `https://api.clerk.com/v1/jwks`;
const client = jwksClient({
  jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

interface SocketData {
  userId?: string;
  matchId?: string;
}

export function initializeChatSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT with Clerk
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://clerk.${process.env.CLERK_DOMAIN || 'accounts.dev'}`,
        clockTolerance: 5,
      }, async (err, decoded: any) => {
        if (err) {
          return next(new Error('Invalid token'));
        }

        // Get user from database using Clerk user ID
        const user = await prisma.user.findFirst({
          where: {
            phoneNumber: decoded.phone_number || decoded.phone
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Store user ID in socket data
        (socket.data as SocketData).userId = user.id;
        next();
      });
    } catch (_error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as SocketData).userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Store socket mapping
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);

    // Update user online status
    updateUserOnlineStatus(userId, true);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Handle joining a match room
    socket.on('join-match', async (matchId: string) => {
      try {
        // Verify user is part of this match
        const match = await prisma.match.findUnique({
          where: { id: matchId }
        });

        if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
          socket.emit('error', { message: '이 채팅방에 접근할 권한이 없습니다.' });
          return;
        }

        // Join the match room
        socket.join(`match:${matchId}`);
        (socket.data as SocketData).matchId = matchId;

        // Mark messages as read
        await chatService.markAllMessagesAsRead(matchId, userId);

        // Notify other user that this user joined
        socket.to(`match:${matchId}`).emit('user-joined', { userId });

        console.log(`User ${userId} joined match room ${matchId}`);
      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('error', { message: '채팅방 참여 중 오류가 발생했습니다.' });
      }
    });

    // Handle leaving a match room
    socket.on('leave-match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      if ((socket.data as SocketData).matchId === matchId) {
        (socket.data as SocketData).matchId = undefined;
      }
      socket.to(`match:${matchId}`).emit('user-left', { userId });
      console.log(`User ${userId} left match room ${matchId}`);
    });

    // Handle sending a message
    socket.on('send-message', async (data: {
      matchId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE';
    }) => {
      try {
        const { matchId, content, type = 'TEXT' } = data;

        // Verify user is part of this match
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            user1: { select: { id: true, nickname: true } },
            user2: { select: { id: true, nickname: true } }
          }
        });

        if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
          socket.emit('error', { message: '이 채팅방에 메시지를 보낼 권한이 없습니다.' });
          return;
        }

        // Send message through service
        const message = await chatService.sendMessage(matchId, userId, content, type);

        // Emit to all users in the match room
        io.to(`match:${matchId}`).emit('new-message', {
          matchId,
          message
        });

        // Send push notification to offline user
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUserSocketId = userSocketMap.get(otherUserId);
        
        if (!otherUserSocketId) {
          // User is offline, send push notification
          const sender = match.user1Id === userId ? match.user1 : match.user2;
          await notificationService.sendMessageNotification(
            otherUserId,
            sender.nickname || '익명',
            content,
            matchId
          );
        }

        console.log(`Message sent in match ${matchId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다.' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', async (matchId: string) => {
      try {
        await chatService.setTypingStatus(matchId, userId, true);
        socket.to(`match:${matchId}`).emit('user-typing', { userId, isTyping: true });
      } catch (error) {
        console.error('Error setting typing status:', error);
      }
    });

    socket.on('typing-stop', async (matchId: string) => {
      try {
        await chatService.setTypingStatus(matchId, userId, false);
        socket.to(`match:${matchId}`).emit('user-typing', { userId, isTyping: false });
      } catch (error) {
        console.error('Error setting typing status:', error);
      }
    });

    // Handle message read receipts (premium feature)
    socket.on('mark-as-read', async (data: {
      matchId: string;
      messageIds: string[];
    }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user?.isPremium) {
          socket.emit('error', { message: '읽음 표시는 프리미엄 기능입니다.' });
          return;
        }

        const { matchId, messageIds } = data;

        // Update read status
        await prisma.chatMessage.updateMany({
          where: {
            id: { in: messageIds },
            matchId,
            senderId: { not: userId }
          },
          data: {
            readAt: new Date()
          }
        });

        // Notify sender about read receipts
        socket.to(`match:${matchId}`).emit('messages-read', {
          matchId,
          messageIds,
          readBy: userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: '읽음 표시 처리 중 오류가 발생했습니다.' });
      }
    });

    // Handle getting online status
    socket.on('get-online-status', async (userIds: string[]) => {
      try {
        const onlineStatuses = userIds.map(id => ({
          userId: id,
          isOnline: userSocketMap.has(id)
        }));
        
        socket.emit('online-status', onlineStatuses);
      } catch (error) {
        console.error('Error getting online status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);

      // Remove socket mapping
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);

      // Update user offline status
      updateUserOnlineStatus(userId, false);

      // Notify match rooms about disconnection
      const matchId = (socket.data as SocketData).matchId;
      if (matchId) {
        socket.to(`match:${matchId}`).emit('user-offline', { userId });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}

async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: new Date(),
        ...(isOnline && { lastOnline: new Date() })
      }
    });
  } catch (error) {
    console.error('Error updating user online status:', error);
  }
}

// Export helper functions for other services to use
export function getUserSocketId(userId: string): string | undefined {
  return userSocketMap.get(userId);
}

export function emitToUser(io: Server, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToMatch(io: Server, matchId: string, event: string, data: any) {
  io.to(`match:${matchId}`).emit(event, data);
}