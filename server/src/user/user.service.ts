import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { User } from '@prisma/client';
// import { PRICING, APP_CONFIG } from '@shared/constants';
// import { getMatchCompatibilityScore } from '@shared/utils';

const PRICING = {
  PREMIUM_MONTHLY: 9900,
  PREMIUM_YEARLY: 99000,
  CREDIT_PACKAGES: [
    { credits: 5, price: 2500 },
    { credits: 10, price: 4500 },
    { credits: 30, price: 12000 },
    { credits: 50, price: 19000 },
  ],
};

const APP_CONFIG = {
  MIN_AGE: 19,
  MAX_AGE: 100,
  MAX_BIO_LENGTH: 500,
  MAX_PROFILE_IMAGES: 6,
};

/**
 * 사용자 서비스
 *
 * 사용자 프로필, 추천, 크레딧 관리 등을 처리합니다.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 사용자 ID로 사용자 조회
   */
  async findById(userId: string): Promise<User> {
    // Check cache first
    const cached = await this.cacheService.getUserCache(userId, 'profile');
    if (cached) return cached as User;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Cache the user
    await this.cacheService.setUserCache(userId, 'profile', user);
    return user;
  }

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      bio?: string;
      age?: number;
      profileImage?: string;
      height?: number;
      mbti?: string;
      education?: string;
      location?: string;
      companyName?: string;
    },
  ): Promise<User> {
    const updateData: any = {};

    // Nickname validation (1-40 chars, duplicates allowed)
    if (data.nickname) {
      const trimmedNickname = data.nickname.trim();

      if (trimmedNickname.length < 1 || trimmedNickname.length > 40) {
        throw new BadRequestException(
          '닉네임은 1자 이상 40자 이하여야 합니다.',
        );
      }

      // TODO: Content filtering when ContentFilterService is migrated
      updateData.nickname = trimmedNickname;
    }

    // Bio validation
    if (data.bio !== undefined) {
      if (data.bio.length > 500) {
        throw new BadRequestException('자기소개는 500자 이하여야 합니다.');
      }
      // TODO: Content filtering when ContentFilterService is migrated
      updateData.bio = data.bio;
    }

    // Age validation
    if (data.age !== undefined) {
      if (data.age < 18 || data.age > 100) {
        throw new BadRequestException(
          '나이는 18세 이상 100세 이하여야 합니다.',
        );
      }
      updateData.age = data.age;
    }

    // Height validation
    if (data.height !== undefined) {
      if (data.height < 100 || data.height > 250) {
        throw new BadRequestException('키는 100cm 이상 250cm 이하여야 합니다.');
      }
      updateData.height = data.height;
    }

    // MBTI validation
    if (data.mbti !== undefined) {
      const validMbti = /^[EI][NS][TF][JP]$/.test(data.mbti.toUpperCase());
      if (!validMbti) {
        throw new BadRequestException('올바른 MBTI 유형을 입력해주세요.');
      }
      updateData.mbti = data.mbti.toUpperCase();
    }

    // Other fields
    if (data.profileImage !== undefined)
      updateData.profileImage = data.profileImage;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.companyName !== undefined)
      updateData.companyName = data.companyName;

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return updatedUser;
  }

  /**
   * 사용자 추천 목록 조회
   */
  async getRecommendations(
    userId: string,
    groupId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Check cache first
    const cacheKey = `recommendations:${groupId}:page${page}`;
    const cached = await this.cacheService.getUserCache(userId, cacheKey);
    if (cached) {
      return cached;
    }

    // 현재 사용자 정보 조회
    const currentUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { age: true, gender: true },
    });

    if (!currentUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이미 좋아요한 사용자 ID 목록
    const alreadyLiked = await this.prismaService.userLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    const excludeUserIds = [
      userId,
      ...alreadyLiked.map((like) => like.toUserId),
    ];

    // 같은 그룹의 사용자 조회
    const users = await this.prismaService.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        groupMemberships: {
          some: {
            groupId: groupId,
            status: 'ACTIVE',
          },
        },
        nickname: { not: 'deleted_user' },
        age: { not: null },
        gender: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        nickname: true,
        age: true,
        gender: true,
        profileImage: true,
        bio: true,
        lastActive: true,
        height: true,
        mbti: true,
        companyName: true,
        education: true,
        location: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 호환성 점수 계산 및 정렬
    const recommendations = users
      .map((user) => ({
        ...user,
        compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
        // 매칭 전까지 닉네임 일부 숨김
        nickname: user.nickname
          ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1)
          : '',
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Cache the recommendations
    await this.cacheService.setUserCache(userId, cacheKey, recommendations);

    return recommendations;
  }

  /**
   * 사용자 상세 정보 열람 가능 여부 확인
   */
  async canViewUserDetails(
    requesterId: string,
    targetUserId: string,
  ): Promise<boolean> {
    // 매칭 여부 확인
    const match = await this.prismaService.match.findFirst({
      where: {
        OR: [
          { user1Id: requesterId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: requesterId },
        ],
        status: 'ACTIVE',
      },
    });

    return !!match;
  }

  /**
   * 일일 남은 좋아요 수 조회
   */
  async getDailyLikesRemaining(userId: string): Promise<number> {
    const user = await this.findById(userId);

    // Premium users have unlimited likes
    if (user.isPremium) {
      return 999;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const likesToday = await this.prismaService.userLike.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: today },
      },
    });

    return Math.max(0, 1 - likesToday); // 1 daily like for free users
  }

  /**
   * 크레딧 구매
   */
  async purchaseCredits(
    userId: string,
    packageId: string,
    paymentMethodId: string,
  ) {
    const creditPackage = PRICING.CREDIT_PACKAGES.find(
      (pkg) => pkg.credits.toString() === packageId,
    );

    if (!creditPackage) {
      throw new BadRequestException('유효하지 않은 패키지입니다.');
    }

    // 결제 기록 생성
    const payment = await this.prismaService.payment.create({
      data: {
        userId,
        amount: creditPackage.price,
        currency: 'KRW',
        type: 'LIKE_CREDITS',
        status: 'PENDING',
        method: 'CARD',
        metadata: {
          credits: creditPackage.credits,
          packageId,
          paymentMethodId,
        },
      },
    });

    // TODO: 실제 결제 처리 (Stripe/한국 결제 서비스)
    // 현재는 성공적인 결제를 시뮬레이션
    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    // 사용자에게 크레딧 추가
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditPackage.credits,
        },
      },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return {
      paymentId: payment.id,
      creditsAdded: creditPackage.credits,
      totalPaid: creditPackage.price,
    };
  }

  /**
   * 사용자 통계 조회
   */
  async getUserStats(userId: string) {
    const [
      sentLikesCount,
      receivedLikesCount,
      matchesCount,
      groupsCount,
      user,
    ] = await Promise.all([
      this.prismaService.userLike.count({ where: { fromUserId: userId } }),
      this.prismaService.userLike.count({ where: { toUserId: userId } }),
      this.prismaService.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
      }),
      this.prismaService.groupMember.count({
        where: { userId, status: 'ACTIVE' },
      }),
      this.findById(userId),
    ]);

    return {
      sentLikes: sentLikesCount,
      receivedLikes: receivedLikesCount,
      matches: matchesCount,
      groups: groupsCount,
      totalLikes: receivedLikesCount,
      totalMatches: matchesCount,
      activeGroups: groupsCount,
      memberSince: user.createdAt,
      isPremium: user.isPremium,
      credits: user.credits,
    };
  }

  /**
   * 마지막 활동 시간 업데이트
   */
  async updateLastActive(userId: string): Promise<void> {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);
  }

  /**
   * 계정 삭제 (소프트 삭제)
   */
  async deleteAccount(userId: string, reason?: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Soft delete - mark as deleted with reason
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletionReason: reason,
        nickname: 'deleted_user',
        bio: null,
        profileImage: null,
      },
    });

    // Cancel all active subscriptions
    if (user.isPremium) {
      // TODO: Cancel subscription through payment provider when PaymentService is migrated
    }

    // Invalidate all sessions and cache
    await this.cacheService.invalidateUserCache(userId);

    return true;
  }

  /**
   * 프리미엄 구독 활성화
   */
  async activatePremium(userId: string, durationDays: number): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: expiresAt,
      },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return updatedUser;
  }

  /**
   * 프리미엄 구독 취소
   */
  async cancelPremium(userId: string): Promise<User> {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumUntil: null,
      },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return updatedUser;
  }

  /**
   * 호환성 점수 계산
   */
  private calculateCompatibilityScore(
    currentUser: any,
    targetUser: any,
  ): number {
    let score = 50; // 기본 점수

    // 나이 호환성 (0-30점)
    if (currentUser.age && targetUser.age) {
      // TODO: implement compatibility score calculation
      const ageScore = 0; // getMatchCompatibilityScore(currentUser.age, targetUser.age);
      score += (ageScore / 100) * 30;
    }

    // 최근 활동 (0-20점)
    const lastActiveHours = targetUser.lastActive
      ? (Date.now() - new Date(targetUser.lastActive).getTime()) /
        (1000 * 60 * 60)
      : 999;

    if (lastActiveHours < 24) score += 20;
    else if (lastActiveHours < 72) score += 10;
    else if (lastActiveHours < 168) score += 5;

    return Math.round(score);
  }

  /**
   * 사용자 크레딧 차감
   */
  async deductCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);

    if (user.credits < amount) {
      throw new BadRequestException('크레딧이 부족합니다.');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return updatedUser;
  }

  /**
   * 사용자 크레딧 추가
   */
  async addCredits(userId: string, amount: number): Promise<User> {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    // Update cache
    await this.cacheService.setUserCache(userId, 'profile', updatedUser);

    return updatedUser;
  }

  /**
   * 사용자가 특정 그룹의 멤버인지 확인
   */
  async isGroupMember(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.prismaService.groupMember.findFirst({
      where: {
        userId,
        groupId,
        status: 'ACTIVE',
      },
    });

    return !!membership;
  }

  /**
   * 사용자 검색
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return this.prismaService.user.findMany({
      where: {
        OR: [
          { nickname: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
        ],
        deletedAt: null,
      },
      take: limit,
    });
  }
}
