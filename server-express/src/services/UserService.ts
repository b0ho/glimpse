import { prisma } from "../config/database";
import { createError } from '../middleware/errorHandler';
import { contentFilterService } from './ContentFilterService';
import { PRICING, APP_CONFIG } from '@shared/constants';
import { getMatchCompatibilityScore } from '@shared/utils';
import { cacheService, InvalidateCache } from './CacheService';



/**
 * 사용자 서비스 - 추천, 프로필 관리, 통계
 * @class UserService
 */
export class UserService {
  /**
   * 사용자 추천 목록 조회
   * @param {string} userId - 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Array>} 추천 사용자 목록
   * @throws {Error} 사용자를 찾을 수 없을 때
   */
  async getRecommendations(userId: string, groupId: string, page: number, limit: number) {
    // Check cache first
    const cacheKey = `recommendations:${groupId}:page${page}`;
    const cached = await cacheService.getUserCache(userId, cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's basic info for filtering
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true, gender: true }
    });

    if (!currentUser) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    // Get users in the same group, excluding already liked users
    const alreadyLiked = await prisma.userLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true }
    });

    const excludeUserIds = [userId, ...alreadyLiked.map(like => like.toUserId)];

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        groupMemberships: {
          some: {
            groupId: groupId,
            status: 'ACTIVE'
          }
        },
        nickname: { not: 'deleted_user' },
        age: { not: null },
        gender: { not: null }
      },
      select: {
        id: true,
        nickname: true,
        age: true,
        gender: true,
        profileImage: true,
        bio: true,
        lastActive: true
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate compatibility scores and sort
    const recommendations = users.map(user => ({
      ...user,
      compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
      // Anonymize data until matched
      nickname: user.nickname ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1) : ''
    })).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Cache the recommendations
    await cacheService.setUserCache(userId, cacheKey, recommendations, 900); // 15 minutes

    return recommendations;
  }

  /**
   * 사용자 상세 정보 열람 가능 여부 확인
   * @param {string} requesterId - 요청자 ID
   * @param {string} targetUserId - 대상 사용자 ID
   * @returns {Promise<boolean>} 열람 가능 여부
   */
  async canViewUserDetails(requesterId: string, targetUserId: string): Promise<boolean> {
    // Check if users have matched
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: requesterId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: requesterId }
        ],
        status: 'ACTIVE'
      }
    });

    return !!match;
  }

  /**
   * 일일 남은 좋아요 수 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<number>} 남은 좋아요 수
   */
  async getDailyLikesRemaining(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const likesToday = await prisma.userLike.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: today }
      }
    });

    return Math.max(0, APP_CONFIG.MAX_DAILY_LIKES - likesToday);
  }

  /**
   * 크레딧 구매
   * @param {string} userId - 사용자 ID
   * @param {string} packageId - 패키지 ID
   * @param {string} _paymentMethodId - 결제 수단 ID
   * @returns {Promise<Object>} 구매 결과
   * @throws {Error} 유효하지 않은 패키지
   */
  async purchaseCredits(userId: string, packageId: string, _paymentMethodId: string) {
    const creditPackage = PRICING.LIKE_PACKAGES.find(pkg => 
      pkg.credits.toString() === packageId
    );

    if (!creditPackage) {
      throw createError(400, '유효하지 않은 패키지입니다.');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: creditPackage.price,
        currency: 'KRW',
        type: 'LIKE_CREDITS',
        status: 'PENDING',
        method: 'CARD',
        metadata: {
          credits: creditPackage.credits,
          packageId
        }
      }
    });

    // TODO: Process actual payment with Stripe/Korean payment services
    // For now, simulate successful payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    // Add credits to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditPackage.credits
        }
      }
    });

    return {
      paymentId: payment.id,
      creditsAdded: creditPackage.credits,
      totalPaid: creditPackage.price
    };
  }

  /**
   * 호환성 점수 계산
   * @private
   * @param {Object} currentUser - 현재 사용자
   * @param {Object} targetUser - 대상 사용자
   * @returns {number} 호환성 점수 (0-100)
   */
  private calculateCompatibilityScore(currentUser: any, targetUser: any): number {
    let score = 50; // Base score

    // Age compatibility (0-30 points)
    if (currentUser.age && targetUser.age) {
      const ageScore = getMatchCompatibilityScore(currentUser.age, targetUser.age);
      score += (ageScore / 100) * 30;
    }

    // Activity score (0-20 points)
    const lastActiveHours = (Date.now() - new Date(targetUser.lastActive).getTime()) / (1000 * 60 * 60);
    if (lastActiveHours < 24) score += 20;
    else if (lastActiveHours < 72) score += 10;
    else if (lastActiveHours < 168) score += 5;

    return Math.round(score);
  }

  /**
   * 마지막 활동 시간 업데이트
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async updateLastActive(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });
  }

  /**
   * 사용자 통계 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 통계
   */
  async getUserStats(userId: string) {
    const [
      sentLikesCount,
      receivedLikesCount,
      matchesCount,
      groupsCount
    ] = await Promise.all([
      prisma.userLike.count({ where: { fromUserId: userId } }),
      prisma.userLike.count({ where: { toUserId: userId } }),
      prisma.match.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: 'ACTIVE'
        }
      }),
      prisma.groupMember.count({
        where: { userId, status: 'ACTIVE' }
      })
    ]);

    return {
      sentLikes: sentLikesCount,
      receivedLikes: receivedLikesCount,
      matches: matchesCount,
      groups: groupsCount
    };
  }

  /**
   * 프로필 업데이트
   * @param {string} userId - 사용자 ID
   * @param {Object} data - 업데이트할 데이터
   * @param {string} [data.nickname] - 닉네임
   * @param {string} [data.bio] - 자기소개
   * @param {number} [data.age] - 나이
   * @param {string} [data.profileImage] - 프로필 이미지 URL
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   * @throws {Error} 유효성 검사 실패 또는 부적절한 내용 포함 시
   */
  async updateProfile(userId: string, data: {
    nickname?: string;
    bio?: string;
    age?: number;
    profileImage?: string;
  }) {
    const updateData: any = {};

    // Nickname validation (1-40 chars, duplicates allowed)
    if (data.nickname) {
      const trimmedNickname = data.nickname.trim();
      
      if (trimmedNickname.length < 1 || trimmedNickname.length > 40) {
        throw createError(400, '닉네임은 1자 이상 40자 이하여야 합니다.');
      }
      
      // Nickname filtering
      const nicknameFilter = await contentFilterService.filterText(trimmedNickname, 'profile');
      if (nicknameFilter.severity === 'blocked') {
        throw createError(400, '닉네임에 부적절한 내용이 포함되어 있습니다.');
      }
      updateData.nickname = nicknameFilter.filteredText || trimmedNickname;
    }

    // Bio filtering
    if (data.bio) {
      const bioFilter = await contentFilterService.filterText(data.bio, 'profile');
      if (bioFilter.severity === 'blocked') {
        throw createError(400, '자기소개에 부적절한 내용이 포함되어 있습니다.');
      }
      updateData.bio = bioFilter.filteredText || data.bio;
    }

    // Age validation
    if (data.age !== undefined) {
      if (data.age < 18 || data.age > 100) {
        throw createError(400, '나이는 18세 이상 100세 이하여야 합니다.');
      }
      updateData.age = data.age;
    }

    // Profile image validation (if URL is provided)
    if (data.profileImage) {
      // Image content filtering can be added here
      updateData.profileImage = data.profileImage;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        bio: true,
        age: true,
        gender: true,
        profileImage: true
      }
    });

    return updatedUser;
  }

  /**
   * 계정 삭제
   * @param {string} userId - 사용자 ID
   * @param {string} [reason] - 삭제 사유
   * @returns {Promise<boolean>} 삭제 성공 여부
   * @throws {Error} 사용자를 찾을 수 없을 때
   */
  async deleteAccount(userId: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    // Soft delete - mark as deleted with reason
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletionReason: reason,
        // Keep data for 30 days for recovery
      }
    });

    // Cancel all active subscriptions
    if (user.isPremium) {
      // TODO: Cancel subscription through payment provider
    }

    // Invalidate all sessions
    await cacheService.invalidateUserCache(userId);

    return true;
  }
}

export const userService = new UserService();
