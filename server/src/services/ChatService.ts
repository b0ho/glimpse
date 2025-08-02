import { MessageType } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { encryptionService } from './EncryptionService';
import { contentFilterService } from './ContentFilterService';
import { CHAT_CONFIG } from '@shared/constants';

/**
 * 채팅 서비스 - 실시간 메시징 및 채팅 관리
 * @class ChatService
 */
export class ChatService {
  /**
   * 특정 매치의 메시지 목록 조회
   * @param {string} matchId - 매치 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 메시지 수
   * @returns {Promise<Array>} 복호화된 메시지 목록
   */
  async getMessages(matchId: string, page: number, limit: number) {
    const messages = await prisma.chatMessage.findMany({
      where: { matchId },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Decrypt messages if they are encrypted
    const decryptedMessages = await Promise.all(
      messages.map(async (message) => {
        let content = message.content;
        
        if (message.isEncrypted) {
          try {
            content = await encryptionService.decrypt(message.content);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            content = '[암호화된 메시지]';
          }
        }

        // 반응들을 이모지별로 그룹화
        const reactionsByEmoji = message.reactions.reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              users: []
            };
          }
          acc[reaction.emoji].count++;
          acc[reaction.emoji].users.push({
            id: reaction.user.id,
            nickname: reaction.user.nickname
          });
          return acc;
        }, {} as Record<string, any>);

        return {
          id: message.id,
          content,
          type: message.type,
          sender: message.sender,
          readAt: message.readAt,
          createdAt: message.createdAt,
          reactions: Object.values(reactionsByEmoji)
        };
      })
    );

    // Return in chronological order (oldest first)
    return decryptedMessages.reverse();
  }

  /**
   * 메시지 전송
   * @param {string} matchId - 매치 ID
   * @param {string} senderId - 발신자 ID
   * @param {string} content - 메시지 내용
   * @param {MessageType} [type='TEXT'] - 메시지 타입
   * @returns {Promise<Object>} 전송된 메시지 정보
   * @throws {Error} 메시지 길이 초과 또는 부적절한 내용 포함 시
   */
  async sendMessage(matchId: string, senderId: string, content: string, type: MessageType = 'TEXT') {
    // Validate content length
    if (content.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
      throw createError(400, `메시지는 ${CHAT_CONFIG.MAX_MESSAGE_LENGTH}자 이하여야 합니다.`);
    }

    // Content filtering
    const filterResult = await contentFilterService.filterText(content, 'chat');
    if (filterResult.severity === 'blocked') {
      throw createError(400, '부적절한 내용이 포함되어 있습니다.');
    }

    // Use filtered content if there were warnings
    const finalContent = filterResult.filteredText || content;

    // Encrypt content
    const encryptedContent = await encryptionService.encrypt(finalContent);

    const message = await prisma.chatMessage.create({
      data: {
        matchId,
        senderId,
        content: encryptedContent,
        type,
        isEncrypted: true
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        }
      }
    });

    return {
      id: message.id,
      content, // Return decrypted content
      type: message.type,
      sender: message.sender,
      createdAt: message.createdAt
    };
  }

  /**
   * 사용자의 채팅 목록 요약 조회
   * @param {string} userId - 사용자 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Array>} 채팅 요약 목록
   */
  async getChatSummary(userId: string, page: number, limit: number) {
    // Get all active matches for the user
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACTIVE'
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            lastActive: true
          }
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            lastActive: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: [
        {
          messages: {
            _count: 'desc' // Matches with more messages first
          }
        },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const chatSummaries = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1Id === userId ? match.user2 : match.user1;
        const lastMessage = match.messages[0];
        
        let lastMessageContent = null;
        if (lastMessage) {
          let content = lastMessage.content;
          
          if (lastMessage.isEncrypted) {
            try {
              content = await encryptionService.decrypt(content);
            } catch (error) {
              content = '[암호화된 메시지]';
            }
          }

          lastMessageContent = {
            content: content.length > 50 ? content.substring(0, 50) + '...' : content,
            isFromMe: lastMessage.senderId === userId,
            createdAt: lastMessage.createdAt
          };
        }

        // Get unread message count
        const unreadCount = await prisma.chatMessage.count({
          where: {
            matchId: match.id,
            senderId: { not: userId },
            readAt: null
          }
        });

        return {
          matchId: match.id,
          user: otherUser,
          group: match.group,
          lastMessage: lastMessageContent,
          unreadCount,
          matchCreatedAt: match.createdAt
        };
      })
    );

    return chatSummaries;
  }

  /**
   * 모든 메시지를 읽음으로 표시
   * @param {string} matchId - 매치 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 읽음 처리 결과
   * @throws {Error} 매치를 찾을 수 없거나 권한이 없을 때
   */
  async markAllMessagesAsRead(matchId: string, userId: string) {
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

    // Mark all unread messages from other user as read
    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;

    const updatedMessages = await prisma.chatMessage.updateMany({
      where: {
        matchId,
        senderId: otherUserId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return {
      markedAsRead: updatedMessages.count,
      message: `${updatedMessages.count}개의 메시지를 읽음으로 표시했습니다.`
    };
  }

  /**
   * 메시지 통계 조회
   * @param {string} matchId - 매치 ID
   * @returns {Promise<Object>} 메시지 통계 정보
   * @throws {Error} 매치를 찾을 수 없을 때
   */
  async getMessageStats(matchId: string) {
    const [totalMessages, messagesByUser] = await Promise.all([
      prisma.chatMessage.count({ where: { matchId } }),
      prisma.chatMessage.groupBy({
        by: ['senderId'],
        where: { matchId },
        _count: true
      })
    ]);

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

    const userStats = messagesByUser.map(stat => {
      const user = stat.senderId === match.user1Id ? match.user1 : match.user2;
      return {
        user,
        messageCount: stat._count,
        percentage: totalMessages > 0 ? (stat._count / totalMessages) * 100 : 0
      };
    });

    return {
      totalMessages,
      averageMessagesPerDay: this.calculateAverageMessagesPerDay(match.createdAt, totalMessages),
      userStats
    };
  }

  /**
   * 메시지 검색
   * @param {string} matchId - 매치 ID
   * @param {string} query - 검색어
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 메시지 수
   * @returns {Promise<Array>} 검색된 메시지 목록
   * @note 암호화된 메시지는 검색이 제한될 수 있음
   */
  async searchMessages(matchId: string, query: string, page: number, limit: number) {
    // Note: This is a basic search. For production, consider using a full-text search
    const messages = await prisma.chatMessage.findMany({
      where: {
        matchId,
        // Note: This won't work well with encrypted messages
        // You'd need to implement a different approach for encrypted content search
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

    return messages;
  }

  /**
   * 오래된 메시지 삭제
   * @param {number} olderThanDays - 삭제할 메시지의 기준 일수
   * @returns {Promise<number>} 삭제된 메시지 수
   */
  async deleteOldMessages(olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        match: { status: { in: ['EXPIRED', 'DELETED'] } }
      }
    });

    console.log(`Deleted ${deletedMessages.count} old messages`);
    return deletedMessages.count;
  }

  /**
   * 타이핑 중인 사용자 목록 조회
   * @param {string} matchId - 매치 ID
   * @returns {Promise<string[]>} 타이핑 중인 사용자 ID 목록
   * @todo Redis를 사용한 실시간 타이핑 상태 구현 필요
   */
  async getTypingUsers(matchId: string): Promise<string[]> {
    // In a real implementation, you'd store typing status in Redis or similar
    // For now, return empty array
    return [];
  }

  /**
   * 타이핑 상태 설정
   * @param {string} matchId - 매치 ID
   * @param {string} userId - 사용자 ID
   * @param {boolean} isTyping - 타이핑 여부
   * @returns {Promise<Object>} 타이핑 상태 정보
   * @todo Redis를 사용한 TTL 기반 구현 필요
   */
  async setTypingStatus(matchId: string, userId: string, isTyping: boolean) {
    // In a real implementation, you'd store this in Redis with TTL
    // For now, just return success
    return { matchId, userId, isTyping };
  }

  /**
   * 일평균 메시지 수 계산
   * @private
   * @param {Date} matchCreatedAt - 매치 생성일
   * @param {number} totalMessages - 전체 메시지 수
   * @returns {number} 일평균 메시지 수
   */
  private calculateAverageMessagesPerDay(matchCreatedAt: Date, totalMessages: number): number {
    const daysSinceMatch = Math.ceil((Date.now() - matchCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceMatch > 0 ? Math.round((totalMessages / daysSinceMatch) * 100) / 100 : 0;
  }

  /**
   * 채팅 백업 생성
   * @param {string} matchId - 매치 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<Object>} 채팅 백업 데이터
   * @throws {Error} 매치를 찾을 수 없거나 권한이 없을 때
   */
  async generateChatBackup(matchId: string, userId: string) {
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
      throw createError(403, '이 채팅의 백업을 생성할 권한이 없습니다.');
    }

    // Get message count first
    const messageCount = await prisma.chatMessage.count({
      where: { matchId }
    });

    // Use pagination to avoid memory issues
    const batchSize = 100;
    const totalBatches = Math.ceil(messageCount / batchSize);
    const allMessages: any[] = [];

    for (let i = 0; i < totalBatches; i++) {
      const messages = await this.getMessages(matchId, i + 1, batchSize);
      allMessages.push(...messages);
    }

    const chatBackup = {
      matchId,
      participants: [match.user1, match.user2],
      messageCount: allMessages.length,
      exportedAt: new Date(),
      messages: allMessages
    };

    return chatBackup;
  }
}

export const chatService = new ChatService();
