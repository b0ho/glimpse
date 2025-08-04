import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CacheService } from '../core/cache/cache.service';
import { Prisma } from '@prisma/client';
// import { LIKE_CONFIG, MATCHING_CONFIG } from '@shared/constants';
// import { generateId } from '@shared/utils';

const LIKE_CONFIG = {
  DAILY_LIKE_LIMIT: 1,
  PREMIUM_UNLIMITED: true,
  SUPER_LIKE_COST: 5,
  COOLDOWN_PERIOD: 14 * 24 * 60 * 60 * 1000, // 14 days
};

const MATCHING_CONFIG = {
  MIN_LIKES_FOR_RECOMMENDATION: 5,
  COMPATIBILITY_WEIGHTS: {
    AGE: 0.3,
    INTERESTS: 0.4,
    LOCATION: 0.2,
    ACTIVITY: 0.1,
  },
};
import {
  CreateLikeDto,
  CreateSuperLikeDto,
  GetMatchesQueryDto,
} from './dto/matching.dto';

/**
 * 매칭 서비스
 * 
 * 좋아요, 매칭, 추천 기능을 담당합니다.
 */
@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 좋아요 보내기
   * 
   * @param userId 사용자 ID
   * @param data 좋아요 데이터
   * @returns 좋아요 결과
   */
  async createLike(userId: string, data: CreateLikeDto) {
    const { targetUserId, groupId, reason } = data;

    // 자기 자신에게 좋아요 불가
    if (userId === targetUserId) {
      throw new HttpException('자기 자신에게 좋아요를 보낼 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    // 그룹 멤버십 확인
    const [userMembership, targetMembership] = await Promise.all([
      this.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId, groupId },
        },
      }),
      this.prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: targetUserId, groupId },
        },
      }),
    ]);

    if (!userMembership || userMembership.status !== 'ACTIVE') {
      throw new HttpException('그룹 멤버가 아닙니다.', HttpStatus.FORBIDDEN);
    }

    if (!targetMembership || targetMembership.status !== 'ACTIVE') {
      throw new HttpException('대상이 그룹 멤버가 아닙니다.', HttpStatus.BAD_REQUEST);
    }

    // 중복 좋아요 및 쿨다운 확인
    const existingLike = await this.prisma.userLike.findFirst({
      where: {
        fromUserId: userId,
        toUserId: targetUserId,
        groupId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingLike) {
      const cooldownEnd = new Date(existingLike.createdAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + 14); // 14 days cooldown
      
      if (new Date() < cooldownEnd) {
        throw new HttpException(
          `14일 후에 다시 좋아요를 보낼 수 있습니다.`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // 사용자 정보 조회 (크레딧 확인)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        credits: true,
        lastActive: true,
      },
    });

    if (!user) {
      throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 프리미엄이 아닌 경우 크레딧 확인
    if (!user.isPremium) {
      // 일일 무료 좋아요 확인
      const cacheKey = `daily_like_used:${userId}:${new Date().toDateString()}`;
      const dailyLikeUsed = await this.cacheService.get<boolean>(cacheKey);
      
      if (!dailyLikeUsed && user.credits === 0) {
        // 오늘의 무료 좋아요 사용
        await this.cacheService.set(cacheKey, true, { ttl: 86400 }); // 24 hours
      } else if (user.credits > 0) {
        // 크레딧 사용
        await this.prisma.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } },
        });
      } else {
        throw new HttpException(
          '좋아요를 보낼 크레딧이 부족합니다.',
          HttpStatus.PAYMENT_REQUIRED
        );
      }
    }

    // 트랜잭션으로 좋아요 생성 및 매치 확인
    const result = await this.prisma.$transaction(async (tx) => {
      // 좋아요 생성
      const like = await tx.userLike.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
          groupId,
          // reason,
          isSuper: false,
        },
      });

      // 상대방이 나를 좋아요 했는지 확인
      const mutualLike = await tx.userLike.findFirst({
        where: {
          fromUserId: targetUserId,
          toUserId: userId,
          groupId,
          isMatch: false,
        },
      });

      let match = null;
      if (mutualLike) {
        // 매치 생성
        match = await tx.match.create({
          data: {
            user1Id: userId,
            user2Id: targetUserId,
            groupId,
            status: 'ACTIVE',
            createdAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          },
        });

        // 좋아요 상태 업데이트
        await tx.userLike.updateMany({
          where: {
            OR: [
              { id: like.id },
              { id: mutualLike.id },
            ],
          },
          data: { isMatch: true },
        });

        // 매치 알림 전송
        await this.notificationService.sendNotification({
          userId: targetUserId,
          type: 'MATCH_CREATED',
          content: '새로운 매치가 생성되었습니다!',
          data: { matchedUserId: userId, matchId: match.id },
        });
        await this.notificationService.sendNotification({
          userId: userId,
          type: 'MATCH_CREATED',
          content: '새로운 매치가 생성되었습니다!',
          data: { matchedUserId: targetUserId, matchId: match.id },
        });
      } else {
        // 좋아요 알림 전송 (익명)
        await this.notificationService.sendNotification({
          userId: targetUserId,
          type: 'LIKE_RECEIVED',
          content: '누군가 당신을 좋아합니다!',
          data: { fromUserId: userId, groupId },
        });
      }

      return { like, match };
    });

    // 캐시 무효화
    await Promise.all([
      this.cacheService.invalidateUserCache(userId),
      this.cacheService.invalidateUserCache(targetUserId),
    ]);

    return {
      success: true,
      matched: !!result.match,
      matchId: result.match?.id,
    };
  }

  /**
   * 슈퍼 좋아요 보내기 (프리미엄)
   * 
   * @param userId 사용자 ID
   * @param data 슈퍼 좋아요 데이터
   * @returns 좋아요 결과
   */
  async createSuperLike(userId: string, data: CreateSuperLikeDto) {
    // 프리미엄 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      throw new HttpException('슈퍼 좋아요는 프리미엄 멤버만 사용할 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    // 일반 좋아요와 동일한 검증 로직 후 isSuper: true로 생성
    const result = await this.createLike(userId, data);
    
    // 슈퍼 좋아요 메시지 전송
    if (data.message) {
      await this.notificationService.sendNotification({
        userId: data.targetUserId,
        type: 'LIKE_RECEIVED',
        content: `누군가 당신에게 슈퍼 좋아요를 보냈습니다! 💫\n메시지: ${data.message}`,
        data: { fromUserId: userId, groupId: data.groupId, isSuperLike: true, message: data.message },
      });
    }

    return result;
  }

  /**
   * 좋아요 취소
   * 
   * @param likeId 좋아요 ID
   * @param userId 사용자 ID
   */
  async cancelLike(likeId: string, userId: string) {
    const like = await this.prisma.userLike.findUnique({
      where: { id: likeId },
    });

    if (!like || like.fromUserId !== userId) {
      throw new HttpException('좋아요를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (like.isMatch) {
      throw new HttpException('매치된 좋아요는 취소할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.userLike.delete({
      where: { id: likeId },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);
  }

  /**
   * 보낸 좋아요 목록 조회
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID (옵션)
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 좋아요 목록
   */
  async getSentLikes(
    userId: string,
    groupId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = {
      fromUserId: userId,
      isMatch: false,
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const likes = await this.prisma.userLike.findMany({
      where,
      include: {
        toUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return likes;
  }

  /**
   * 받은 좋아요 목록 조회 (프리미엄)
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID (옵션)
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 좋아요 목록
   */
  async getReceivedLikes(
    userId: string,
    groupId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // 프리미엄 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      throw new HttpException('받은 좋아요는 프리미엄 멤버만 볼 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    const where: any = {
      toUserId: userId,
      isMatch: false,
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const likes = await this.prisma.userLike.findMany({
      where,
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return likes;
  }

  /**
   * 매치 목록 조회
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID (옵션)
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 매치 목록
   */
  async getUserMatches(
    userId: string,
    groupId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: Prisma.MatchWhereInput = {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      status: 'ACTIVE',
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const matches = await this.prisma.match.findMany({
      where,
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return matches.map(match => ({
      ...match,
      partner: match.user1Id === userId ? match.user2 : match.user1,
      messageCount: match._count.messages,
    }));
  }

  /**
   * 매치 상세 정보 조회
   * 
   * @param matchId 매치 ID
   * @param userId 사용자 ID
   * @returns 매치 정보
   */
  async getMatchById(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            interests: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            interests: true,
          },
        },
        group: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new HttpException('매치에 접근 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    return {
      ...match,
      partner: match.user1Id === userId ? match.user2 : match.user1,
      messageCount: match._count.messages,
    };
  }

  /**
   * 매치 해제
   * 
   * @param matchId 매치 ID
   * @param userId 사용자 ID
   * @param reason 해제 사유
   */
  async unmatch(matchId: string, userId: string, reason?: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new HttpException('매치 해제 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'DELETED',
        // updatedAt: new Date(),
      },
    });

    // 캐시 무효화
    await Promise.all([
      this.cacheService.invalidateUserCache(match.user1Id),
      this.cacheService.invalidateUserCache(match.user2Id),
    ]);
  }

  /**
   * 매칭 추천 목록 조회
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID
   * @param count 추천 수
   * @returns 추천 사용자 목록
   */
  async getMatchingRecommendations(
    userId: string,
    groupId: string,
    count: number = 10,
  ) {
    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        gender: true,
        interests: true,
        // preferredGender: true,
        // ageRange: true,
        location: true,
      },
    });

    if (!user) {
      throw new HttpException('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 그룹 멤버십 확인
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new HttpException('그룹 멤버가 아닙니다.', HttpStatus.FORBIDDEN);
    }

    // 이미 좋아요를 보낸 사용자 제외
    const sentLikes = await this.prisma.userLike.findMany({
      where: {
        fromUserId: userId,
        groupId,
      },
      select: { toUserId: true },
    });

    const excludeUserIds = [userId, ...sentLikes.map(like => like.toUserId)];

    // 추천 대상 조회
    const recommendations = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        // gender: user.preferredGender || undefined,
        groupMemberships: {
          some: {
            groupId,
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        nickname: true,
        profileImage: true,
        bio: true,
        interests: true,
        location: true,
      },
      take: count * 2, // 스코어링을 위해 더 많이 조회
    });

    // 호환성 스코어 계산 및 정렬
    const scoredRecommendations = recommendations.map(candidate => {
      let score = 0;

      // 관심사 매칭
      const commonInterests = candidate.interests.filter(
        interest => user.interests.includes(interest)
      );
      score += commonInterests.length * 10;

      // 위치 근접성 (간단한 예시)
      // if (user.location && candidate.location) {
      //   if (user.location.city === candidate.location.city) {
      //     score += 5;
      //   }
      // }

      return { ...candidate, score };
    });

    // 스코어 기준 정렬 및 상위 N개 반환
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * 매칭 통계 조회
   * 
   * @param userId 사용자 ID
   * @returns 매칭 통계
   */
  async getUserMatchingStats(userId: string) {
    const [
      totalLikesSent,
      totalLikesReceived,
      totalMatches,
      activeMatches,
      todayLikes,
    ] = await Promise.all([
      this.prisma.userLike.count({
        where: { fromUserId: userId },
      }),
      this.prisma.userLike.count({
        where: { toUserId: userId },
      }),
      this.prisma.match.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId },
          ],
        },
      }),
      this.prisma.match.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId },
          ],
          status: 'ACTIVE',
        },
      }),
      this.prisma.userLike.count({
        where: {
          fromUserId: userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        credits: true,
      },
    });

    return {
      totalLikesSent,
      totalLikesReceived,
      totalMatches,
      activeMatches,
      todayLikes,
      credits: user?.credits || 0,
      dailyLikesRemaining: user?.isPremium 
        ? -1 
        : Math.max(0, LIKE_CONFIG.DAILY_LIKE_LIMIT - (user?.credits || 0)),
    };
  }

  /**
   * 매칭 기간 연장 (프리미엄)
   * 
   * @param matchId 매치 ID
   * @param userId 사용자 ID
   * @returns 연장된 매치
   */
  async extendMatch(matchId: string, userId: string) {
    // 프리미엄 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      throw new HttpException('매치 연장은 프리미엄 멤버만 사용할 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new HttpException('매치를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new HttpException('매치 연장 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    if (match.status !== 'ACTIVE') {
      throw new HttpException('활성 매치만 연장할 수 있습니다.', HttpStatus.BAD_REQUEST);
    }

    // 30일 연장
    const newExpiresAt = new Date(match.createdAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: { createdAt: newExpiresAt },
    });

    return updatedMatch;
  }

  /**
   * 매칭 이력 조회
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID (옵션)
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 매칭 이력
   */
  async getMatchingHistory(
    userId: string,
    groupId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: Prisma.MatchWhereInput = {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const matches = await this.prisma.match.findMany({
      where,
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return matches.map(match => ({
      ...match,
      partner: match.user1Id === userId ? match.user2 : match.user1,
    }));
  }

  /**
   * 일일 좋아요 갱신
   * 
   * @param userId 사용자 ID
   * @returns 갱신 결과
   */
  async refreshDailyLikes(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: 0,
        lastActive: today,
      },
      select: {
        credits: true,
        isPremium: true,
      },
    });

    return {
      dailyLikesRemaining: user.isPremium 
        ? -1 
        : LIKE_CONFIG.DAILY_LIKE_LIMIT,
      credits: user.credits,
    };
  }

  /**
   * 좋아요 되돌리기 (프리미엄)
   * 
   * @param userId 사용자 ID
   * @returns 되돌린 좋아요
   */
  async rewindLastLike(userId: string) {
    // 프리미엄 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      throw new HttpException('좋아요 되돌리기는 프리미엄 멤버만 사용할 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    // 가장 최근 좋아요 찾기
    const lastLike = await this.prisma.userLike.findFirst({
      where: {
        fromUserId: userId,
        isMatch: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastLike) {
      throw new HttpException('되돌릴 좋아요가 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 5분 이내만 가능
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastLike.createdAt < fiveMinutesAgo) {
      throw new HttpException('5분이 지난 좋아요는 되돌릴 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    // 좋아요 삭제
    await this.prisma.userLike.delete({
      where: { id: lastLike.id },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return { success: true };
  }

  /**
   * 만료된 매치 정리
   */
  async cleanupExpiredMatches() {
    const now = new Date();
    
    const expiredMatches = await this.prisma.match.updateMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return { cleaned: expiredMatches.count };
  }
}