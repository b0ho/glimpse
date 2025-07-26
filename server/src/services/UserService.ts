import { prisma } from "../config/database";
import { createError } from '../middleware/errorHandler';
import { PRICING, APP_CONFIG } from '@shared/constants';
import { getMatchCompatibilityScore } from '@shared/utils';



export class UserService {
  async getRecommendations(userId: string, groupId: string, page: number, limit: number) {
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

    return recommendations;
  }

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

  async purchaseCredits(userId: string, packageId: string, paymentMethodId: string) {
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
    const updatedPayment = await prisma.payment.update({
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

  async updateLastActive(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });
  }

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
}

export const userService = new UserService();
