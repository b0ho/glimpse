import { prisma } from "../config/database";



export class MatchingStatisticsService {
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
      prisma.userLike.count({ where: { fromUserId: userId } }),
      prisma.userLike.count({ where: { toUserId: userId } }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }]
        }
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE'
        }
      }),
      prisma.chatMessage.count({ where: { senderId: userId } }),
      prisma.groupMember.count({
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
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.match.count({ where: { status: 'ACTIVE' } }),
      prisma.chatMessage.count(),
      prisma.group.count({ where: { isActive: true } }),
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
      prisma.groupMember.count({ where: { groupId } }),
      prisma.groupMember.count({ where: { groupId, status: 'ACTIVE' } }),
      prisma.userLike.count({ where: { groupId } }),
      prisma.match.count({ where: { groupId, status: 'ACTIVE' } }),
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

  private async getWeeklyLikes(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return await prisma.userLike.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: weekAgo }
      }
    });
  }

  private async getWeeklyMatches(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return await prisma.match.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        createdAt: { gte: weekAgo }
      }
    });
  }

  private async getUserActivityStats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await prisma.userLike.groupBy({
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

  private async getUserTopGroups(userId: string) {
    const topGroups = await prisma.group.findMany({
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

  private async getAverageMatchesPerUser(): Promise<number> {
    const result = await prisma.match.groupBy({
      by: ['user1Id'],
      where: { status: 'ACTIVE' },
      _count: true
    });

    if (result.length === 0) return 0;
    
    const totalMatches = result.reduce((sum, item) => sum + item._count, 0);
    return Math.round((totalMatches / result.length) * 100) / 100;
  }

  private async getTopPerformingGroups() {
    return await prisma.group.findMany({
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

  private async getGroupAverageAge(groupId: string): Promise<number | null> {
    const result = await prisma.user.aggregate({
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

  private async getGroupGenderDistribution(groupId: string) {
    const distribution = await prisma.user.groupBy({
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

  private async getGroupRecentActivity(groupId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentLikes, recentMatches, recentMessages] = await Promise.all([
      prisma.userLike.count({
        where: { groupId, createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.match.count({
        where: { groupId, createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.chatMessage.count({
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

  async getMatchingTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyMatches = await prisma.match.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'ACTIVE'
      },
      _count: true
    });

    const dailyLikes = await prisma.userLike.groupBy({
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

export const matchingStatisticsService = new MatchingStatisticsService();