import { prisma } from "../config/database";
import { createError } from '../middleware/errorHandler';
import { NotificationService } from './NotificationService';
import { APP_CONFIG } from '@shared/constants';
import { canUserLike, calculateLikeCost } from '@shared/utils';


const notificationService = new NotificationService();

export class LikeService {
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

    // Create like record
    const like = await prisma.userLike.create({
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
      await prisma.user.update({
        where: { id: fromUserId },
        data: {
          credits: { decrement: creditCost }
        }
      });
    }

    // If mutual like, create match and update both likes
    if (isMatch && mutualLike) {
      // Update the existing mutual like
      await prisma.userLike.update({
        where: { id: mutualLike.id },
        data: { isMatch: true }
      });

      // Create match record
      const match = await prisma.match.create({
        data: {
          user1Id: fromUserId < toUserId ? fromUserId : toUserId,
          user2Id: fromUserId < toUserId ? toUserId : fromUserId,
          groupId,
          status: 'ACTIVE'
        }
      });

      // Send match notifications to both users
      await Promise.all([
        notificationService.sendMatchNotification(fromUserId, toUserId, match.id),
        notificationService.sendMatchNotification(toUserId, fromUserId, match.id)
      ]);

      return {
        likeId: like.id,
        isMatch: true,
        matchId: match.id,
        message: '축하합니다! 새로운 매치가 생성되었습니다.'
      };
    } else {
      // Send like notification to target user
      await notificationService.sendLikeNotification(toUserId, fromUserId, groupId);

      return {
        likeId: like.id,
        isMatch: false,
        message: '좋아요를 보냈습니다!'
      };
    }
  }

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

  async getLikeStats(userId: string) {
    const [sent, received, matches] = await Promise.all([
      prisma.userLike.count({ where: { fromUserId: userId } }),
      prisma.userLike.count({ where: { toUserId: userId } }),
      prisma.userLike.count({ where: { fromUserId: userId, isMatch: true } })
    ]);

    return { sent, received, matches };
  }

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
