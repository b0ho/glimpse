import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';

export class FriendController {
  async getFriendRequests(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { status = 'PENDING' } = req.query;

      const requests = await prisma.friendRequest.findMany({
        where: {
          toUserId: userId,
          status: status as any
        },
        include: {
          fromUser: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
              bio: true,
              age: true,
              gender: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  async sendFriendRequest(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { toUserId, message } = req.body;

      if (!toUserId) {
        throw createError(400, '친구 요청 대상이 필요합니다.');
      }

      if (userId === toUserId) {
        throw createError(400, '자신에게는 친구 요청을 보낼 수 없습니다.');
      }

      // Check if already friends
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: toUserId },
            { user1Id: toUserId, user2Id: userId }
          ]
        }
      });

      if (existingFriendship) {
        throw createError(400, '이미 친구 관계입니다.');
      }

      // Check if request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          fromUserId: userId,
          toUserId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        throw createError(400, '이미 친구 요청을 보냈습니다.');
      }

      // Check if the other user has privacy settings that block friend requests
      const targetUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { privacySettings: true }
      });

      if (targetUser?.privacySettings && !(targetUser.privacySettings as any).allowFriendRequests) {
        throw createError(403, '해당 사용자는 친구 요청을 받지 않습니다.');
      }

      const request = await prisma.friendRequest.create({
        data: {
          fromUserId: userId,
          toUserId,
          message,
          status: 'PENDING'
        },
        include: {
          fromUser: {
            select: {
              id: true,
              nickname: true,
              profileImage: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptFriendRequest(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { requestId } = req.params;

      const request = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          toUserId: userId,
          status: 'PENDING'
        }
      });

      if (!request) {
        throw createError(404, '친구 요청을 찾을 수 없습니다.');
      }

      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // Create friendship
      const friendship = await prisma.friendship.create({
        data: {
          user1Id: request.fromUserId,
          user2Id: userId
        }
      });

      res.json({
        success: true,
        data: friendship
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectFriendRequest(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { requestId } = req.params;

      const request = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          toUserId: userId,
          status: 'PENDING'
        }
      });

      if (!request) {
        throw createError(404, '친구 요청을 찾을 수 없습니다.');
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      res.json({
        success: true,
        message: '친구 요청을 거절했습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;

      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: {
          user1: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
              bio: true,
              lastActive: true
            }
          },
          user2: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
              bio: true,
              lastActive: true
            }
          }
        }
      });

      const friends = friendships.map(friendship => {
        return friendship.user1Id === userId ? friendship.user2 : friendship.user1;
      });

      res.json({
        success: true,
        data: friends
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFriend(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { friendId } = req.params;

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: friendId },
            { user1Id: friendId, user2Id: userId }
          ]
        }
      });

      if (!friendship) {
        throw createError(404, '친구 관계를 찾을 수 없습니다.');
      }

      await prisma.friendship.delete({
        where: { id: friendship.id }
      });

      res.json({
        success: true,
        message: '친구가 삭제되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const friendController = new FriendController();