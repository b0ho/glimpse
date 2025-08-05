import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { EncryptionService } from '../core/encryption/encryption.service';
import { CacheService } from '../core/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  SendMessageDto,
  MessageReactionDto,
  SearchMessagesDto,
  SetTypingStatusDto,
} from './dto/chat.dto';
// import { CHAT_CONFIG } from '@shared/constants';

/**
 * 채팅 서비스
 *
 * 실시간 메시징 및 채팅 관리 기능을 제공합니다.
 * 메시지 암호화, 읽음 표시, 타이핑 상태 등을 처리합니다.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly cacheService: CacheService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * 특정 매치의 메시지 목록 조회
   */
  async getMessages(matchId: string, page: number = 1, limit: number = 50) {
    // 캐시 확인
    const cacheKey = `messages:${matchId}:page${page}:limit${limit}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { matchId },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 메시지 복호화
    const decryptedMessages = await Promise.all(
      messages.map(async (message) => {
        let content = message.content;

        if (message.isEncrypted) {
          try {
            content = await this.encryptionService.decrypt(message.content);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            content = '[암호화된 메시지]';
          }
        }

        // 반응들을 이모지별로 그룹화
        const reactionsByEmoji = message.reactions.reduce(
          (acc, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
              };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push({
              id: reaction.user.id,
              nickname: reaction.user.nickname,
            });
            return acc;
          },
          {} as Record<string, any>,
        );

        return {
          id: message.id,
          content,
          type: message.type,
          sender: message.sender,
          readAt: message.readAt,
          createdAt: message.createdAt,
          reactions: Object.values(reactionsByEmoji),
        };
      }),
    );

    // 시간순 정렬 (오래된 것부터)
    const sortedMessages = decryptedMessages.reverse();

    // 캐시 저장 (5분)
    await this.cache.set(cacheKey, sortedMessages, 300000);

    return sortedMessages;
  }

  /**
   * 메시지 전송
   */
  async sendMessage(matchId: string, senderId: string, data: SendMessageDto) {
    const { content, type = 'TEXT' } = data;

    // 내용 길이 검증
    const MAX_MESSAGE_LENGTH = 1000;
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new HttpException(
        `메시지는 ${MAX_MESSAGE_LENGTH}자 이하여야 합니다.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: ContentFilterService 통합 필요
    // 현재는 기본적인 필터링만 수행
    const finalContent = content.trim();

    // 내용 암호화
    const encryptedContent = await this.encryptionService.encrypt(finalContent);

    const message = await this.prisma.chatMessage.create({
      data: {
        matchId,
        senderId,
        content: encryptedContent,
        type,
        isEncrypted: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    // 캐시 무효화
    await this.invalidateMessagesCache(matchId);

    return {
      id: message.id,
      content: finalContent, // 복호화된 내용 반환
      type: message.type,
      sender: message.sender,
      createdAt: message.createdAt,
    };
  }

  /**
   * 사용자의 채팅 목록 요약 조회
   */
  async getChatSummary(userId: string, page: number = 1, limit: number = 20) {
    // 캐시 확인
    const cacheKey = `chat-summary:${userId}:page${page}`;
    const cached = await this.cacheService.getUserCache(userId, cacheKey);
    if (cached) {
      return cached;
    }

    // 활성 매치 조회
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            lastActive: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            lastActive: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: [
        {
          messages: {
            _count: 'desc',
          },
        },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
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
              content = await this.encryptionService.decrypt(content);
            } catch (error) {
              content = '[암호화된 메시지]';
            }
          }

          lastMessageContent = {
            content:
              content.length > 50 ? content.substring(0, 50) + '...' : content,
            isFromMe: lastMessage.senderId === userId,
            createdAt: lastMessage.createdAt,
          };
        }

        // 읽지 않은 메시지 수
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            matchId: match.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          matchId: match.id,
          user: otherUser,
          group: match.group,
          lastMessage: lastMessageContent,
          unreadCount,
          matchCreatedAt: match.createdAt,
        };
      }),
    );

    // 캐시 저장 (5분)
    await this.cacheService.setUserCache(userId, cacheKey, chatSummaries, 300);

    return chatSummaries;
  }

  /**
   * 모든 메시지를 읽음으로 표시
   */
  async markAllMessagesAsRead(matchId: string, userId: string) {
    // 매치 확인
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new HttpException(
        '이 채팅에 접근할 권한이 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 상대방이 보낸 읽지 않은 메시지들을 읽음 처리
    const otherUserId =
      match.user1Id === userId ? match.user2Id : match.user1Id;

    const updatedMessages = await this.prisma.chatMessage.updateMany({
      where: {
        matchId,
        senderId: otherUserId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    // 캐시 무효화
    await this.invalidateMessagesCache(matchId);
    await this.cacheService.invalidateUserCache(userId);

    return {
      markedAsRead: updatedMessages.count,
      message: `${updatedMessages.count}개의 메시지를 읽음으로 표시했습니다.`,
    };
  }

  /**
   * 메시지 통계 조회
   */
  async getMessageStats(matchId: string) {
    const [totalMessages, messagesByUser] = await Promise.all([
      this.prisma.chatMessage.count({ where: { matchId } }),
      this.prisma.chatMessage.groupBy({
        by: ['senderId'],
        where: { matchId },
        _count: true,
      }),
    ]);

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: { select: { id: true, nickname: true } },
        user2: { select: { id: true, nickname: true } },
      },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    const userStats = messagesByUser.map((stat) => {
      const user = stat.senderId === match.user1Id ? match.user1 : match.user2;
      return {
        user,
        messageCount: stat._count,
        percentage: totalMessages > 0 ? (stat._count / totalMessages) * 100 : 0,
      };
    });

    return {
      totalMessages,
      averageMessagesPerDay: this.calculateAverageMessagesPerDay(
        match.createdAt,
        totalMessages,
      ),
      userStats,
    };
  }

  /**
   * 메시지 검색
   */
  async searchMessages(matchId: string, searchDto: SearchMessagesDto) {
    const { query, page = 1, limit = 20 } = searchDto;

    // 암호화된 메시지는 검색이 제한적임
    // 실제 구현에서는 별도의 검색 인덱스 구축 필요
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        matchId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: { id: true, nickname: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return messages;
  }

  /**
   * 메시지 반응 추가/제거
   */
  async toggleMessageReaction(
    messageId: string,
    userId: string,
    reactionDto: MessageReactionDto,
  ) {
    const { emoji } = reactionDto;

    // 기존 반응 확인
    const existingReaction = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (existingReaction) {
      // 반응 제거
      await this.prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });

      return { action: 'removed', emoji };
    } else {
      // 반응 추가
      const reaction = await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });

      return { action: 'added', emoji, reactionId: reaction.id };
    }
  }

  /**
   * 타이핑 상태 설정
   */
  async setTypingStatus(
    matchId: string,
    userId: string,
    statusDto: SetTypingStatusDto,
  ) {
    const { isTyping } = statusDto;
    const key = `typing:${matchId}:${userId}`;

    if (isTyping) {
      // Redis에 타이핑 상태 저장 (5초 TTL)
      await this.cache.set(key, true, 5000);
    } else {
      // 타이핑 상태 제거
      await this.cache.del(key);
    }

    return { matchId, userId, isTyping };
  }

  /**
   * 타이핑 중인 사용자 목록 조회
   */
  async getTypingUsers(matchId: string): Promise<string[]> {
    // 매치의 모든 사용자 확인
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return [];
    }

    const typingUsers: string[] = [];
    const userIds = [match.user1Id, match.user2Id];

    for (const userId of userIds) {
      const key = `typing:${matchId}:${userId}`;
      const isTyping = await this.cache.get(key);
      if (isTyping) {
        typingUsers.push(userId);
      }
    }

    return typingUsers;
  }

  /**
   * 오래된 메시지 삭제
   */
  async deleteOldMessages(olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedMessages = await this.prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        match: { status: { in: ['EXPIRED', 'DELETED'] } },
      },
    });

    console.log(`Deleted ${deletedMessages.count} old messages`);
    return deletedMessages.count;
  }

  /**
   * 채팅 백업 생성
   */
  async generateChatBackup(matchId: string, userId: string) {
    // 매치 확인 및 권한 검증
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: { select: { id: true, nickname: true } },
        user2: { select: { id: true, nickname: true } },
      },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new HttpException(
        '이 채팅의 백업을 생성할 권한이 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 전체 메시지 수 확인
    const messageCount = await this.prisma.chatMessage.count({
      where: { matchId },
    });

    // 배치 처리로 메모리 문제 방지
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
      messages: allMessages,
    };

    return chatBackup;
  }

  /**
   * 일평균 메시지 수 계산
   */
  private calculateAverageMessagesPerDay(
    matchCreatedAt: Date,
    totalMessages: number,
  ): number {
    const daysSinceMatch = Math.ceil(
      (Date.now() - matchCreatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceMatch > 0
      ? Math.round((totalMessages / daysSinceMatch) * 100) / 100
      : 0;
  }

  /**
   * 메시지 캐시 무효화
   */
  private async invalidateMessagesCache(matchId: string) {
    // 해당 매치의 모든 메시지 캐시 삭제
    const pattern = `messages:${matchId}:*`;
    // Redis 패턴 매칭으로 삭제 (실제 구현 시 Redis 클라이언트 사용)
    // 현재는 간단히 몇 개의 캐시만 삭제
    for (let page = 1; page <= 10; page++) {
      for (const limit of [20, 50, 100]) {
        await this.cache.del(`messages:${matchId}:page${page}:limit${limit}`);
      }
    }
  }
}
