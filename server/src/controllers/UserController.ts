import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { userService } from '../services/UserService';
import { likeService } from '../services/LikeService';
import { validateNickname } from '@shared/utils';
import { firebaseService } from '../services/FirebaseService';

export class UserController {
  async getCurrentUser(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      
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

  async updateProfile(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
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

  async getRecommendations(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
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

  async getUserById(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const requesterId = req.auth!.userId;

      if (!userId) {
        throw createError(400, '사용자 ID가 필요합니다.');
      }

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
          nickname: user.nickname ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1) : '',
          age: user.age,
          gender: user.gender
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async sendLike(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
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

  async getReceivedLikes(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
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

  async getSentLikes(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { page = 1, limit = 20 } = req.query;

      const likes = await prisma.userLike.findMany({
        where: { 
          fromUserId: userId,
          cancelledAt: null,
          deletedAt: null
        },
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
          isSuper: like.isSuper,
          mode: like.mode,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  async getCredits(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;

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

  async purchaseCredits(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
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

  async deleteAccount(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { reason } = req.body;

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

      res.json({
        success: true,
        data: { message: '계정이 비활성화되었습니다. 30일 내 로그인 시 복구됩니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelLike(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { likeId } = req.params;

      const like = await prisma.userLike.findFirst({
        where: {
          id: likeId,
          fromUserId: userId,
          cancelledAt: null
        }
      });

      if (!like) {
        throw createError(404, '취소할 좋아요를 찾을 수 없습니다.');
      }

      // Check if within 24 hours
      const timePassed = Date.now() - like.createdAt.getTime();
      if (timePassed > 24 * 60 * 60 * 1000) {
        throw createError(400, '24시간이 지난 좋아요는 취소할 수 없습니다.');
      }

      // Cancel the like
      await prisma.userLike.update({
        where: { id: likeId },
        data: { cancelledAt: new Date() }
      });

      // Remove match if exists
      await prisma.match.deleteMany({
        where: {
          OR: [
            { user1Id: userId, user2Id: like.toUserId },
            { user1Id: like.toUserId, user2Id: userId }
          ]
        }
      });

      res.json({
        success: true,
        data: { message: '좋아요가 취소되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLikeHistory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { likeIds } = req.body;

      if (!Array.isArray(likeIds) || likeIds.length === 0) {
        throw createError(400, '삭제할 항목을 선택해주세요.');
      }

      // Soft delete likes
      await prisma.userLike.updateMany({
        where: {
          id: { in: likeIds },
          fromUserId: userId
        },
        data: { deletedAt: new Date() }
      });

      res.json({
        success: true,
        data: { message: `${likeIds.length}개의 이력이 삭제되었습니다.` }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyCompany(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { companyId, method, data } = req.body;

      // TODO: Implement company verification logic
      // This would integrate with CompanyVerificationService

      res.json({
        success: true,
        data: { 
          message: '회사 인증 요청이 접수되었습니다.',
          verificationId: 'temp-id'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async subscribePremium(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { plan, paymentMethod } = req.body;

      // TODO: Implement premium subscription logic
      // This would integrate with PaymentService

      res.json({
        success: true,
        data: { 
          message: '프리미엄 구독이 활성화되었습니다.',
          subscriptionId: 'temp-sub-id'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async registerFCMToken(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { token, deviceType } = req.body;

      if (!token || !deviceType) {
        throw createError(400, 'FCM 토큰과 디바이스 타입이 필요합니다.');
      }

      if (!['ios', 'android'].includes(deviceType)) {
        throw createError(400, '유효하지 않은 디바이스 타입입니다.');
      }

      await firebaseService.addUserFCMToken(userId, token, deviceType as 'ios' | 'android');

      res.json({
        success: true,
        message: 'FCM 토큰이 등록되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFCMToken(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { token } = req.body;

      if (!token) {
        throw createError(400, 'FCM 토큰이 필요합니다.');
      }

      await firebaseService.removeUserFCMToken(userId, token);

      res.json({
        success: true,
        message: 'FCM 토큰이 제거되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationSettings(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const settings = req.body;

      // Validate settings
      const allowedSettings = ['pushEnabled', 'newMessages', 'newMatches', 'likes', 'groupInvites', 'marketing'];
      const filteredSettings: any = {};

      for (const key of allowedSettings) {
        if (key in settings && typeof settings[key] === 'boolean') {
          filteredSettings[key] = settings[key];
        }
      }

      // Store notification settings in user metadata or separate table
      // For now, we'll store in user model (you may want to create a separate NotificationSettings model)
      await prisma.user.update({
        where: { id: userId },
        data: {
          // You might want to add a notificationSettings JSON field to User model
          // notificationSettings: filteredSettings
        }
      });

      res.json({
        success: true,
        data: filteredSettings
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();