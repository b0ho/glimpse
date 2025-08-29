import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { DeletionStatus, AccountDeletionInfo } from './dto/delete-account.dto';

/**
 * 사용자 계정 삭제 서비스
 * 
 * 7일 대기 시스템을 통한 안전한 계정 삭제 기능을 제공합니다.
 */
@Injectable()
export class UserDeletionService {
  private readonly DELETION_GRACE_PERIOD_DAYS = 7;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 계정 삭제 요청 (7일 대기 시스템)
   */
  async requestAccountDeletion(userId: string, reason?: string): Promise<{
    success: boolean;
    scheduledDeletionAt: Date;
    daysRemaining: number;
    message: string;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이미 삭제 요청된 계정인지 확인
    if (user.deletedAt) {
      throw new BadRequestException('이미 삭제 요청된 계정입니다.');
    }

    const now = new Date();
    const scheduledDeletionAt = new Date(now.getTime() + this.DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // 삭제 요청 상태로 업데이트
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        deletionReason: reason,
        deletedAt: now, // 임시로 deletedAt을 요청 시간으로 사용
      },
    });

    // 사용자 상호작용 비활성화
    await this.deactivateUserInteractions(userId);

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return {
      success: true,
      scheduledDeletionAt,
      daysRemaining: this.DELETION_GRACE_PERIOD_DAYS,
      message: `계정 삭제가 요청되었습니다. ${this.DELETION_GRACE_PERIOD_DAYS}일 후 완전히 삭제됩니다.`,
    };
  }

  /**
   * 계정 복구
   */
  async restoreAccount(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('삭제 요청되지 않은 계정입니다.');
    }

    // 삭제 요청 후 7일이 지났는지 확인
    const deletionRequestTime = user.deletedAt.getTime();
    const gracePeriodMs = this.DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - deletionRequestTime > gracePeriodMs) {
      throw new BadRequestException(`복구 기간이 만료되었습니다. (${this.DELETION_GRACE_PERIOD_DAYS}일 초과)`);
    }

    // 계정 복구
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        deletionReason: null,
      },
    });

    // 사용자 상호작용 재활성화
    await this.reactivateUserInteractions(userId);

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return {
      success: true,
      message: '계정이 성공적으로 복구되었습니다.',
    };
  }

  /**
   * 영구 삭제 (7일 후 또는 관리자에 의한)
   */
  async permanentlyDeleteAccount(userId: string, force: boolean = false): Promise<{
    success: boolean;
    message: string;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: true,
        sentLikes: true,
        receivedLikes: true,
        matches1: true,
        matches2: true,
        sentMessages: true,
        stories: true,
        payments: true,
        subscriptions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!force && user.deletedAt) {
      // 7일 대기 기간 확인
      const deletionRequestTime = user.deletedAt.getTime();
      const gracePeriodMs = this.DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (now - deletionRequestTime < gracePeriodMs) {
        throw new BadRequestException('아직 삭제 대기 기간입니다.');
      }
    }

    // GDPR 준수: 개인정보 완전 삭제
    await this.prismaService.$transaction(async (tx) => {
      // 1. FCM 토큰 삭제
      await tx.fcmToken.deleteMany({ where: { userId } });
      
      // 2. 디바이스 토큰 삭제
      await tx.userDeviceToken.deleteMany({ where: { userId } });
      
      // 3. 채팅 메시지 내용 익명화 (완전 삭제 대신)
      await tx.chatMessage.updateMany({
        where: { senderId: userId },
        data: { 
          content: '[삭제된 메시지]',
          senderId: 'DELETED_USER' 
        }
      });
      
      // 4. 스토리 삭제
      await tx.story.deleteMany({ where: { userId } });
      
      // 5. 좋아요 기록 삭제
      await tx.userLike.deleteMany({ 
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } 
      });
      
      // 6. 매치 상태 업데이트 (완전 삭제 대신 비활성화)
      await tx.match.updateMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        data: { status: 'DELETED' }
      });
      
      // 7. 그룹 멤버십 삭제
      await tx.groupMember.deleteMany({ where: { userId } });
      
      // 8. 결제 기록은 법적 의무로 유지하되 개인정보 익명화
      await tx.payment.updateMany({
        where: { userId },
        data: { 
          userId: 'DELETED_USER',
          metadata: {}
        }
      });
      
      // 9. 구독 정보 익명화
      await tx.subscription.updateMany({
        where: { userId },
        data: { userId: 'DELETED_USER' }
      });
      
      // 10. 최종적으로 사용자 계정 삭제
      await tx.user.delete({ where: { id: userId } });
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return {
      success: true,
      message: '계정이 영구적으로 삭제되었습니다.',
    };
  }

  /**
   * 계정 삭제 상태 조회
   */
  async getAccountDeletionStatus(userId: string): Promise<AccountDeletionInfo> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        deletedAt: true,
        deletionReason: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.deletedAt) {
      return { 
        status: DeletionStatus.ACTIVE
      };
    }

    const deletionRequestTime = user.deletedAt.getTime();
    const gracePeriodMs = this.DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const scheduledDeletionAt = new Date(deletionRequestTime + gracePeriodMs);
    const now = Date.now();
    const timeRemaining = scheduledDeletionAt.getTime() - now;
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)));

    return {
      status: DeletionStatus.DELETION_REQUESTED,
      requestedAt: user.deletedAt,
      scheduledDeletionAt,
      daysRemaining,
      reason: user.deletionReason || undefined,
    };
  }

  /**
   * 삭제 예정 계정 목록 조회 (스케줄러용)
   */
  async getAccountsScheduledForDeletion(): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.DELETION_GRACE_PERIOD_DAYS);

    const users = await this.prismaService.user.findMany({
      where: {
        deletedAt: {
          lt: cutoffDate, // 7일 전보다 이른 시간에 삭제 요청된 계정들
        },
      },
      select: { id: true },
    });

    return users.map(user => user.id);
  }

  /**
   * 계정이 삭제 대기 상태인지 확인
   */
  async isAccountPendingDeletion(userId: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });

    return !!(user && user.deletedAt);
  }

  /**
   * 사용자 상호작용 비활성화 (삭제 요청 시)
   */
  private async deactivateUserInteractions(userId: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      // 모든 매치를 비활성화 (다른 사용자의 채팅 히스토리 보존을 위해 DELETED 상태로)
      await tx.match.updateMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
        data: { status: 'DELETED' },
      });

      // 모든 스토리를 비활성화
      await tx.story.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // 그룹 멤버십을 BANNED 상태로 변경 (완전 삭제는 영구 삭제 시에)
      await tx.groupMember.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'BANNED' },
      });
    });
  }

  /**
   * 사용자 상호작용 재활성화 (복구 시)
   */
  private async reactivateUserInteractions(userId: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      // 삭제로 인해 비활성화된 매치들을 재활성화
      await tx.match.updateMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'DELETED',
        },
        data: { status: 'ACTIVE' },
      });

      // 만료되지 않은 스토리들을 재활성화
      await tx.story.updateMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() },
          isActive: false,
        },
        data: { isActive: true },
      });

      // 그룹 멤버십 복구
      await tx.groupMember.updateMany({
        where: { userId, status: 'BANNED' },
        data: { status: 'ACTIVE' },
      });
    });
  }
}