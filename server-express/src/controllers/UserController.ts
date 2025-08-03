import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { userService } from '../services/UserService';
import { likeService } from '../services/LikeService';
import { validateNickname } from '@shared/utils';
import { firebaseService } from '../services/FirebaseService';

/**
 * 사용자 컨트롤러 - 사용자 프로필 및 좋아요 기능
 * @class UserController
 */
export class UserController {
  /**
   * 현재 로그인한 사용자 정보 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 사용자 프로필 업데이트
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: nickname, age, bio, profileImage, etc.)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updateProfile(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { 
        nickname, age, bio, profileImage,
        companyName, education, location, interests,
        height, mbti, drinking, smoking 
      } = req.body;

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
          ...(companyName && { companyName }),
          ...(education && { education }),
          ...(location && { location }),
          ...(interests && { interests }),
          ...(height && { height }),
          ...(mbti && { mbti }),
          ...(drinking && { drinking }),
          ...(smoking && { smoking }),
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

  /**
   * 사용자 추천 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: groupId, page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 특정 사용자 정보 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: userId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 좋아요 보내기
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: toUserId, groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 받은 좋아요 목록 조회 (프리미엄 전용)
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getReceivedLikes(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { page = 1, limit = 20 } = req.query;

      // Check if user is premium
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true }
      });

      if (!user?.isPremium) {
        throw createError(403, '프리미엄 사용자만 받은 좋아요를 볼 수 있습니다.');
      }

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
          fromUserId: like.fromUserId,
          fromUser: like.fromUser,
          groupId: like.groupId,
          group: like.group,
          isSuper: like.isSuper,
          isMatch: like.isMatch,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 보낸 좋아요 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 사용자 크레딧 정보 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 크레딧 구매
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: packageId, paymentMethodId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 계정 삭제 (소프트 삭제)
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: reason)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 좋아요 취소 (24시간 이내만 가능)
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: likeId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 좋아요 이력 삭제
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: likeIds)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 회사 인증 요청
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: companyId, method, data)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 프리미엄 구독
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: plan, paymentMethod)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * FCM 토큰 등록
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: token, deviceType)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * FCM 토큰 제거
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: token)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
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

  /**
   * 알림 설정 업데이트
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: notification settings)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updateNotificationSettings(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const settings = req.body;

      // Validate settings
      const allowedSettings = ['likes', 'matches', 'messages', 'friendRequests'];
      const filteredSettings: any = {};

      for (const key of allowedSettings) {
        if (key in settings && typeof settings[key] === 'boolean') {
          filteredSettings[key] = settings[key];
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationSettings: filteredSettings
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

  /**
   * 개인정보 설정 업데이트
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: privacy settings)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updatePrivacySettings(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const settings = req.body;

      // Validate settings
      const allowedSettings = ['showProfile', 'showOnlineStatus', 'showLastSeen', 'allowFriendRequests'];
      const filteredSettings: any = {};

      for (const key of allowedSettings) {
        if (key in settings && typeof settings[key] === 'boolean') {
          filteredSettings[key] = settings[key];
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          privacySettings: filteredSettings
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