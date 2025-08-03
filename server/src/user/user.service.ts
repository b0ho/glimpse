import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { User } from '@prisma/client';
// TODO: Import from shared when available
const PRICING = {
  LIKE_PACKAGES: [
    { credits: 5, price: 2500 },
    { credits: 10, price: 4900 },
    { credits: 20, price: 9000 },
    { credits: 50, price: 19000 },
  ],
};

const APP_CONFIG = {
  MAX_DAILY_LIKES: 1,
};

const getMatchCompatibilityScore = (age1: number, age2: number): number => {
  const ageDiff = Math.abs(age1 - age2);
  if (ageDiff <= 2) return 100;
  if (ageDiff <= 5) return 80;
  if (ageDiff <= 10) return 60;
  return 40;
};

/**
 * 사용자 서비스
 * 
 * 사용자 프로필, 추천, 크레딧 관리 등을 처리합니다.
 */
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자 ID로 사용자 조회
   * 
   * @param userId 사용자 ID
   * @returns 사용자 정보
   */
  async findById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 사용자 프로필 업데이트
   * 
   * @param userId 사용자 ID
   * @param updateData 업데이트할 데이터
   * @returns 업데이트된 사용자 정보
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    // 변경 불가 필드 제거
    const { id, clerkId, createdAt, updatedAt, ...safeUpdateData } = updateData as any;

    return await this.prisma.user.update({
      where: { id: userId },
      data: safeUpdateData,
    });
  }

  /**
   * 사용자 추천 목록 조회
   * 
   * @param userId 사용자 ID
   * @param groupId 그룹 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 추천 사용자 목록
   */
  async getRecommendations(
    userId: string,
    groupId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // 현재 사용자 정보 조회
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { age: true, gender: true },
    });

    if (!currentUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이미 좋아요한 사용자 ID 목록
    const alreadyLiked = await this.prisma.userLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    const excludeUserIds = [userId, ...alreadyLiked.map(like => like.toUserId)];

    // 같은 그룹의 사용자 조회
    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        groupMemberships: {
          some: {
            groupId: groupId,
            status: 'ACTIVE',
          },
        },
        nickname: { not: 'deleted_user' },
        age: { not: null },
        gender: { not: null },
      },
      select: {
        id: true,
        nickname: true,
        age: true,
        gender: true,
        profileImage: true,
        bio: true,
        lastActive: true,
        height: true,
        mbti: true,
        companyName: true,
        education: true,
        location: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 호환성 점수 계산 및 정렬
    const recommendations = users
      .map(user => ({
        ...user,
        compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
        // 매칭 전까지 닉네임 일부 숨김
        nickname: user.nickname
          ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1)
          : '',
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return recommendations;
  }

  /**
   * 사용자 상세 정보 열람 가능 여부 확인
   * 
   * @param requesterId 요청자 ID
   * @param targetUserId 대상 사용자 ID
   * @returns 열람 가능 여부
   */
  async canViewUserDetails(requesterId: string, targetUserId: string): Promise<boolean> {
    // 매칭 여부 확인
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: requesterId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: requesterId },
        ],
        status: 'ACTIVE',
      },
    });

    return !!match;
  }

  /**
   * 일일 남은 좋아요 수 조회
   * 
   * @param userId 사용자 ID
   * @returns 남은 좋아요 수
   */
  async getDailyLikesRemaining(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const likesToday = await this.prisma.userLike.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: today },
      },
    });

    return Math.max(0, APP_CONFIG.MAX_DAILY_LIKES - likesToday);
  }

  /**
   * 크레딧 구매
   * 
   * @param userId 사용자 ID
   * @param packageId 패키지 ID
   * @param paymentMethodId 결제 수단 ID
   * @returns 구매 결과
   */
  async purchaseCredits(userId: string, packageId: string, paymentMethodId: string) {
    const creditPackage = PRICING.LIKE_PACKAGES.find(
      (pkg: any) => pkg.credits.toString() === packageId,
    );

    if (!creditPackage) {
      throw new BadRequestException('유효하지 않은 패키지입니다.');
    }

    // 결제 기록 생성
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: creditPackage.price,
        currency: 'KRW',
        type: 'LIKE_CREDITS',
        status: 'PENDING',
        method: 'CARD',
        metadata: {
          credits: creditPackage.credits,
          packageId,
          paymentMethodId,
        },
      },
    });

    // TODO: 실제 결제 처리 (Stripe/한국 결제 서비스)
    // 현재는 성공적인 결제를 시뮬레이션
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    // 사용자에게 크레딧 추가
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditPackage.credits,
        },
      },
    });

    return {
      paymentId: payment.id,
      creditsAdded: creditPackage.credits,
      totalPaid: creditPackage.price,
    };
  }

  /**
   * 사용자 통계 조회
   * 
   * @param userId 사용자 ID
   * @returns 사용자 통계
   */
  async getUserStats(userId: string) {
    const user = await this.findById(userId);

    const [totalLikes, totalMatches, activeGroups] = await Promise.all([
      this.prisma.userLike.count({
        where: { toUserId: userId },
      }),
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
      }),
      this.prisma.groupMember.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      totalLikes,
      totalMatches,
      activeGroups,
      memberSince: user.createdAt,
      isPremium: user.isPremium,
      credits: user.credits,
    };
  }

  /**
   * 호환성 점수 계산
   * 
   * @param currentUser 현재 사용자
   * @param targetUser 대상 사용자
   * @returns 호환성 점수 (0-100)
   */
  private calculateCompatibilityScore(currentUser: any, targetUser: any): number {
    let score = 50; // 기본 점수

    // 나이 호환성 (0-30점)
    if (currentUser.age && targetUser.age) {
      const ageScore = getMatchCompatibilityScore(currentUser.age, targetUser.age);
      score += (ageScore / 100) * 30;
    }

    // 성별 호환성 (0-20점)
    if (currentUser.gender !== targetUser.gender) {
      score += 20;
    }

    // 최근 활동 (0-10점)
    if (targetUser.lastActive) {
      const daysSinceActive = Math.floor(
        (new Date().getTime() - new Date(targetUser.lastActive).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceActive < 7) score += 10;
      else if (daysSinceActive < 30) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }
}
