/**
 * @module StoryController
 * @description 스토리 관리 컨트롤러 - 24시간 임시 콘텐츠 업로드, 조회, 관리
 */
import { Response, NextFunction } from 'express';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { storyService } from '../services/StoryService';
import { upload } from '../config/multer';
import { prisma } from '../config/database';

/**
 * 스토리 관리 컨트롤러
 * 24시간 임시 콘텐츠(이미지/동영상) 업로드, 조회, 열람 기록 및 삭제 기능을 제공
 * @class StoryController
 */
export class StoryController {
  /**
   * 새 스토리 생성
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (body: caption, file: multipart/form-data)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async createStory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { caption } = req.body;
      const file = req.file;

      if (!file) {
        throw createError(400, '이미지 또는 동영상 파일이 필요합니다.');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw createError(400, '지원하지 않는 파일 형식입니다.');
      }

      // Max file size: 100MB for videos, 10MB for images
      const maxSize = file.mimetype.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw createError(400, '파일 크기가 너무 큽니다.');
      }

      const story = await storyService.createStory(userId, file, caption);

      res.status(201).json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 내 스토리 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMyStories(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const stories = await storyService.getUserStories(userId);

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 매칭된 사용자들의 스토리 조회
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getMatchedUsersStories(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { page = 1, limit = 20 } = req.query;

      const stories = await storyService.getMatchedUsersStories(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 특정 스토리 조회
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (params: storyId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getStoryById(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { storyId } = req.params;
      const viewerId = req.auth.userId;

      const story = await storyService.getStoryById(storyId!, viewerId!);

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 스토리 열람 업데이트
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (params: storyId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async viewStory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { storyId } = req.params;
      const viewerId = req.auth.userId;

      const view = await storyService.viewStory(storyId!, viewerId!);

      res.json({
        success: true,
        data: view
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 스토리 열람자 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (params: storyId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getStoryViewers(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { storyId } = req.params;
      const userId = req.auth.userId;

      const viewers = await storyService.getStoryViewers(storyId!, userId!);

      res.json({
        success: true,
        data: viewers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 스토리 삭제
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (params: storyId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async deleteStory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { storyId } = req.params;
      const userId = req.auth.userId;

      const result = await storyService.deleteStory(storyId!, userId!);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 특정 사용자의 스토리 조회 (매칭된 사용자만 가능)
   * @param {ClerkAuthRequest} req - Clerk 인증 request 객체 (params: userId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getUserStories(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { userId } = req.params;
      const viewerId = req.auth.userId;

      // Check if viewer is matched with the user
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: viewerId, user2Id: userId },
            { user1Id: userId, user2Id: viewerId }
          ],
          status: 'ACTIVE'
        }
      });

      if (!match && userId !== viewerId) {
        throw createError(403, '매칭된 사용자의 스토리만 볼 수 있습니다.');
      }

      const stories = await storyService.getUserStories(userId!);

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storyController = new StoryController();