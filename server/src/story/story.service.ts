import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { FileService } from '../file/file.service';
import { ContentFilterService } from '../content-filter/content-filter.service';
import { StoryMediaType } from '@prisma/client';
import { Express } from 'express';

/**
 * 스토리 서비스 - 스토리(24시간 한시적 콘텐츠) 관리
 */
@Injectable()
export class StoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly contentFilterService: ContentFilterService,
  ) {}

  /**
   * 새 스토리 생성
   */
  async createStory(
    userId: string,
    mediaFile: Express.Multer.File,
    caption?: string,
  ) {
    // Check if user has reached story limit (e.g., 10 active stories)
    const activeStoriesCount = await this.prisma.story.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeStoriesCount >= 10) {
      throw new Error('최대 10개의 스토리만 올릴 수 있습니다.');
    }

    // Content filtering for caption
    if (caption) {
      const filterResult = await this.contentFilterService.filterText(caption);
      if (filterResult.severity === 'blocked') {
        throw new Error('부적절한 내용이 포함되어 있습니다.');
      }
      caption = filterResult.filteredText || caption;
    }

    // Determine media type
    const mediaType: StoryMediaType = mediaFile.mimetype.startsWith('video/')
      ? 'VIDEO'
      : 'IMAGE';

    // Upload media to S3
    const uploadResult = await this.fileService.uploadSingleFile(
      mediaFile,
      userId,
      'STORY',
    );

    // Create story with 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.prisma.story.create({
      data: {
        userId,
        mediaUrl: uploadResult.url,
        mediaType,
        caption,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return story;
  }

  /**
   * 사용자의 활성 스토리 조회
   */
  async getUserStories(userId: string) {
    const stories = await this.prisma.story.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map((story) => ({
      ...story,
      viewCount: story._count.views,
    }));
  }

  /**
   * 매칭된 사용자들의 스토리 조회
   */
  async getMatchedUsersStories(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // First, get all matched user IDs
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const matchedUserIds = matches.map((match) =>
      match.user1Id === userId ? match.user2Id : match.user1Id,
    );

    if (matchedUserIds.length === 0) {
      return [];
    }

    // Get active stories from matched users
    const stories = await this.prisma.story.findMany({
      where: {
        userId: { in: matchedUserIds },
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Group stories by user
    const storiesByUser = stories.reduce(
      (acc, story) => {
        const userId = story.userId;
        if (!acc[userId]) {
          acc[userId] = {
            user: story.user,
            stories: [],
            hasUnviewed: false,
          };
        }

        const isViewed = story.views.length > 0;
        if (!isViewed) {
          acc[userId].hasUnviewed = true;
        }

        acc[userId].stories.push({
          ...story,
          isViewed,
        });

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(storiesByUser);
  }

  /**
   * 스토리 조회
   */
  async viewStory(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: { user: true },
    });

    if (!story) {
      throw new Error('스토리를 찾을 수 없습니다.');
    }

    if (!story.isActive || story.expiresAt < new Date()) {
      throw new Error('만료된 스토리입니다.');
    }

    // Check if viewer is matched with story owner
    const isMatched = await this.checkIfMatched(story.userId, viewerId);
    if (!isMatched && story.userId !== viewerId) {
      throw new Error('매칭된 사용자의 스토리만 볼 수 있습니다.');
    }

    // Create or update view record
    const view = await this.prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        storyId,
        viewerId,
      },
    });

    return view;
  }

  /**
   * 스토리 조회자 목록 조회
   */
  async getStoryViewers(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('스토리를 찾을 수 없습니다.');
    }

    if (story.userId !== userId) {
      throw new Error('본인의 스토리만 조회수를 확인할 수 있습니다.');
    }

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
    });

    return views;
  }

  /**
   * 스토리 삭제
   */
  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('스토리를 찾을 수 없습니다.');
    }

    if (story.userId !== userId) {
      throw new Error('본인의 스토리만 삭제할 수 있습니다.');
    }

    // Soft delete by marking as inactive
    await this.prisma.story.update({
      where: { id: storyId },
      data: { isActive: false },
    });

    // Delete the media file from S3
    // Note: FileService expects fileId, not URL. Need to extract fileId or modify FileService
    // For now, we'll just return success
    // TODO: Implement proper file deletion

    return { success: true };
  }

  /**
   * 만료된 스토리 정리 (cron job에서 호출)
   */
  async cleanupExpiredStories() {
    const expiredStories = await this.prisma.story.findMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
      },
    });

    for (const story of expiredStories) {
      try {
        // Delete story and its views from database
        await this.prisma.story.delete({
          where: { id: story.id },
        });

        // TODO: Delete media from S3
        // await this.fileService.deleteFile(story.mediaUrl);
      } catch (error) {
        console.error(`Failed to cleanup story ${story.id}:`, error);
      }
    }

    return { deletedCount: expiredStories.length };
  }

  /**
   * 두 사용자의 매칭 여부 확인
   */
  private async checkIfMatched(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 },
        ],
        status: 'ACTIVE',
      },
    });

    return !!match;
  }

  /**
   * ID로 스토리 조회
   */
  async getStoryById(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        views: {
          where: { viewerId },
          select: { id: true },
        },
        _count: {
          select: { views: true },
        },
      },
    });

    if (!story) {
      throw new Error('스토리를 찾을 수 없습니다.');
    }

    if (!story.isActive || story.expiresAt < new Date()) {
      throw new Error('만료된 스토리입니다.');
    }

    // Check if viewer can see this story
    const isOwner = story.userId === viewerId;
    const isMatched = await this.checkIfMatched(story.userId, viewerId);

    if (!isOwner && !isMatched) {
      throw new Error('이 스토리를 볼 권한이 없습니다.');
    }

    return {
      ...story,
      isViewed: story.views.length > 0,
      isOwner,
      viewCount: story._count.views,
    };
  }
}
