import { MatchingService } from '../MatchingService';
import { prismaMock } from '../../__tests__/setup';
import { createMockUser, createMockGroup, createMockMatch } from '../../__tests__/setup';

describe('MatchingService', () => {
  let matchingService: MatchingService;

  beforeEach(() => {
    matchingService = new MatchingService();
    jest.clearAllMocks();
  });

  describe('getUserMatches', () => {
    it('should return user matches with correct format', async () => {
      const userId = 'test-user-1';
      const mockMatches = [
        {
          id: 'match-1',
          user1Id: userId,
          user2Id: 'test-user-2',
          groupId: 'group-1',
          status: 'ACTIVE',
          createdAt: new Date(),
          user1: createMockUser({ id: userId }),
          user2: createMockUser({ id: 'test-user-2', nickname: 'User2' }),
          group: createMockGroup({ id: 'group-1', name: 'Test Group' }),
          messages: [{
            id: 'msg-1',
            content: 'Hello',
            senderId: userId,
            createdAt: new Date(),
          }],
        },
      ];

      prismaMock.match.findMany.mockResolvedValue(mockMatches as any);

      const result = await matchingService.getUserMatches(userId, 'ACTIVE', 1, 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('user');
      expect(result[0].user?.id).toBe('test-user-2');
      expect(result[0]).toHaveProperty('lastMessage');
      expect(prismaMock.match.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty matches', async () => {
      prismaMock.match.findMany.mockResolvedValue([]);

      const result = await matchingService.getUserMatches('user-id', 'ACTIVE', 1, 10);

      expect(result).toEqual([]);
    });
  });

  describe('getMatchById', () => {
    it('should return match details for authorized user', async () => {
      const userId = 'test-user-1';
      const matchId = 'match-1';
      const mockMatch = {
        id: matchId,
        user1Id: userId,
        user2Id: 'test-user-2',
        groupId: 'group-1',
        status: 'ACTIVE',
        createdAt: new Date(),
        user1: createMockUser({ id: userId }),
        user2: createMockUser({ id: 'test-user-2' }),
        group: createMockGroup({ id: 'group-1' }),
      };

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);

      const result = await matchingService.getMatchById(matchId, userId);

      expect(result).toBeTruthy();
      expect(result?.user.id).toBe('test-user-2');
    });

    it('should throw error for unauthorized access', async () => {
      const mockMatch = {
        id: 'match-1',
        user1Id: 'other-user-1',
        user2Id: 'other-user-2',
      };

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);

      await expect(
        matchingService.getMatchById('match-1', 'unauthorized-user')
      ).rejects.toThrow('이 매치에 접근할 권한이 없습니다.');
    });

    it('should return null for non-existent match', async () => {
      prismaMock.match.findUnique.mockResolvedValue(null);

      const result = await matchingService.getMatchById('non-existent', 'user-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteMatch', () => {
    it('should delete match for authorized user', async () => {
      const userId = 'test-user-1';
      const mockMatch = {
        id: 'match-1',
        user1Id: userId,
        user2Id: 'test-user-2',
        groupId: 'group-1',
      };

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);
      prismaMock.match.update.mockResolvedValue({ ...mockMatch, status: 'DELETED' } as any);
      prismaMock.userLike.updateMany.mockResolvedValue({ count: 2 });

      await matchingService.deleteMatch('match-1', userId);

      expect(prismaMock.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: { status: 'DELETED' },
      });
      expect(prismaMock.userLike.updateMany).toHaveBeenCalled();
    });

    it('should throw error if match not found', async () => {
      prismaMock.match.findUnique.mockResolvedValue(null);

      await expect(
        matchingService.deleteMatch('non-existent', 'user-id')
      ).rejects.toThrow('매치를 찾을 수 없습니다.');
    });
  });

  describe('getMatchingRecommendations', () => {
    it('should return matching recommendations for group member', async () => {
      const userId = 'test-user-1';
      const groupId = 'group-1';
      const currentUser = createMockUser({
        id: userId,
        age: 25,
        gender: 'MALE',
        groupMemberships: [{ groupId, status: 'ACTIVE' }],
      });

      const potentialMatches = [
        createMockUser({ id: 'user-2', age: 23, gender: 'FEMALE' }),
        createMockUser({ id: 'user-3', age: 27, gender: 'FEMALE' }),
      ];

      prismaMock.user.findUnique.mockResolvedValue(currentUser as any);
      prismaMock.userLike.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue(potentialMatches as any);

      const result = await matchingService.getMatchingRecommendations(userId, groupId, 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('compatibilityScore');
      expect(result[0]!.bio).toBeNull(); // Bio hidden until matched
      expect(result[0]!.nickname).toMatch(/^\*+$/); // Anonymized nickname
    });

    it('should exclude already liked users', async () => {
      const userId = 'test-user-1';
      const groupId = 'group-1';
      const currentUser = createMockUser({
        id: userId,
        groupMemberships: [{ groupId, status: 'ACTIVE' }],
      });

      const alreadyLiked = [{ toUserId: 'user-2' }];
      const potentialMatches = [
        createMockUser({ id: 'user-3', age: 25 }),
      ];

      prismaMock.user.findUnique.mockResolvedValue(currentUser as any);
      prismaMock.userLike.findMany.mockResolvedValue(alreadyLiked as any);
      prismaMock.user.findMany.mockResolvedValue(potentialMatches as any);

      await matchingService.getMatchingRecommendations(userId, groupId, 5);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { notIn: [userId, 'user-2'] },
          groupMemberships: {
            some: { groupId, status: 'ACTIVE' },
          },
          nickname: { not: 'deleted_user' },
          age: { not: null },
          gender: { not: null },
        },
        select: expect.any(Object),
        take: 10, // 5 * 2 for filtering
      });
    });

    it('should throw error if user not in group', async () => {
      const currentUser = createMockUser({
        groupMemberships: [],
      });

      prismaMock.user.findUnique.mockResolvedValue(currentUser as any);

      await expect(
        matchingService.getMatchingRecommendations('user-id', 'group-1', 5)
      ).rejects.toThrow('해당 그룹의 멤버가 아닙니다.');
    });
  });

  describe('getMutualConnections', () => {
    it('should return mutual groups and matches', async () => {
      const matchId = 'match-1';
      const userId = 'user-1';
      const otherUserId = 'user-2';

      const mockMatch = {
        id: matchId,
        user1Id: userId,
        user2Id: otherUserId,
      };

      const mockGroups = [
        {
          id: 'group-1',
          name: 'Mutual Group',
          type: 'CREATED',
          members: [
            { userId },
            { userId: otherUserId },
          ],
        },
      ];

      const mockMatches = [
        { user1Id: userId, user2Id: 'user-3' },
        { user1Id: otherUserId, user2Id: 'user-3' },
        { user1Id: 'user-4', user2Id: userId },
        { user1Id: 'user-4', user2Id: otherUserId },
      ];

      prismaMock.match.findUnique.mockResolvedValue(mockMatch as any);
      prismaMock.group.findMany.mockResolvedValue(mockGroups as any);
      prismaMock.match.findMany.mockResolvedValue(mockMatches as any);

      const result = await matchingService.getMutualConnections(matchId, userId);

      expect(result.mutualGroups).toHaveLength(1);
      expect(result.mutualMatchCount).toBe(2); // user-3 and user-4
    });
  });

  describe('cleanupExpiredMatches', () => {
    it('should expire inactive matches', async () => {
      prismaMock.match.updateMany.mockResolvedValue({ count: 5 });

      const result = await matchingService.cleanupExpiredMatches();

      expect(result).toBe(5);
      expect(prismaMock.match.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          createdAt: { lt: expect.any(Date) },
          messages: { none: {} },
        },
        data: { status: 'EXPIRED' },
      });
    });
  });
});