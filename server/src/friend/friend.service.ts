import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * 친구 관리 서비스
 */
@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 친구 요청 목록 조회
   */
  async getFriendRequests(userId: string, status: string = 'PENDING') {
    return this.prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: status as any,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            age: true,
            gender: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 친구 요청 전송
   */
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    message?: string,
  ) {
    if (fromUserId === toUserId) {
      throw new Error('자신에게는 친구 요청을 보낼 수 없습니다.');
    }

    // Check if already friends
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: fromUserId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: fromUserId },
        ],
      },
    });

    if (existingFriendship) {
      throw new Error('이미 친구 관계입니다.');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        fromUserId,
        toUserId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new Error('이미 친구 요청을 보냈습니다.');
    }

    // Check if the other user has privacy settings that block friend requests
    const targetUser = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { privacySettings: true },
    });

    if (
      targetUser?.privacySettings &&
      !(targetUser.privacySettings as any).allowFriendRequests
    ) {
      throw new Error('해당 사용자는 친구 요청을 받지 않습니다.');
    }

    return this.prisma.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        message,
        status: 'PENDING',
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * 친구 요청 수락
   */
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        toUserId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new Error('친구 요청을 찾을 수 없습니다.');
    }

    // Update request status
    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    // Create friendship
    return this.prisma.friendship.create({
      data: {
        user1Id: request.fromUserId,
        user2Id: userId,
      },
    });
  }

  /**
   * 친구 요청 거절
   */
  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        toUserId: userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new Error('친구 요청을 찾을 수 없습니다.');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true, message: '친구 요청을 거절했습니다.' };
  }

  /**
   * 친구 목록 조회
   */
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            lastActive: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            lastActive: true,
          },
        },
      },
    });

    return friendships.map((friendship) => {
      return friendship.user1Id === userId
        ? friendship.user2
        : friendship.user1;
    });
  }

  /**
   * 친구 삭제
   */
  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (!friendship) {
      throw new Error('친구 관계를 찾을 수 없습니다.');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { success: true, message: '친구가 삭제되었습니다.' };
  }
}
