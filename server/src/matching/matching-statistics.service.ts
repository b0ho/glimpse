import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * 매칭 통계 서비스 - 매칭 및 활동 통계 분석
 */
@Injectable()
export class MatchingStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 매칭 통계 조회
   */
  async getUserMatchingStatistics(userId: string) {
    const [
      totalLikesSent,
      totalLikesReceived,
      totalMatches,
      activeMatches,
      messagesExchanged,
      groupsJoined,
      thisWeekLikes,
      thisWeekMatches
    ] = await Promise.all([
      this.prisma.userLike.count({ where: { fromUserId: userId } }),
      this.prisma.userLike.count({ where: { toUserId: userId } }),
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }]
        }
      }),
      this.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE'
        }
      }),
      this.prisma.chatMessage.count({ where: { senderId: userId } }),
      this.prisma.groupMember.count({
        where: { userId, status: 'ACTIVE' }
      }),
      this.getWeeklyLikes(userId),
      this.getWeeklyMatches(userId)
    ]);

    const matchRate = totalLikesSent > 0 ? (totalMatches / totalLikesSent) * 100 : 0;
    const responseRate = totalLikesReceived > 0 ? (totalMatches / totalLikesReceived) * 100 : 0;

    return {
      overview: {
        totalLikesSent,
        totalLikesReceived,
        totalMatches,
        activeMatches,
        messagesExchanged,
        groupsJoined
      },
      rates: {
        matchRate: Math.round(matchRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100
      },
      thisWeek: {
        likes: thisWeekLikes,
        matches: thisWeekMatches
      },
      activity: await this.getUserActivityStats(userId),
      topGroups: await this.getUserTopGroups(userId)
    };
  }

  /**
   * 전체 통계 조회
   */
  async getGlobalStatistics() {
    const [
      totalUsers,
      activeUsers,
      totalMatches,
      totalMessages,
      totalGroups,
      averageMatchesPerUser,
      topGroups
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      this.prisma.match.count({ where: { status: 'ACTIVE' } }),
      this.prisma.chatMessage.count(),
      this.prisma.group.count({ where: { isActive: true } }),
      this.getAverageMatchesPerUser(),
      this.getTopPerformingGroups()
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      },
      matching: {
        totalMatches,
        averageMatchesPerUser
      },
      engagement: {
        totalMessages,
        messagesPerMatch: totalMatches > 0 ? totalMessages / totalMatches : 0
      },
      groups: {
        total: totalGroups,
        topPerforming: topGroups
      }
    };
  }

  /**
   * 그룹 통계 조회
   */
  async getGroupStatistics(groupId: string) {
    const [
      memberCount,
      activeMemberCount,
      totalLikes,
      totalMatches,
      averageAge,
      genderDistribution,
      recentActivity
    ] = await Promise.all([
      this.prisma.groupMember.count({ where: { groupId } }),
      this.prisma.groupMember.count({ where: { groupId, status: 'ACTIVE' } }),
      this.prisma.userLike.count({ where: { groupId } }),
      this.prisma.match.count({ where: { groupId, status: 'ACTIVE' } }),
      this.getGroupAverageAge(groupId),
      this.getGroupGenderDistribution(groupId),
      this.getGroupRecentActivity(groupId)
    ]);

    const matchRate = totalLikes > 0 ? (totalMatches * 2 / totalLikes) * 100 : 0; // *2 because each match involves 2 likes

    return {
      members: {
        total: memberCount,
        active: activeMemberCount,
        activeRate: memberCount > 0 ? (activeMemberCount / memberCount) * 100 : 0
      },
      activity: {
        totalLikes,
        totalMatches,
        matchRate: Math.round(matchRate * 100) / 100
      },
      demographics: {
        averageAge,
        genderDistribution
      },
      recentActivity
    };
  }

  /**
   * 주간 좋아요 수 조회
   */
  private async getWeeklyLikes(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return await this.prisma.userLike.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: weekAgo }
      }
    });
  }

  /**
   * 주간 매칭 수 조회
   */
  private async getWeeklyMatches(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return await this.prisma.match.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        createdAt: { gte: weekAgo }
      }
    });
  }

  /**
   * 사용자 활동 통계 조회
   */
  private async getUserActivityStats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await this.prisma.userLike.groupBy({
      by: ['createdAt'],
      where: {
        fromUserId: userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    // Process daily activity into a format suitable for charts
    const activityMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityMap.set(dateStr, 0);
    }

    dailyActivity.forEach(activity => {
      const dateStr = activity.createdAt.toISOString().split('T')[0];
      activityMap.set(dateStr, activity._count);
    });

    return Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));
  }

  /**
   * 사용자 상위 그룹 조회
   */
  private async getUserTopGroups(userId: string) {
    const topGroups = await this.prisma.group.findMany({
      where: {
        members: {
          some: { userId, status: 'ACTIVE' }
        }
      },
      include: {
        _count: {
          select: {
            likes: { where: { fromUserId: userId } },
            matches: {
              where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        matches: { _count: 'desc' }
      },
      take: 5
    });

    return topGroups.map(group => ({
      id: group.id,
      name: group.name,
      type: group.type,
      likesInGroup: group._count.likes,
      matchesInGroup: group._count.matches
    }));
  }

  /**
   * 사용자당 평균 매칭 수 계산
   */
  private async getAverageMatchesPerUser(): Promise<number> {
    const result = await this.prisma.match.groupBy({
      by: ['user1Id'],
      where: { status: 'ACTIVE' },
      _count: true
    });

    if (result.length === 0) return 0;
    
    const totalMatches = result.reduce((sum, item) => sum + item._count, 0);
    return Math.round((totalMatches / result.length) * 100) / 100;
  }

  /**
   * 상위 성과 그룹 조회
   */
  private async getTopPerformingGroups() {
    return await this.prisma.group.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            matches: { where: { status: 'ACTIVE' } },
            members: { where: { status: 'ACTIVE' } }
          }
        }
      },
      orderBy: {
        matches: { _count: 'desc' }
      },
      take: 10
    }).then(groups => 
      groups.map(group => ({
        id: group.id,
        name: group.name,
        type: group.type,
        memberCount: group._count.members,
        matchCount: group._count.matches,
        matchRate: group._count.members > 1 
          ? (group._count.matches / (group._count.members * (group._count.members - 1) / 2)) * 100
          : 0
      }))
    );
  }

  /**
   * 그룹 평균 나이 계산
   */
  private async getGroupAverageAge(groupId: string): Promise<number | null> {
    const result = await this.prisma.user.aggregate({
      where: {
        groupMemberships: {
          some: { groupId, status: 'ACTIVE' }
        },
        age: { not: null }
      },
      _avg: { age: true }
    });

    return result._avg.age ? Math.round(result._avg.age) : null;
  }

  /**
   * 그룹 성별 분포 조회
   */
  private async getGroupGenderDistribution(groupId: string) {
    const distribution = await this.prisma.user.groupBy({
      by: ['gender'],
      where: {
        groupMemberships: {
          some: { groupId, status: 'ACTIVE' }
        },
        gender: { not: null }
      },
      _count: true
    });

    return distribution.reduce((acc, item) => {
      if (item.gender) {
        acc[item.gender] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 그룹 최근 활동 조회
   */
  private async getGroupRecentActivity(groupId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentLikes, recentMatches, recentMessages] = await Promise.all([
      this.prisma.userLike.count({
        where: { groupId, createdAt: { gte: sevenDaysAgo } }
      }),
      this.prisma.match.count({
        where: { groupId, createdAt: { gte: sevenDaysAgo } }
      }),
      this.prisma.chatMessage.count({
        where: {
          match: { groupId },
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ]);

    return {
      likes: recentLikes,
      matches: recentMatches,
      messages: recentMessages
    };
  }

  /**
   * 매칭 트렌드 조회
   */
  async getMatchingTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyMatches = await this.prisma.match.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'ACTIVE'
      },
      _count: true
    });

    const dailyLikes = await this.prisma.userLike.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Process into daily trends
    const trendsMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendsMap.set(dateStr, { matches: 0, likes: 0 });
    }

    dailyMatches.forEach(item => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (trendsMap.has(dateStr)) {
        trendsMap.get(dateStr).matches = item._count;
      }
    });

    dailyLikes.forEach(item => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (trendsMap.has(dateStr)) {
        trendsMap.get(dateStr).likes = item._count;
      }
    });

    return Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      matches: data.matches,
      likes: data.likes,
      matchRate: data.likes > 0 ? (data.matches / data.likes) * 100 : 0
    }));
  }
}