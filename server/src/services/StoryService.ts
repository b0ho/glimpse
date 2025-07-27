import { StoryMediaType } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { fileUploadService } from './FileUploadService';
import { contentFilterService } from './ContentFilterService';

export class StoryService {
  // Create a new story
  async createStory(
    userId: string,
    mediaFile: Express.Multer.File,
    caption?: string
  ) {
    try {
      // Check if user has reached story limit (e.g., 10 active stories)
      const activeStoriesCount = await prisma.story.count({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (activeStoriesCount >= 10) {
        throw createError(400, '최대 10개의 스토리만 올릴 수 있습니다.');
      }

      // Content filtering for caption
      if (caption) {
        const filterResult = await contentFilterService.filterText(caption);
        if (filterResult.severity === 'blocked') {
          throw createError(400, '부적절한 내용이 포함되어 있습니다.');
        }
        caption = filterResult.filteredText || caption;
      }

      // Determine media type
      const mediaType: StoryMediaType = mediaFile.mimetype.startsWith('video/') 
        ? 'VIDEO' 
        : 'IMAGE';

      // Upload media to S3
      const uploadResult = await fileUploadService.uploadFile(
        mediaFile,
        userId,
        'STORY'
      );

      // Create story with 24-hour expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.story.create({
        data: {
          userId,
          mediaUrl: uploadResult.url,
          mediaType,
          caption,
          expiresAt
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true
            }
          }
        }
      });

      return story;
    } catch (error) {
      console.error('Failed to create story:', error);
      throw error;
    }
  }

  // Get user's active stories
  async getUserStories(userId: string) {
    const stories = await prisma.story.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        },
        _count: {
          select: { views: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return stories.map(story => ({
      ...story,
      viewCount: story._count.views
    }));
  }

  // Get stories from matched users
  async getMatchedUsersStories(userId: string, page: number = 1, limit: number = 20) {
    // First, get all matched user IDs
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACTIVE'
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });

    const matchedUserIds = matches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    if (matchedUserIds.length === 0) {
      return [];
    }

    // Get active stories from matched users
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: matchedUserIds },
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        },
        views: {
          where: { viewerId: userId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userId = story.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      
      const isViewed = story.views.length > 0;
      if (!isViewed) {
        acc[userId].hasUnviewed = true;
      }

      acc[userId].stories.push({
        ...story,
        isViewed
      });

      return acc;
    }, {} as Record<string, any>);

    return Object.values(storiesByUser);
  }

  // View a story
  async viewStory(storyId: string, viewerId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { user: true }
    });

    if (!story) {
      throw createError(404, '스토리를 찾을 수 없습니다.');
    }

    if (!story.isActive || story.expiresAt < new Date()) {
      throw createError(400, '만료된 스토리입니다.');
    }

    // Check if viewer is matched with story owner
    const isMatched = await this.checkIfMatched(story.userId, viewerId);
    if (!isMatched && story.userId !== viewerId) {
      throw createError(403, '매칭된 사용자의 스토리만 볼 수 있습니다.');
    }

    // Create or update view record
    const view = await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        storyId,
        viewerId
      }
    });

    return view;
  }

  // Get story viewers
  async getStoryViewers(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!story) {
      throw createError(404, '스토리를 찾을 수 없습니다.');
    }

    if (story.userId !== userId) {
      throw createError(403, '본인의 스토리만 조회수를 확인할 수 있습니다.');
    }

    const views = await prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    });

    return views;
  }

  // Delete a story
  async deleteStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!story) {
      throw createError(404, '스토리를 찾을 수 없습니다.');
    }

    if (story.userId !== userId) {
      throw createError(403, '본인의 스토리만 삭제할 수 있습니다.');
    }

    // Soft delete by marking as inactive
    await prisma.story.update({
      where: { id: storyId },
      data: { isActive: false }
    });

    // Delete the media file from S3
    await fileUploadService.deleteFile(story.mediaUrl);

    return { success: true };
  }

  // Clean up expired stories (called by cron job)
  async cleanupExpiredStories() {
    const expiredStories = await prisma.story.findMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    });

    for (const story of expiredStories) {
      try {
        // Delete media from S3
        await fileUploadService.deleteFile(story.mediaUrl);
        
        // Delete story and its views from database
        await prisma.story.delete({
          where: { id: story.id }
        });
      } catch (error) {
        console.error(`Failed to cleanup story ${story.id}:`, error);
      }
    }

    return { deletedCount: expiredStories.length };
  }

  // Helper: Check if two users are matched
  private async checkIfMatched(userId1: string, userId2: string): Promise<boolean> {
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 }
        ],
        status: 'ACTIVE'
      }
    });

    return !!match;
  }

  // Get story by ID
  async getStoryById(storyId: string, viewerId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true
          }
        },
        views: {
          where: { viewerId },
          select: { id: true }
        },
        _count: {
          select: { views: true }
        }
      }
    });

    if (!story) {
      throw createError(404, '스토리를 찾을 수 없습니다.');
    }

    if (!story.isActive || story.expiresAt < new Date()) {
      throw createError(400, '만료된 스토리입니다.');
    }

    // Check if viewer can see this story
    const isOwner = story.userId === viewerId;
    const isMatched = await this.checkIfMatched(story.userId, viewerId);
    
    if (!isOwner && !isMatched) {
      throw createError(403, '이 스토리를 볼 권한이 없습니다.');
    }

    return {
      ...story,
      isViewed: story.views.length > 0,
      isOwner,
      viewCount: story._count.views
    };
  }
}

export const storyService = new StoryService();