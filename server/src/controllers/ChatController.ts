import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { chatService } from '../services/ChatService';
import { notificationService } from '../services/NotificationService';
import { io } from '../index';

export class ChatController {
  async getMessages(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });

      if (!match) {
        throw createError(404, '매치를 찾을 수 없습니다.');
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw createError(403, '이 채팅에 접근할 권한이 없습니다.');
      }

      const messages = await chatService.getMessages(
        matchId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const { content, type = 'TEXT' } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;

      if (!content || content.trim().length === 0) {
        throw createError(400, '메시지 내용이 필요합니다.');
      }

      if (content.length > 1000) {
        throw createError(400, '메시지는 1000자 이하여야 합니다.');
      }

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          user1: { select: { id: true, nickname: true } },
          user2: { select: { id: true, nickname: true } }
        }
      });

      if (!match) {
        throw createError(404, '매치를 찾을 수 없습니다.');
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw createError(403, '이 채팅에 메시지를 보낼 권한이 없습니다.');
      }

      if (match.status !== 'ACTIVE') {
        throw createError(400, '활성 상태의 매치에서만 메시지를 보낼 수 있습니다.');
      }

      // Create message
      const message = await chatService.sendMessage(matchId, userId, content, type);

      // Send real-time notification via WebSocket
      const receiverId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const roomId = `match_${matchId}`;
      
      io.to(roomId).emit('new-message', {
        id: message.id,
        matchId,
        senderId: userId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt
      });

      // Send push notification
      await notificationService.sendMessageNotification(
        receiverId,
        userId,
        matchId,
        content
      );

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;

      const result = await chatService.markAllMessagesAsRead(matchId, userId);

      // Notify via WebSocket
      const roomId = `match_${matchId}`;
      io.to(roomId).emit('all-messages-read', {
        matchId,
        readBy: userId,
        readAt: new Date()
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!messageId) {
        throw createError(400, '메시지 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          match: true
        }
      });

      if (!message) {
        throw createError(404, '메시지를 찾을 수 없습니다.');
      }

      // Only the receiver can mark as read
      const receiverId = message.match.user1Id === message.senderId 
        ? message.match.user2Id 
        : message.match.user1Id;

      if (receiverId !== userId) {
        throw createError(403, '이 메시지를 읽음으로 표시할 권한이 없습니다.');
      }

      if (message.readAt) {
        throw createError(400, '이미 읽음으로 표시된 메시지입니다.');
      }

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { readAt: new Date() }
      });

      // Notify sender via WebSocket
      const roomId = `match_${message.matchId}`;
      io.to(roomId).emit('message-read', {
        messageId,
        readAt: new Date(),
        readBy: userId
      });

      res.json({
        success: true,
        data: { message: '메시지를 읽음으로 표시했습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async setTypingStatus(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const { isTyping } = req.body;
      const userId = req.auth!.userId;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      if (isTyping === undefined) {
        throw createError(400, '입력 상태 값이 필요합니다.');
      }

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });

      if (!match) {
        throw createError(404, '매치를 찾을 수 없습니다.');
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw createError(403, '이 채팅에 접근할 권한이 없습니다.');
      }

      // Send typing status via WebSocket
      const roomId = `match_${matchId}`;
      io.to(roomId).emit('typing-status', {
        matchId,
        userId,
        isTyping: !!isTyping
      });

      res.json({
        success: true,
        data: { message: '입력 상태가 전송되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async getChatSummary(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { page = 1, limit = 20 } = req.query;

      const chatSummary = await chatService.getChatSummary(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: chatSummary
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const userId = req.auth!.userId;
      
      if (!messageId) {
        throw createError(400, '메시지 ID가 필요합니다.');
      }

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { match: true }
      });

      if (!message) {
        throw createError(404, '메시지를 찾을 수 없습니다.');
      }

      // Only sender can delete their message
      if (message.senderId !== userId) {
        throw createError(403, '본인이 보낸 메시지만 삭제할 수 있습니다.');
      }

      // Check if message is recent (can only delete within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (message.createdAt < fiveMinutesAgo) {
        throw createError(400, '메시지는 전송 후 5분 이내에만 삭제할 수 있습니다.');
      }

      await prisma.chatMessage.delete({
        where: { id: messageId }
      });

      // Notify via WebSocket
      const roomId = `match_${message.matchId}`;
      io.to(roomId).emit('message-deleted', {
        messageId,
        deletedBy: userId
      });

      res.json({
        success: true,
        data: { message: '메시지가 삭제되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async addReaction(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.auth!.userId;
      
      if (!messageId) {
        throw createError(400, '메시지 ID가 필요합니다.');
      }

      if (!emoji || emoji.length > 4) {
        throw createError(400, '유효한 이모지가 필요합니다.');
      }

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { match: true }
      });

      if (!message) {
        throw createError(404, '메시지를 찾을 수 없습니다.');
      }

      // Verify user is part of this match
      if (message.match.user1Id !== userId && message.match.user2Id !== userId) {
        throw createError(403, '이 메시지에 반응을 추가할 권한이 없습니다.');
      }

      // Check if reaction already exists
      const existingReaction = await prisma.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji
          }
        }
      });

      if (existingReaction) {
        throw createError(400, '이미 추가한 반응입니다.');
      }

      // Add reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        },
        include: {
          user: {
            select: { id: true, nickname: true }
          }
        }
      });

      // Notify via WebSocket
      const roomId = `match_${message.matchId}`;
      io.to(roomId).emit('reaction-added', {
        messageId,
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          user: reaction.user,
          createdAt: reaction.createdAt
        }
      });

      res.json({
        success: true,
        data: reaction
      });
    } catch (error) {
      next(error);
    }
  }

  async removeReaction(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.auth!.userId;
      
      if (!messageId) {
        throw createError(400, '메시지 ID가 필요합니다.');
      }

      if (!emoji) {
        throw createError(400, '이모지가 필요합니다.');
      }

      const reaction = await prisma.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji
          }
        },
        include: {
          message: {
            include: { match: true }
          }
        }
      });

      if (!reaction) {
        throw createError(404, '반응을 찾을 수 없습니다.');
      }

      // Only the user who added the reaction can remove it
      if (reaction.userId !== userId) {
        throw createError(403, '본인이 추가한 반응만 제거할 수 있습니다.');
      }

      await prisma.messageReaction.delete({
        where: { id: reaction.id }
      });

      // Notify via WebSocket
      const roomId = `match_${reaction.message.matchId}`;
      io.to(roomId).emit('reaction-removed', {
        messageId,
        emoji,
        userId
      });

      res.json({
        success: true,
        data: { message: '반응이 제거되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async reportMessage(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { reason, description } = req.body;
      const userId = req.auth!.userId;
      
      if (!messageId) {
        throw createError(400, '메시지 ID가 필요합니다.');
      }

      if (!reason) {
        throw createError(400, '신고 사유가 필요합니다.');
      }

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { match: true }
      });

      if (!message) {
        throw createError(404, '메시지를 찾을 수 없습니다.');
      }

      // Verify user is part of this match
      if (message.match.user1Id !== userId && message.match.user2Id !== userId) {
        throw createError(403, '이 메시지를 신고할 권한이 없습니다.');
      }

      // Can't report own message
      if (message.senderId === userId) {
        throw createError(400, '본인의 메시지는 신고할 수 없습니다.');
      }

      // Log the report (in production, you'd have a reports table)
      console.log('Message reported:', {
        messageId,
        reporterId: userId,
        reason,
        description,
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: { message: '신고가 접수되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageSearch(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId } = req.params;
      const { query, page = 1, limit = 20 } = req.query as any;
      const userId = req.auth!.userId;
      
      if (!matchId) {
        throw createError(400, '매치 ID가 필요합니다.');
      }

      if (!query || query.trim().length < 2) {
        throw createError(400, '검색어는 2자 이상이어야 합니다.');
      }

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });

      if (!match) {
        throw createError(404, '매치를 찾을 수 없습니다.');
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw createError(403, '이 채팅을 검색할 권한이 없습니다.');
      }

      const searchResults = await prisma.chatMessage.findMany({
        where: {
          matchId,
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: {
          sender: {
            select: { id: true, nickname: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      res.json({
        success: true,
        data: searchResults.map(message => ({
          id: message.id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt,
          // Highlight search term in content
          highlightedContent: message.content.replace(
            new RegExp(query, 'gi'),
            `<mark>$&</mark>`
          )
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();