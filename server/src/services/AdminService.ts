import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * 관리자 서비스 - 관리자 대시보드 및 통계 기능
 * @class AdminService
 */
export class AdminService {
  private static instance: AdminService;
  
  private constructor() {}
  
  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * 관리자 권한 확인
   * @param {string} userId - 사용자 ID
   * @returns {Promise<boolean>} 관리자 여부
   */
  async isAdmin(userId: string): Promise<boolean> {
    // TODO: 실제 관리자 권한 체크 로직 구현
    // 현재는 하드코딩된 관리자 ID 사용
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    return adminIds.includes(userId);
  }

  /**
   * 대시보드 통계 조회
   * @returns {Promise<Object>} 대시보드 통계 데이터
   */
  async getDashboardStats() {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastMonth = subDays(today, 30);

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalGroups,
      totalMatches,
      todayMatches,
      totalRevenue,
      todayRevenue,
      monthlyRevenue
    ] = await Promise.all([
      // 전체 사용자
      prisma.user.count(),
      
      // 활성 사용자 (최근 7일)
      prisma.user.count({
        where: { lastActive: { gte: lastWeek } }
      }),
      
      // 프리미엄 사용자
      prisma.user.count({
        where: { isPremium: true }
      }),
      
      // 전체 그룹
      prisma.group.count({
        where: { isActive: true }
      }),
      
      // 전체 매치
      prisma.match.count({
        where: { status: 'ACTIVE' }
      }),
      
      // 오늘 매치
      prisma.match.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          }
        }
      }),
      
      // 전체 수익
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // 오늘 수익
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          }
        },
        _sum: { amount: true }
      }),
      
      // 월 수익
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: lastMonth }
        },
        _sum: { amount: true }
      })
    ]);

    // 성장률 계산
    const [yesterdayUsers, lastWeekUsers] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lte: yesterday } }
      }),
      prisma.user.count({
        where: { createdAt: { lte: lastWeek } }
      })
    ]);

    const userGrowthRate = yesterdayUsers > 0 
      ? ((totalUsers - yesterdayUsers) / yesterdayUsers * 100).toFixed(1)
      : '0';

    const weeklyUserGrowthRate = lastWeekUsers > 0
      ? ((totalUsers - lastWeekUsers) / lastWeekUsers * 100).toFixed(1)
      : '0';

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        growthRate: userGrowthRate,
        weeklyGrowthRate: weeklyUserGrowthRate
      },
      groups: {
        total: totalGroups
      },
      matches: {
        total: totalMatches,
        today: todayMatches
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        today: todayRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0
      }
    };
  }

  /**
   * 사용자 목록 조회
   * @param {Object} options - 조회 옵션
   * @param {number} options.page - 페이지 번호
   * @param {number} options.limit - 페이지당 항목 수
   * @param {string} [options.search] - 검색어
   * @param {boolean} [options.isPremium] - 프리미엄 여부
   * @param {boolean} [options.isVerified] - 인증 여부
   * @param {string} [options.sortBy] - 정렬 기준
   * @param {string} [options.sortOrder] - 정렬 순서
   * @returns {Promise<Object>} 사용자 목록 및 페이지네이션 정보
   */
  async getUsers(options: {
    page: number;
    limit: number;
    search?: string;
    isPremium?: boolean;
    isVerified?: boolean;
    sortBy?: 'createdAt' | 'lastActive';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, isPremium, isVerified, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: any = {};

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { id: search }
      ];
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          phoneNumber: true,
          age: true,
          gender: true,
          isPremium: true,
          premiumUntil: true,
          isVerified: true,
          credits: true,
          lastActive: true,
          createdAt: true,
          _count: {
            select: {
              sentLikes: true,
              receivedLikes: true,
              matches1: true,
              matches2: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => ({
        ...user,
        matchCount: user._count.matches1 + user._count.matches2,
        likesSent: user._count.sentLikes,
        likesReceived: user._count.receivedLikes
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 사용자 상세 정보 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 상세 정보
   */
  async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        verifications: {
          include: {
            company: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            sentLikes: true,
            receivedLikes: true,
            matches1: true,
            matches2: true,
            notifications: true
          }
        }
      }
    });

    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    return {
      ...user,
      stats: {
        matchCount: user._count.matches1 + user._count.matches2,
        likesSent: user._count.sentLikes,
        likesReceived: user._count.receivedLikes,
        notificationCount: user._count.notifications
      }
    };
  }

  /**
   * 그룹 목록 조회
   * @param {Object} options - 조회 옵션
   * @param {number} options.page - 페이지 번호
   * @param {number} options.limit - 페이지당 항목 수
   * @param {string} [options.search] - 검색어
   * @param {string} [options.type] - 그룹 타입
   * @param {boolean} [options.isActive] - 활성화 여부
   * @returns {Promise<Object>} 그룹 목록 및 페이지네이션 정보
   */
  async getGroups(options: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, type, isActive } = options;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              nickname: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              members: true,
              likes: true,
              matches: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.group.count({ where })
    ]);

    return {
      groups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 신고 목록 조회
   * @param {Object} options - 조회 옵션
   * @param {number} options.page - 페이지 번호
   * @param {number} options.limit - 페이지당 항목 수
   * @param {string} [options.status] - 신고 상태
   * @param {string} [options.type] - 신고 타입
   * @returns {Promise<Object>} 신고 목록 및 페이지네이션 정보
   */
  async getReports(options: {
    page: number;
    limit: number;
    status?: 'pending' | 'resolved' | 'dismissed';
    type?: string;
  }) {
    // TODO: 신고 테이블 구현 후 작성
    return {
      reports: [],
      pagination: {
        total: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 0
      }
    };
  }

  /**
   * 수익 분석 데이터 조회
   * @param {'day'|'week'|'month'|'year'} period - 분석 기간
   * @returns {Promise<Object>} 수익 분석 데이터
   */
  async getRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = subDays(now, 7);
        break;
      case 'week':
        startDate = subDays(now, 30);
        break;
      case 'month':
        startDate = subDays(now, 365);
        break;
      case 'year':
        startDate = subDays(now, 365 * 3);
        break;
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      select: {
        amount: true,
        type: true,
        createdAt: true
      }
    });

    // 기간별 집계
    const revenueByPeriod = new Map<string, number>();
    const revenueByType = {
      PREMIUM_SUBSCRIPTION: 0,
      LIKE_CREDITS: 0
    };

    for (const payment of payments) {
      // 날짜별 집계
      const dateKey = payment.createdAt.toISOString().split('T')[0]!;
      revenueByPeriod.set(dateKey, (revenueByPeriod.get(dateKey) || 0) + payment.amount);
      
      // 타입별 집계
      if (payment.type === 'PREMIUM_SUBSCRIPTION') {
        revenueByType.PREMIUM_SUBSCRIPTION += payment.amount;
      } else if (payment.type === 'LIKE_CREDITS') {
        revenueByType.LIKE_CREDITS += payment.amount;
      }
    }

    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      byPeriod: Array.from(revenueByPeriod.entries()).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => a.date.localeCompare(b.date)),
      byType: revenueByType
    };
  }

  /**
   * 사용자 활동 분석
   * @returns {Promise<Object>} 사용자 활동 분석 데이터
   */
  async getUserActivityAnalytics() {
    const now = new Date();
    const lastMonth = subDays(now, 30);

    // 시간대별 활동 분석
    const hourlyActivity = await prisma.user.groupBy({
      by: ['lastActive'],
      where: {
        lastActive: { gte: lastMonth }
      },
      _count: true
    });

    // 요일별 가입 분석
    const dailySignups = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: lastMonth }
      },
      _count: true
    });

    return {
      hourlyActivity,
      dailySignups
    };
  }

  /**
   * 사용자 차단/해제
   * @param {string} userId - 사용자 ID
   * @param {boolean} block - 차단 여부
   * @returns {Promise<Object>} 처리 결과 메시지
   */
  async toggleUserBlock(userId: string, block: boolean) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: block ? new Date() : null
      }
    });

    return {
      message: block ? '사용자가 차단되었습니다.' : '사용자 차단이 해제되었습니다.'
    };
  }

  /**
   * 그룹 활성화/비활성화
   * @param {string} groupId - 그룹 ID
   * @param {boolean} active - 활성화 여부
   * @returns {Promise<Object>} 처리 결과 메시지
   */
  async toggleGroupActive(groupId: string, active: boolean) {
    await prisma.group.update({
      where: { id: groupId },
      data: { isActive: active }
    });

    return {
      message: active ? '그룹이 활성화되었습니다.' : '그룹이 비활성화되었습니다.'
    };
  }

  /**
   * 시스템 설정 조회
   * @returns {Promise<Object>} 시스템 설정 정보
   */
  async getSystemSettings() {
    // TODO: 시스템 설정 테이블 구현 후 작성
    return {
      maintenance: false,
      signupEnabled: true,
      paymentEnabled: true,
      notificationEnabled: true
    };
  }

  /**
   * 시스템 설정 업데이트
   * @param {Object} settings - 업데이트할 설정
   * @returns {Promise<Object>} 업데이트된 설정
   */
  async updateSystemSettings(settings: any) {
    // TODO: 시스템 설정 업데이트 구현
    return settings;
  }
}

export const adminService = AdminService.getInstance();