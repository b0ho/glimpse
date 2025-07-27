import { Response, NextFunction } from 'express';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { storyService } from '../services/StoryService';
import { upload } from '../config/multer';
import { prisma } from '../config/database';

export class StoryController {
  // Create a new story
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

  // Get user's own stories
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

  // Get stories from matched users
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

  // Get a specific story
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

  // View a story
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

  // Get story viewers
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

  // Delete a story
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

  // Get stories from a specific user
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