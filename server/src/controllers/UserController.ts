import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { UserService } from '../services/UserService';
import { LikeService } from '../services/LikeService';
import { validateNickname, calculateAge } from '@shared/utils';

const prisma = new PrismaClient();
const userService = new UserService();
const likeService = new LikeService();

export class UserController {
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          groupMemberships: {
            include: {
              group: true
            }
          }
        }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          nickname: user.nickname,
          age: user.age,
          gender: user.gender,
          profileImage: user.profileImage,
          bio: user.bio,
          isVerified: user.isVerified,
          credits: user.credits,
          isPremium: user.isPremium,
          premiumUntil: user.premiumUntil,
          lastActive: user.lastActive,
          groups: user.groupMemberships.map(membership => membership.group)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { nickname, age, bio, profileImage } = req.body;

      // Validate inputs
      if (nickname && !validateNickname(nickname)) {
        throw createError(400, '닉네임은 2-10자의 한글, 영문, 숫자만 사용 가능합니다.');
      }

      if (age && (age < 18 || age > 99)) {
        throw createError(400, '나이는 18-99세 사이여야 합니다.');
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(nickname && { nickname }),
          ...(age && { age }),
          ...(bio && { bio }),
          ...(profileImage && { profileImage }),
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          age: user.age,
          bio: user.bio,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { groupId, page = 1, limit = 10 } = req.query;

      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }

      const recommendations = await userService.getRecommendations(
        userId,
        groupId as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          age: true,
          gender: true,
          profileImage: true,
          bio: true,
          lastActive: true
        }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      // Check if users are in same group for anonymity rules
      const canViewDetails = await userService.canViewUserDetails(requesterId, userId);

      res.json({
        success: true,
        data: canViewDetails ? user : {
          id: user.id,
          nickname: user.nickname ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1) : null,
          age: user.age,
          gender: user.gender
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async sendLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { toUserId, groupId } = req.body;

      if (!toUserId || !groupId) {
        throw createError(400, '대상 사용자와 그룹 정보가 필요합니다.');
      }

      if (userId === toUserId) {
        throw createError(400, '자신에게는 좋아요할 수 없습니다.');
      }

      const result = await likeService.sendLike(userId, toUserId, groupId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getReceivedLikes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const likes = await prisma.userLike.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: {
              id: true,
              nickname: true,
              age: true,
              gender: true,
              profileImage: true
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
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: likes.map(like => ({
          id: like.id,
          user: like.fromUser,
          group: like.group,
          isMatch: like.isMatch,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  async getSentLikes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const likes = await prisma.userLike.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: {
              id: true,
              nickname: true,
              age: true,
              gender: true,
              profileImage: true
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
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: likes.map(like => ({
          id: like.id,
          user: like.toUser,
          group: like.group,
          isMatch: like.isMatch,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  async getCredits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          isPremium: true,
          premiumUntil: true
        }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      res.json({
        success: true,
        data: {
          credits: user.credits,
          isPremium: user.isPremium,
          premiumUntil: user.premiumUntil,
          dailyLikesRemaining: user.isPremium ? null : await userService.getDailyLikesRemaining(userId)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async purchaseCredits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { packageId, paymentMethodId } = req.body;

      if (!packageId || !paymentMethodId) {
        throw createError(400, '패키지 ID와 결제 방법이 필요합니다.');
      }

      const result = await userService.purchaseCredits(userId, packageId, paymentMethodId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { confirmPhoneNumber } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.phoneNumber !== confirmPhoneNumber) {
        throw createError(400, '전화번호 확인이 일치하지 않습니다.');
      }

      // Soft delete - anonymize user data
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: `deleted_${Date.now()}`,
          nickname: null,
          profileImage: null,
          bio: null,
          isVerified: false,
          credits: 0,
          isPremium: false,
          premiumUntil: null
        }
      });

      res.json({
        success: true,
        data: { message: '계정이 삭제되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }
}