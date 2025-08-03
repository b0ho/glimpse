import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * 매칭 서비스
 * 
 * 매칭 목록 조회, 매칭 관리, 채팅 시작 등을 처리합니다.
 */
@Injectable()
export class MatchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자의 매칭 목록 조회
   * 
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 매칭 목록
   */
  async getMatches(userId: string, page: number = 1, limit: number = 10) {
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
            bio: true,
            age: true,
            gender: true,
            height: true,
            mbti: true,
            companyName: true,
            education: true,
            location: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            age: true,
            gender: true,
            height: true,
            mbti: true,
            companyName: true,
            education: true,
            location: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        messages: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return matches.map(match => {
      const partner = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        partner,
        group: match.group,
        lastMessageAt: (match as any).messages?.[0]?.createdAt || null,
        messageCount: (match as any).messages?.length || 0,
        matchedAt: match.createdAt,
      };
    });
  }

  /**
   * 매칭 상세 정보 조회
   * 
   * @param matchId 매칭 ID
   * @param userId 요청 사용자 ID
   * @returns 매칭 상세 정보
   */
  async getMatchById(matchId: string, userId: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            age: true,
            gender: true,
            height: true,
            mbti: true,
            companyName: true,
            education: true,
            location: true,
            lastActive: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            age: true,
            gender: true,
            height: true,
            mbti: true,
            companyName: true,
            education: true,
            location: true,
            lastActive: true,
          },
        },
        group: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!match) {
      throw new NotFoundException('매칭을 찾을 수 없습니다.');
    }

    const partner = match.user1Id === userId ? match.user2 : match.user1;
    const lastMessage = (match as any).messages?.[0];

    return {
      id: match.id,
      partner,
      group: match.group,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      matchedAt: match.createdAt,
      status: match.status,
    };
  }

  /**
   * 매칭 차단
   * 
   * @param matchId 매칭 ID
   * @param userId 요청 사용자 ID
   * @param reason 차단 사유
   */
  async blockMatch(matchId: string, userId: string, reason?: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
    });

    if (!match) {
      throw new NotFoundException('활성 매칭을 찾을 수 없습니다.');
    }

    await this.prisma.$transaction(async tx => {
      // 매칭 상태 업데이트
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'DELETED',
        },
      });

      // 매칭 비활성화는 status로 처리됨
    });
  }

  /**
   * 매칭 통계 조회
   * 
   * @param userId 사용자 ID
   * @returns 매칭 통계
   */
  async getMatchStats(userId: string) {
    const [totalMatches, activeMatches, blockedMatches] = await Promise.all([
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      }),
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
      }),
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'DELETED',
        },
      }),
    ]);

    const recentMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 이내
        },
      },
      select: { id: true },
    });

    return {
      totalMatches,
      activeMatches,
      blockedMatches,
      recentMatchesCount: recentMatches.length,
    };
  }

  /**
   * 채팅 시작
   * 
   * @param matchId 매칭 ID
   * @param userId 요청 사용자 ID
   * @returns 채팅 정보
   */
  async startChat(matchId: string, userId: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
    });

    if (!match) {
      throw new NotFoundException('활성 매칭을 찾을 수 없습니다.');
    }

    // 매칭 정보 반환
    return match;
  }
}
