import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
// TODO: Import from shared when available
const APP_CONFIG = {
  MAX_DAILY_LIKES: 1,
};

const canUserLike = (credits: number, isPremium: boolean): boolean => {
  return isPremium || credits > 0;
};

const calculateLikeCost = (isPremium: boolean): number => {
  return isPremium ? 0 : 1;
};

/**
 * 좋아요 서비스
 * 
 * 좋아요 전송, 매칭 처리, 좋아요 목록 관리를 담당합니다.
 */
@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 좋아요 전송
   * 
   * @param fromUserId 좋아요 보내는 사용자 ID
   * @param toUserId 좋아요 받는 사용자 ID
   * @param groupId 그룹 ID
   * @returns 좋아요 결과 (매칭 여부 포함)
   */
  async sendLike(fromUserId: string, toUserId: string, groupId: string) {
    // 같은 그룹 소속 확인
    const [fromUserInGroup, toUserInGroup] = await Promise.all([
      this.prisma.groupMember.findFirst({
        where: { userId: fromUserId, groupId, status: 'ACTIVE' },
      }),
      this.prisma.groupMember.findFirst({
        where: { userId: toUserId, groupId, status: 'ACTIVE' },
      }),
    ]);

    if (!fromUserInGroup || !toUserInGroup) {
      throw new BadRequestException('같은 그룹에 속한 사용자에게만 좋아요할 수 있습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await this.prisma.userLike.findFirst({
      where: { fromUserId, toUserId, groupId },
    });

    if (existingLike) {
      throw new BadRequestException('이미 좋아요를 누른 사용자입니다.');
    }

    // 쿨다운 확인 (2주)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentLike = await this.prisma.userLike.findFirst({
      where: {
        fromUserId,
        toUserId,
        createdAt: { gte: twoWeeksAgo },
      },
    });

    if (recentLike) {
      throw new BadRequestException('같은 사용자에게는 2주 후에 다시 좋아요할 수 있습니다.');
    }

    // 사용자 정보 조회
    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { credits: true, isPremium: true },
    });

    if (!fromUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 크레딧 확인
    if (!canUserLike(fromUser.credits, fromUser.isPremium)) {
      throw new BadRequestException('좋아요 크레딧이 부족합니다.');
    }

    // 비프리미엄 사용자 일일 한도 확인
    if (!fromUser.isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const likesToday = await this.prisma.userLike.count({
        where: {
          fromUserId,
          createdAt: { gte: today },
        },
      });

      if (likesToday >= APP_CONFIG.MAX_DAILY_LIKES) {
        throw new BadRequestException('일일 좋아요 한도에 도달했습니다.');
      }
    }

    // 상호 좋아요 확인
    const mutualLike = await this.prisma.userLike.findFirst({
      where: { fromUserId: toUserId, toUserId: fromUserId, groupId },
    });

    const isMatch = !!mutualLike;

    // 트랜잭션으로 원자적 처리
    const result = await this.prisma.$transaction(async tx => {
      // 좋아요 생성
      const like = await tx.userLike.create({
        data: {
          fromUserId,
          toUserId,
          groupId,
          isMatch,
        },
      });

      // 크레딧 차감
      const creditCost = calculateLikeCost(fromUser.isPremium);
      if (creditCost > 0) {
        await tx.user.update({
          where: { id: fromUserId },
          data: {
            credits: { decrement: creditCost },
          },
        });
      }

      // 매칭 처리
      let match = null;
      if (isMatch && mutualLike) {
        // 기존 좋아요 업데이트
        await tx.userLike.update({
          where: { id: mutualLike.id },
          data: { isMatch: true },
        });

        // 매칭 레코드 생성
        match = await tx.match.create({
          data: {
            user1Id: fromUserId < toUserId ? fromUserId : toUserId,
            user2Id: fromUserId < toUserId ? toUserId : fromUserId,
            groupId,
            status: 'ACTIVE',
          },
        });
      }

      return { like, match };
    });

    // TODO: 매칭 시 알림 전송

    return {
      likeId: result.like.id,
      isMatch: isMatch,
      matchId: result.match?.id,
    };
  }

  /**
   * 받은 좋아요 목록 조회
   * 
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 받은 좋아요 목록
   */
  async getReceivedLikes(userId: string, page: number = 1, limit: number = 10) {
    const likes = await this.prisma.userLike.findMany({
      where: {
        toUserId: userId,
        isMatch: false, // 매칭되지 않은 좋아요만
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
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 프리미엄 사용자가 아니면 정보 일부 숨김
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    return likes.map(like => ({
      id: like.id,
      fromUser: user?.isPremium
        ? (like as any).fromUser
        : {
            ...(like as any).fromUser,
            nickname: (like as any).fromUser?.nickname ? (like as any).fromUser.nickname.charAt(0) + '*'.repeat((like as any).fromUser.nickname.length - 1) : 'Anonymous',
          },
      group: (like as any).group,
      createdAt: like.createdAt,
    }));
  }

  /**
   * 보낸 좋아요 목록 조회
   * 
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 보낸 좋아요 목록
   */
  async getSentLikes(userId: string, page: number = 1, limit: number = 10) {
    const likes = await this.prisma.userLike.findMany({
      where: {
        fromUserId: userId,
      },
      include: {
        toUser: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
            gender: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return likes.map(like => ({
      id: like.id,
      toUser: (like as any).toUser,
      group: (like as any).group,
      isMatch: like.isMatch,
      createdAt: like.createdAt,
    }));
  }

  /**
   * 좋아요 취소 (프리미엄 기능)
   * 
   * @param userId 사용자 ID
   * @param likeId 좋아요 ID
   */
  async cancelLike(userId: string, likeId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      throw new BadRequestException('좋아요 취소는 프리미엄 회원만 가능합니다.');
    }

    const like = await this.prisma.userLike.findFirst({
      where: {
        id: likeId,
        fromUserId: userId,
      },
    });

    if (!like) {
      throw new NotFoundException('좋아요를 찾을 수 없습니다.');
    }

    if (like.isMatch) {
      throw new BadRequestException('매칭된 좋아요는 취소할 수 없습니다.');
    }

    // 24시간 이내만 취소 가능
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (like.createdAt < oneDayAgo) {
      throw new BadRequestException('24시간이 지난 좋아요는 취소할 수 없습니다.');
    }

    await this.prisma.$transaction(async tx => {
      // 좋아요 삭제
      await tx.userLike.delete({
        where: { id: likeId },
      });

      // 크레딧 반환
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: 1 },
        },
      });
    });
  }
}
