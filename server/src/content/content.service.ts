import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Content } from '../../shared/types';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 콘텐츠 목록 조회
   */
  async getContents(
    userId: string,
    groupId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Content[]> {
    const skip = (page - 1) * limit;

    // CommunityPost를 Content 형태로 변환하여 반환
    const posts = await this.prisma.communityPost.findMany({
      where: {
        isDeleted: false,
        ...(groupId && { groupId }),
      },
      include: {
        author: true,
        likes: {
          where: { userId },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // CommunityPost를 Content 형태로 변환
    return posts.map((post: any) => ({
      id: post.id,
      userId: post.authorId,
      authorId: post.authorId,
      authorNickname: post.author.nickname || '익명',
      type: post.imageUrls.length > 0 ? ('image' as const) : ('text' as const),
      text: post.content,
      imageUrls: post.imageUrls,
      likes: post._count.likes,
      likeCount: post._count.likes,
      views: post.viewCount,
      isPublic: true,
      isLikedByUser: post.likes.length > 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  }

  /**
   * 콘텐츠 생성
   */
  async createContent(userId: string, contentData: any): Promise<Content> {
    const post = await this.prisma.communityPost.create({
      data: {
        authorId: userId,
        groupId: contentData.groupId || 'group_1', // 기본 그룹
        title: contentData.title || '',
        content: contentData.text || contentData.content || '',
        imageUrls: contentData.imageUrls || [],
        tags: contentData.tags || [],
      },
      include: {
        author: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // CommunityPost를 Content 형태로 변환
    return {
      id: post.id,
      userId: post.authorId,
      authorId: post.authorId,
      authorNickname: post.author.nickname || '익명',
      type: post.imageUrls.length > 0 ? 'image' : 'text',
      text: post.content,
      imageUrls: post.imageUrls,
      likes: post._count.likes,
      likeCount: post._count.likes,
      views: post.viewCount,
      isPublic: true,
      isLikedByUser: false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  /**
   * 콘텐츠 좋아요
   */
  async likeContent(userId: string, contentId: string): Promise<void> {
    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: contentId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('이미 좋아요를 누른 콘텐츠입니다.');
    }

    // 좋아요 생성
    await this.prisma.postLike.create({
      data: {
        postId: contentId,
        userId,
      },
    });

    // 좋아요 수 증가
    await this.prisma.communityPost.update({
      where: { id: contentId },
      data: { likeCount: { increment: 1 } },
    });
  }

  /**
   * 콘텐츠 좋아요 취소
   */
  async unlikeContent(userId: string, contentId: string): Promise<void> {
    // 좋아요 삭제
    const deleted = await this.prisma.postLike.deleteMany({
      where: {
        postId: contentId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('좋아요를 누르지 않은 콘텐츠입니다.');
    }

    // 좋아요 수 감소
    await this.prisma.communityPost.update({
      where: { id: contentId },
      data: { likeCount: { decrement: 1 } },
    });
  }
}
