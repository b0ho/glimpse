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
    console.log('[ContentService] Creating content with userId:', userId);
    console.log('[ContentService] Content data:', JSON.stringify(contentData, null, 2));
    console.log('[ContentService] Received groupId:', contentData.groupId);
    
    // Generate unique ID for the post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // First, check if groupId exists in database or use default
    let groupId = contentData.groupId;
    
    // Check if group exists
    if (groupId && groupId !== 'cmeh8afz4004o1mb7s8w8kch7') {
      const groupExists = await this.prisma.group.findUnique({
        where: { id: groupId }
      });
      
      if (!groupExists) {
        console.log('[ContentService] Group not found, using default group');
        groupId = 'cmeh8afz4004o1mb7s8w8kch7';
      }
    } else {
      groupId = 'cmeh8afz4004o1mb7s8w8kch7';
    }
    
    console.log('[ContentService] Using groupId:', groupId);
    
    try {
      // Use raw SQL to insert the post directly
      await this.prisma.$executeRaw`
        INSERT INTO community_posts (id, "authorId", "groupId", title, content, "imageUrls", tags, "createdAt", "updatedAt")
        VALUES (
          ${postId},
          ${userId},
          ${groupId},
          ${contentData.title || ''},
          ${contentData.text || contentData.content || ''},
          ARRAY[]::text[],
          ARRAY[]::text[],
          NOW(),
          NOW()
        )
      `;
      
      console.log('[ContentService] Post created successfully with ID:', postId);
      
      // Fetch the created post with relations using raw SQL
      const [post] = await this.prisma.$queryRaw<any[]>`
        SELECT 
          p.*,
          u.nickname as author_nickname,
          u.id as author_id
        FROM community_posts p
        JOIN users u ON p."authorId" = u.id
        WHERE p.id = ${postId}
      `;
      
      if (!post) {
        throw new Error('Failed to fetch created post');
      }
      
      // Return in the expected format
      return {
        id: post.id,
        userId: post.authorId,
        authorId: post.authorId,
        authorNickname: post.author_nickname || '익명',
        type: 'text',
        text: post.content,
        imageUrls: post.imageUrls || [],
        likes: 0,
        likeCount: 0,
        views: post.viewCount || 0,
        isPublic: true,
        isLikedByUser: false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    } catch (error) {
      console.error('[ContentService] Error creating post:', error);
      throw error;
    }
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
