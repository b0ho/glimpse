import { prisma } from "../config/database";
import { createError } from '../middleware/errorHandler';
import { notificationService } from './NotificationService';
import { APP_CONFIG } from '@shared/constants';
import { canUserLike, calculateLikeCost } from '@shared/utils';

/**
 * 좋아요 서비스 - 좋아요 및 매칭 관리
 * @class LikeService
 */
export class LikeService {
  /**
   * 좋아요 전송
   * @param {string} fromUserId - 좋아요 보내는 사용자 ID
   * @param {string} toUserId - 좋아요 받는 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<Object>} 좋아요 결과 (매칭 여부 포함)
   * @throws {Error} 같은 그룹 아님, 중복 좋아요, 쿨다운, 크레딧 부족 등
   */
  async sendLike(fromUserId: string, toUserId: string, groupId: string) {
    // Check if users are in the same group
    const [fromUserInGroup, toUserInGroup] = await Promise.all([
      prisma.groupMember.findFirst({
        where: { userId: fromUserId, groupId, status: 'ACTIVE' }
      }),
      prisma.groupMember.findFirst({
        where: { userId: toUserId, groupId, status: 'ACTIVE' }
      })
    ]);

    if (!fromUserInGroup || !toUserInGroup) {
      throw createError(400, '같은 그룹에 속한 사용자에게만 좋아요할 수 있습니다.');
    }

    // Check for existing like
    const existingLike = await prisma.userLike.findFirst({
      where: { fromUserId, toUserId, groupId }
    });

    if (existingLike) {
      throw createError(400, '이미 좋아요를 누른 사용자입니다.');
    }

    // Check cooldown (2 weeks)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentLike = await prisma.userLike.findFirst({
      where: {
        fromUserId,
        toUserId,
        createdAt: { gte: twoWeeksAgo }
      }
    });

    if (recentLike) {
      throw createError(400, '같은 사용자에게는 2주 후에 다시 좋아요할 수 있습니다.');
    }

    // Get user info for credit check
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { credits: true, isPremium: true }
    });

    if (!fromUser) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    // Check if user can send like
    if (!canUserLike(fromUser.credits, fromUser.isPremium)) {
      throw createError(400, '좋아요 크레딧이 부족합니다.');
    }

    // Check daily limit for non-premium users
    if (!fromUser.isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const likesToday = await prisma.userLike.count({
        where: {
          fromUserId,
          createdAt: { gte: today }
        }
      });

      if (likesToday >= APP_CONFIG.MAX_DAILY_LIKES) {
        throw createError(400, '일일 좋아요 한도에 도달했습니다.');
      }
    }

    // Check if target user already liked this user (mutual like)
    const mutualLike = await prisma.userLike.findFirst({
      where: { fromUserId: toUserId, toUserId: fromUserId, groupId }
    });

    const isMatch = !!mutualLike;

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create like record
      const like = await tx.userLike.create({
        data: {
          fromUserId,
          toUserId,
          groupId,
          isMatch
        }
      });

      // Deduct credit if not premium
      const creditCost = calculateLikeCost(fromUser.isPremium);
      if (creditCost > 0) {
        await tx.user.update({
          where: { id: fromUserId },
          data: {
            credits: { decrement: creditCost }
          }
        });
      }

      // If mutual like, create match and update both likes
      let match = null;
      if (isMatch && mutualLike) {
        // Update the existing mutual like
        await tx.userLike.update({
          where: { id: mutualLike.id },
          data: { isMatch: true }
        });

        // Create match record
        match = await tx.match.create({
          data: {
            user1Id: fromUserId < toUserId ? fromUserId : toUserId,
            user2Id: fromUserId < toUserId ? toUserId : fromUserId,
            groupId,
            status: 'ACTIVE'
          }
        });
      }

      return { like, match };
    });

    // Send notifications after transaction succeeds
    if (result.match) {
      // Send match notifications to both users
      await Promise.all([
        notificationService.sendMatchNotification(fromUserId, toUserId, result.match.id),
        notificationService.sendMatchNotification(toUserId, fromUserId, result.match.id)
      ]);

      return {
        likeId: result.like.id,
        isMatch: true,
        matchId: result.match.id,
        message: '축하합니다! 새로운 매치가 생성되었습니다.'
      };
    } else {
      // Send like notification to target user
      await notificationService.sendLikeNotification(toUserId, fromUserId, groupId);

      return {
        likeId: result.like.id,
        isMatch: false,
        message: '좋아요를 보냈습니다!'
      };
    }
  }

  /**
   * 좋아요 취소
   * @param {string} fromUserId - 좋아요 보낸 사용자 ID
   * @param {string} toUserId - 좋아요 받은 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<Object>} 취소 결과
   * @throws {Error} 좋아요 기록을 찾을 수 없을 때
   */
  async unlikeUser(fromUserId: string, toUserId: string, groupId: string) {
    const like = await prisma.userLike.findFirst({
      where: { fromUserId, toUserId, groupId }
    });

    if (!like) {
      throw createError(404, '좋아요 기록을 찾을 수 없습니다.');
    }

    // If it was a match, also delete the match and update mutual like
    if (like.isMatch) {
      // Find and delete match
      await prisma.match.deleteMany({
        where: {
          OR: [
            { user1Id: fromUserId, user2Id: toUserId },
            { user1Id: toUserId, user2Id: fromUserId }
          ],
          groupId
        }
      });

      // Update mutual like
      await prisma.userLike.updateMany({
        where: { fromUserId: toUserId, toUserId: fromUserId, groupId },
        data: { isMatch: false }
      });
    }

    // Delete the like
    await prisma.userLike.delete({
      where: { id: like.id }
    });

    return { message: '좋아요가 취소되었습니다.' };
  }

  /**
   * 좋아요 통계 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 좋아요 통계 (보낸 수, 받은 수, 매칭 수)
   */
  async getLikeStats(userId: string) {
    const [sent, received, matches] = await Promise.all([
      prisma.userLike.count({ where: { fromUserId: userId } }),
      prisma.userLike.count({ where: { toUserId: userId } }),
      prisma.userLike.count({ where: { fromUserId: userId, isMatch: true } })
    ]);

    return { sent, received, matches };
  }

  /**
   * 나를 좋아한 사람 목록 조회 (프리미엄 전용)
   * @param {string} userId - 사용자 ID
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<Array>} 좋아요한 사람 목록
   * @throws {Error} 프리미엄 회원이 아닐 때
   */
  async getWhoLikesYou(userId: string, page: number = 1, limit: number = 20) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true }
    });

    if (!user?.isPremium) {
      throw createError(403, '프리미엄 멤버만 이용할 수 있는 기능입니다.');
    }

    const likes = await prisma.userLike.findMany({
      where: { 
        toUserId: userId,
        isMatch: false // Only show non-matched likes
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            age: true,
            gender: true,
            profileImage: true,
            lastActive: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return likes.map(like => ({
      id: like.id,
      user: like.fromUser,
      group: like.group,
      createdAt: like.createdAt
    }));
  }
}

export const likeService = new LikeService();
