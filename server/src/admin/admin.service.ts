import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { NotificationService } from '../notification/notification.service';
import {
  BanUserDto,
  ManageGroupDto,
  BroadcastNotificationDto,
  UserListQueryDto,
} from './dto/admin.dto';

/**
 * 관리자 서비스
 *
 * 관리자 기능을 제공합니다.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 대시보드 통계 조회
   *
   * @returns 대시보드 통계
   */
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalGroups,
      totalMatches,
      totalReports,
      pendingReports,
      revenue,
    ] = await Promise.all([
      // 전체 사용자
      this.prisma.user.count(),
      // 활성 사용자 (30일 이내 활동)
      this.prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 프리미엄 사용자
      this.prisma.user.count({
        where: { isPremium: true },
      }),
      // 전체 그룹
      this.prisma.group.count({
        where: { isActive: true },
      }),
      // 전체 매치
      this.prisma.match.count({
        where: { status: 'ACTIVE' },
      }),
      // 전체 신고 (알림으로 대체)
      this.prisma.notification.count({
        where: { title: { contains: 'Report' } },
      }),
      // 처리 대기 신고
      this.prisma.notification.count({
        where: { title: { contains: 'Report' }, isRead: false },
      }),
      // 이번 달 수익
      this.getMonthlyRevenue(),
    ]);

    // 온라인 사용자 수 (실제 구현 필요)
    const onlineUsers = await this.getOnlineUsersCount();

    // 쳑 메시지 수 (chat 모듈에서 가져와야 함)
    const totalMessages = 0; // TODO: ChatService에서 메시지 수 가져오기

    return {
      totalUsers,
      activeUsers,
      totalMatches,
      totalMessages,
      revenue,
      premiumUsers,
      reportedUsers: pendingReports,
      onlineUsers,
      // 추가 데이터
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
      },
      groups: {
        total: totalGroups,
      },
      matches: {
        total: totalMatches,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
    };
  }

  /**
   * 온라인 사용자 수 조회
   */
  private async getOnlineUsersCount(): Promise<number> {
    // 실제 구현에서는 Redis나 WebSocket 연결 수 확인
    // 현재는 최근 5분 이내 활동한 사용자로 대체
    return this.prisma.user.count({
      where: {
        lastActive: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5분
        },
      },
    });
  }

  /**
   * 사용자 목록 조회
   *
   * @param query 검색 조건
   * @returns 사용자 목록
   */
  async getUsers(query: UserListQueryDto) {
    const { page = 1, limit = 20, search, filter } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { anonymousId: { contains: search } },
      ];
    }

    if (filter === 'premium') {
      where.isPremium = true;
    } else if (filter === 'banned') {
      where.deletedAt = { not: null };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          anonymousId: true,
          phoneNumber: true,
          nickname: true,
          profileImage: true,
          isPremium: true,
          premiumUntil: true,
          createdAt: true,
          lastActive: true,
          deletedAt: true,
          _count: {
            select: {
              matches1: true,
              matches2: true,
              notifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => ({
        ...user,
        matchCount: user._count.matches1 + user._count.matches2,
        reportCount: user._count.notifications,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 사용자 상세 정보 조회
   *
   * @param userId 사용자 ID
   * @returns 사용자 상세 정보
   */
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        sentLikes: {
          include: {
            toUser: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        receivedLikes: {
          include: {
            fromUser: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        matches1: {
          include: {
            user2: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        matches2: {
          include: {
            user1: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      ...user,
      matches: [
        ...user.matches1.map((m) => ({ ...m, partner: m.user2 })),
        ...user.matches2.map((m) => ({ ...m, partner: m.user1 })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  /**
   * 사용자 차단
   *
   * @param userId 사용자 ID
   * @param adminId 관리자 ID
   * @param data 차단 데이터
   */
  async banUser(userId: string, adminId: string, data: BanUserDto) {
    const { reason, durationDays } = data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 관리자 권한 확인 (별도 관리자 시스템이 필요)
    // 임시로 특정 ID를 관리자로 가정
    const ADMIN_IDS = ['admin-user-id'];
    if (ADMIN_IDS.includes(userId)) {
      throw new HttpException(
        '관리자는 차단할 수 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 영구 차단인 경우 삭제 처리
    if (!durationDays) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          deletionReason: reason,
        },
      });
    } else {
      // 임시 차단은 별도 테이블이나 알림으로 관리
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'MESSAGE_RECEIVED',
          title: '계정 제한 안내',
          message: `계정이 ${durationDays}일간 제한되었습니다. 사유: ${reason}`,
          data: {
            bannedUntil: new Date(
              Date.now() + durationDays * 24 * 60 * 60 * 1000,
            ),
            reason,
            adminId,
          },
        },
      });
    }

    // 활성 세션 종료
    await this.cacheService.del(`user:${userId}`);

    // 차단 알림 전송
    await this.notificationService.sendNotification({
      userId,
      type: 'MESSAGE_RECEIVED',
      content: `계정이 제한되었습니다. 사유: ${reason}`,
    });

    // 관리자 로그 기록
    await this.logAdminAction(adminId, 'BAN_USER', {
      targetUserId: userId,
      reason,
      durationDays,
    });
  }

  /**
   * 사용자 차단 해제
   *
   * @param userId 사용자 ID
   * @param adminId 관리자 ID
   */
  async unbanUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!user.deletedAt) {
      throw new HttpException(
        '차단된 사용자가 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        deletionReason: null,
      },
    });

    // 차단 해제 알림
    await this.notificationService.sendNotification({
      userId,
      type: 'MESSAGE_RECEIVED',
      content: '계정 제한이 해제되었습니다.',
    });

    // 관리자 로그 기록
    await this.logAdminAction(adminId, 'UNBAN_USER', {
      targetUserId: userId,
    });
  }

  /**
   * 신고 처리
   *
   * @param reportId 신고 ID
   * @param adminId 관리자 ID
   * @param action 처리 액션
   */
  async handleReport(
    reportId: string,
    adminId: string,
    action: 'approve' | 'reject',
  ) {
    const report = await this.prisma.notification.findUnique({
      where: { id: reportId },
    });

    if (!report || !report.title?.includes('Report')) {
      throw new HttpException('신고를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 신고 읽음 처리
    await this.prisma.notification.update({
      where: { id: reportId },
      data: { isRead: true },
    });

    const reportData = report.data as any;

    if (action === 'approve' && reportData?.targetUserId) {
      // 신고 승인 시 해당 사용자 제재
      await this.banUser(reportData.targetUserId, adminId, {
        reason: `신고 처리: ${reportData.reason}`,
        action: 'ban',
      });
    }

    // 신고자에게 처리 결과 알림
    if (reportData?.reporterId) {
      await this.notificationService.sendNotification({
        userId: reportData.reporterId,
        type: 'MESSAGE_RECEIVED',
        content:
          action === 'approve'
            ? '신고가 접수되어 처리되었습니다.'
            : '신고 내용을 검토한 결과 추가 조치가 필요하지 않습니다.',
      });
    }

    // 관리자 로그 기록
    await this.logAdminAction(adminId, 'HANDLE_REPORT', {
      reportId,
      action,
    });
  }

  /**
   * 그룹 관리
   *
   * @param groupId 그룹 ID
   * @param adminId 관리자 ID
   * @param data 관리 데이터
   */
  async manageGroup(groupId: string, adminId: string, data: ManageGroupDto) {
    const { action, reason } = data;

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: true,
      },
    });

    if (!group) {
      throw new HttpException('그룹을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    switch (action) {
      case 'approve':
        await this.prisma.group.update({
          where: { id: groupId },
          data: { isActive: true },
        });

        if (group.creatorId) {
          await this.notificationService.sendNotification({
            userId: group.creatorId,
            type: 'GROUP_INVITATION',
            content: `'${group.name}' 그룹이 승인되었습니다.`,
          });
        }
        break;

      case 'deactivate':
        await this.prisma.group.update({
          where: { id: groupId },
          data: { isActive: false },
        });

        if (group.creatorId) {
          await this.notificationService.sendNotification({
            userId: group.creatorId,
            type: 'MESSAGE_RECEIVED',
            content: `'${group.name}' 그룹이 비활성화되었습니다. 사유: ${reason}`,
          });
        }
        break;
    }

    // 관리자 로그 기록
    await this.logAdminAction(adminId, 'MANAGE_GROUP', {
      groupId,
      action,
      reason,
    });
  }

  /**
   * 공지사항 발송
   *
   * @param adminId 관리자 ID
   * @param data 공지사항 데이터
   */
  async sendBroadcastNotification(
    adminId: string,
    data: BroadcastNotificationDto,
  ) {
    const { title, message, targetAudience } = data;

    const where: any = {};

    if (targetAudience === 'premium') {
      where.isPremium = true;
    } else if (targetAudience === 'active') {
      where.lastActive = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    // 일괄 알림 생성
    await this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: 'MESSAGE_RECEIVED',
        title,
        message,
        isRead: false,
      })),
    });

    // 푸시 알림 발송
    for (const user of users) {
      await this.notificationService.sendPushNotification(user.id, {
        title,
        body: message,
      });
    }

    // 관리자 로그 기록
    await this.logAdminAction(adminId, 'BROADCAST_NOTIFICATION', {
      title,
      message,
      targetAudience,
      userCount: users.length,
    });

    return { sentCount: users.length };
  }

  /**
   * 관리자 권한 확인
   *
   * @param userId 사용자 ID
   * @returns 관리자 여부
   */
  async isAdmin(userId: string): Promise<boolean> {
    // 실제로는 별도의 관리자 테이블이나 역할 시스템이 필요
    // 임시로 특정 ID를 관리자로 가정
    const ADMIN_IDS = ['admin-user-id'];
    return ADMIN_IDS.includes(userId);
  }

  /**
   * 이번 달 수익 조회
   *
   * @returns 이번 달 수익
   */
  private async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
      },
    });

    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * 관리자 액션 로그 기록
   *
   * @param adminId 관리자 ID
   * @param action 액션 타입
   * @param data 액션 데이터
   */
  private async logAdminAction(adminId: string, action: string, data: any) {
    await this.prisma.notification.create({
      data: {
        userId: adminId,
        type: 'MESSAGE_RECEIVED',
        title: `Admin Action: ${action}`,
        message: JSON.stringify(data),
        data: {
          action,
          ...data,
          timestamp: new Date(),
        },
      },
    });
  }
}
