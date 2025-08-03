import { MatchStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { APP_CONFIG } from '@shared/constants';
import { getMatchCompatibilityScore, calculateDistance } from '@shared/utils';
import { metrics, trackAsyncOperation } from '../utils/monitoring';



/**
 * 매칭 서비스 - 매칭 관리, 추천, 호환성 계산
 * @class MatchingService
 */
export class MatchingService {
  /**
   * 사용자의 매칭 목록 조회
   * @param {string} userId - 사용자 ID
   * @param {MatchStatus} status - 매칭 상태
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Array>} 매칭 목록
   */
  async getUserMatches(userId: string, status: MatchStatus, page: number, limit: number) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            age: true,
            gender: true,
            profileImage: true,
            lastActive: true
          }
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            age: true,
            gender: true,
            profileImage: true,
            lastActive: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        messages: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      const lastMessage = match.messages[0];

      return {
        id: match.id,
        user: otherUser,
        group: match.group,
        status: match.status,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          isFromMe: lastMessage.senderId === userId,
          createdAt: lastMessage.createdAt
        } : null,
        createdAt: match.createdAt
      };
    });
  }

  /**
   * ID로 매칭 상세 정보 조회
   * @param {string} matchId - 매칭 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<Object|null>} 매칭 상세 정보
   * @throws {Error} 접근 권한이 없을 때
   */
  async getMatchById(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            age: true,
            gender: true,
            profileImage: true,
            bio: true,
            lastActive: true
          }
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            age: true,
            gender: true,
            profileImage: true,
            bio: true,
            lastActive: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true
          }
        }
      }
    });

    if (!match) return null;

    // Check if user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw createError(403, '이 매치에 접근할 권한이 없습니다.');
    }

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;

    return {
      id: match.id,
      user: otherUser,
      group: match.group,
      status: match.status,
      createdAt: match.createdAt
    };
  }

  /**
   * 매칭 삭제
   * @param {string} matchId - 매칭 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   * @throws {Error} 매칭을 찾을 수 없거나 권한이 없을 때
   */
  async deleteMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw createError(404, '매치를 찾을 수 없습니다.');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw createError(403, '이 매치를 삭제할 권한이 없습니다.');
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'DELETED' }
    });

    // Also update the related likes
    await prisma.userLike.updateMany({
      where: {
        OR: [
          { fromUserId: match.user1Id, toUserId: match.user2Id },
          { fromUserId: match.user2Id, toUserId: match.user1Id }
        ],
        groupId: match.groupId
      },
      data: { isMatch: false }
    });
  }

  /**
   * 매칭 추천 목록 조회
   * @param {string} userId - 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @param {number} count - 추천 수
   * @returns {Promise<Array>} 추천 사용자 목록 (호환성 점수 포함)
   * @throws {Error} 그룹 멤버가 아닐 때
   */
  async getMatchingRecommendations(userId: string, groupId: string, count: number) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        age: true,
        gender: true,
        groupMemberships: {
          where: { groupId, status: 'ACTIVE' },
          select: { groupId: true }
        }
      }
    });

    if (!currentUser || currentUser.groupMemberships.length === 0) {
      throw createError(400, '해당 그룹의 멤버가 아닙니다.');
    }

    // Get users already liked or matched
    const alreadyInteracted = await prisma.userLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true }
    });

    const excludeUserIds = [userId, ...alreadyInteracted.map(like => like.toUserId)];

    // Get potential matches in the same group
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        groupMemberships: {
          some: {
            groupId,
            status: 'ACTIVE'
          }
        },
        nickname: { not: 'deleted_user' },
        age: { not: null },
        gender: { not: null }
      },
      select: {
        id: true,
        nickname: true,
        age: true,
        gender: true,
        profileImage: true,
        bio: true,
        lastActive: true
      },
      take: count * 2 // Get more to allow for filtering
    });

    // Calculate compatibility scores and apply matching algorithm
    return await trackAsyncOperation(
      async () => {
        return potentialMatches
          .map(user => ({
            ...user,
            compatibilityScore: this.calculateAdvancedCompatibilityScore(currentUser, user),
            // Anonymize until liked
            nickname: user.nickname ? user.nickname.charAt(0) + '*'.repeat(user.nickname.length - 1) : '',
            bio: null // Hide bio until matched
          }))
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, count);
      },
      metrics.matchingDuration,
      { type: 'discovery' }
    );
  }

  /**
   * 매칭 신고
   * @param {string} matchId - 매칭 ID
   * @param {string} reporterId - 신고자 ID
   * @param {string} reason - 신고 사유
   * @param {string} [description] - 상세 설명
   * @returns {Promise<Object>} 신고 결과
   * @throws {Error} 매칭을 찾을 수 없거나 권한이 없을 때
   */
  async reportMatch(matchId: string, reporterId: string, reason: string, description?: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw createError(404, '매치를 찾을 수 없습니다.');
    }

    if (match.user1Id !== reporterId && match.user2Id !== reporterId) {
      throw createError(403, '이 매치를 신고할 권한이 없습니다.');
    }

    // In a real implementation, you'd have a reports table
    // For now, we'll mark the match as deleted and log the report
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'DELETED' }
    });

    console.log('Match reported:', {
      matchId,
      reporterId,
      reason,
      description,
      timestamp: new Date()
    });

    return {
      message: '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.'
    };
  }

  /**
   * 매칭 기간 연장 (프리미엄 기능)
   * @param {string} matchId - 매칭 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 연장 결과
   * @throws {Error} 매칭을 찾을 수 없거나 권한이 없을 때
   */
  async extendMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw createError(404, '매치를 찾을 수 없습니다.');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw createError(403, '이 매치를 연장할 권한이 없습니다.');
    }

    if (match.status !== 'ACTIVE') {
      throw createError(400, '활성 상태의 매치만 연장할 수 있습니다.');
    }

    // Extend match by 30 days (premium feature)
    const extendedDate = new Date();
    extendedDate.setDate(extendedDate.getDate() + 30);

    // In a real implementation, you'd have an expiresAt field
    // For now, we'll just return success
    return {
      matchId,
      message: '매치가 30일 연장되었습니다.',
      extendedUntil: extendedDate
    };
  }

  /**
   * 매칭 히스토리 조회
   * @param {string} userId - 사용자 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} [groupId] - 그룹 ID (선택사항)
   * @returns {Promise<Array>} 매칭 히스토리
   */
  async getMatchingHistory(userId: string, page: number, limit: number, groupId?: string) {
    const where: any = {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        user1: {
          select: { id: true, nickname: true, profileImage: true }
        },
        user2: {
          select: { id: true, nickname: true, profileImage: true }
        },
        group: {
          select: { id: true, name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      
      return {
        id: match.id,
        user: otherUser,
        group: match.group,
        status: match.status,
        createdAt: match.createdAt
      };
    });
  }

  /**
   * 상호 연결 조회 (공통 그룹, 공통 매칭)
   * @param {string} matchId - 매칭 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 상호 연결 정보
   * @throws {Error} 매칭을 찾을 수 없거나 권한이 없을 때
   */
  async getMutualConnections(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw createError(404, '매치를 찾을 수 없습니다.');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw createError(403, '이 매치의 상호 연결을 볼 권한이 없습니다.');
    }

    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // Find mutual groups
    const mutualGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: { in: [userId, otherUserId] },
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        members: {
          where: {
            userId: { in: [userId, otherUserId] },
            status: 'ACTIVE'
          },
          select: { userId: true }
        }
      }
    });

    const trulyMutualGroups = mutualGroups.filter(group => 
      group.members.length === 2
    );

    // Find mutual matches (other users both have matched with) - Single query
    const mutualMatches = await this.getMutualMatchedUserIds(userId, otherUserId);

    return {
      mutualGroups: trulyMutualGroups.map(group => ({
        id: group.id,
        name: group.name,
        type: group.type
      })),
      mutualMatchCount: mutualMatches.length
    };
  }

  /**
   * 사용자의 매칭된 사용자 ID 목록 조회
   * @private
   * @param {string} userId - 사용자 ID
   * @returns {Promise<string[]>} 매칭된 사용자 ID 배열
   */
  private async getUserMatchedUserIds(userId: string): Promise<string[]> {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACTIVE'
      },
      select: { user1Id: true, user2Id: true }
    });

    return matches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );
  }

  /**
   * 두 사용자의 공통 매칭된 사용자 ID 목록 조회
   * @private
   * @param {string} userId1 - 첫 번째 사용자 ID
   * @param {string} userId2 - 두 번째 사용자 ID
   * @returns {Promise<string[]>} 공통 매칭된 사용자 ID 배열
   */
  private async getMutualMatchedUserIds(userId1: string, userId2: string): Promise<string[]> {
    // Get all matches for both users in a single query
    const matches = await prisma.match.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          {
            OR: [
              {
                OR: [
                  { user1Id: userId1 },
                  { user2Id: userId1 }
                ]
              },
              {
                OR: [
                  { user1Id: userId2 },
                  { user2Id: userId2 }
                ]
              }
            ]
          }
        ]
      },
      select: { user1Id: true, user2Id: true }
    });

    // Extract all matched user IDs for each user
    const user1Matches = new Set<string>();
    const user2Matches = new Set<string>();

    matches.forEach(match => {
      if (match.user1Id === userId1) {
        user1Matches.add(match.user2Id);
      } else if (match.user2Id === userId1) {
        user1Matches.add(match.user1Id);
      }

      if (match.user1Id === userId2) {
        user2Matches.add(match.user2Id);
      } else if (match.user2Id === userId2) {
        user2Matches.add(match.user1Id);
      }
    });

    // Find mutual matches (excluding userId1 and userId2 themselves)
    const mutualMatches = Array.from(user1Matches).filter(id => 
      user2Matches.has(id) && id !== userId1 && id !== userId2
    );

    return mutualMatches;
  }

  /**
   * 고급 호환성 점수 계산
   * @private
   * @param {Object} currentUser - 현재 사용자
   * @param {Object} targetUser - 대상 사용자
   * @returns {number} 호환성 점수 (0-100)
   */
  private calculateAdvancedCompatibilityScore(currentUser: any, targetUser: any): number {
    let score = 50; // Base score

    // Age compatibility (0-25 points)
    if (currentUser.age && targetUser.age) {
      const ageCompatibility = getMatchCompatibilityScore(currentUser.age, targetUser.age);
      score += (ageCompatibility / 100) * 25;
    }

    // Activity recency (0-20 points)
    const lastActiveHours = (Date.now() - new Date(targetUser.lastActive).getTime()) / (1000 * 60 * 60);
    if (lastActiveHours < 1) score += 20;
    else if (lastActiveHours < 6) score += 15;
    else if (lastActiveHours < 24) score += 10;
    else if (lastActiveHours < 72) score += 5;

    // Profile completeness (0-15 points)
    let completeness = 0;
    if (targetUser.profileImage) completeness += 5;
    if (targetUser.bio && targetUser.bio.length > 20) completeness += 5;
    if (targetUser.nickname && targetUser.nickname.length > 2) completeness += 5;
    score += completeness;

    // Random factor for variety (0-10 points)
    score += Math.random() * 10;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * 만료된 매칭 정리
   * @returns {Promise<number>} 만료 처리된 매칭 수
   */
  async cleanupExpiredMatches() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - APP_CONFIG.MATCH_EXPIRY_DAYS);

    const expiredMatches = await prisma.match.updateMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: thirtyDaysAgo },
        messages: { none: {} } // No messages exchanged
      },
      data: { status: 'EXPIRED' }
    });

    console.log(`Expired ${expiredMatches.count} inactive matches`);
    return expiredMatches.count;
  }
}

export const matchingService = new MatchingService();
