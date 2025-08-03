import { GroupService } from '../GroupService';
import { prismaMock } from '../../__tests__/setup';
import { createMockUser, createMockGroup } from '../../__tests__/setup';
import { createError } from '../../middleware/errorHandler';

describe('GroupService', () => {
  let groupService: GroupService;

  beforeEach(() => {
    groupService = new GroupService();
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const userId = 'user-1';
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        type: 'CREATED' as const,
        settings: {
          maxMembers: 50,
          minGenderBalance: 0.3,
        }
      };

      const mockGroup = createMockGroup({
        ...groupData,
        creatorId: userId,
      });

      prismaMock.group.create.mockResolvedValue(mockGroup as any);

      const result = await groupService.createGroup({
        ...groupData,
        creatorId: userId
      });

      expect(result).toEqual(mockGroup);
      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: {
          ...groupData,
          creatorId: userId,
          members: {
            create: {
              userId,
              status: 'ACTIVE',
              role: 'ADMIN',
            },
          },
        },
        include: {
          creator: true,
          _count: {
            select: { members: true },
          },
        },
      });
    });

    it('should validate group name length', async () => {
      const groupData = {
        name: 'a',
        type: 'CREATED' as const,
        settings: {}
      };

      await expect(
        groupService.createGroup({
          ...groupData,
          creatorId: 'user-1'
        })
      ).rejects.toThrow('그룹 이름은 2자 이상이어야 합니다.');
    });
  });

  describe('getGroupById', () => {
    it('should return group details', async () => {
      const mockGroup = createMockGroup({
        id: 'group-1',
        members: [
          { userId: 'user-1', status: 'ACTIVE', role: 'ADMIN' },
          { userId: 'user-2', status: 'ACTIVE', role: 'MEMBER' },
        ],
      });

      prismaMock.group.findUnique.mockResolvedValue(mockGroup as any);

      const result = await groupService.getGroupById('group-1', 'user-1');

      expect(result).toEqual(mockGroup);
      expect(prismaMock.group.findUnique).toHaveBeenCalledWith({
        where: { id: 'group-1' },
        include: {
          creator: true,
          members: {
            include: { user: true },
            where: { status: 'ACTIVE' },
          },
          _count: {
            select: { members: true },
          },
        },
      });
    });

    it('should return null for non-existent group', async () => {
      prismaMock.group.findUnique.mockResolvedValue(null);

      const result = await groupService.getGroupById('non-existent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('joinGroup', () => {
    it('should add user to group', async () => {
      const userId = 'user-1';
      const groupId = 'group-1';
      
      const mockGroup = createMockGroup({
        id: groupId,
        maxMembers: 50,
        _count: { members: 10 },
      });

      prismaMock.group.findUnique.mockResolvedValue(mockGroup as any);
      prismaMock.groupMember.findFirst.mockResolvedValue(null);
      prismaMock.groupMember.create.mockResolvedValue({
        groupId,
        userId,
        status: 'ACTIVE',
        role: 'MEMBER',
        joinedAt: new Date(),
      } as any);

      const result = await groupService.joinGroup(userId, groupId);

      expect(result).toHaveProperty('groupId', groupId);
      expect(result).toHaveProperty('userId', userId);
    });

    it('should throw error if group is full', async () => {
      const mockGroup = createMockGroup({
        maxMembers: 50,
        _count: { members: 50 },
      });

      prismaMock.group.findUnique.mockResolvedValue(mockGroup as any);

      await expect(
        groupService.joinGroup('user-1', 'group-1')
      ).rejects.toThrow('이 그룹은 정원이 가득 찼습니다.');
    });

    it('should throw error if already a member', async () => {
      const mockGroup = createMockGroup();
      const existingMembership = {
        userId: 'user-1',
        groupId: 'group-1',
        status: 'ACTIVE',
      };

      prismaMock.group.findUnique.mockResolvedValue(mockGroup as any);
      prismaMock.groupMember.findFirst.mockResolvedValue(existingMembership as any);

      await expect(
        groupService.joinGroup('user-1', 'group-1')
      ).rejects.toThrow('이미 이 그룹의 멤버입니다.');
    });
  });

  describe('leaveGroup', () => {
    it('should remove user from group', async () => {
      const membership = {
        userId: 'user-1',
        groupId: 'group-1',
        status: 'ACTIVE',
        role: 'MEMBER',
      };

      prismaMock.groupMember.findFirst.mockResolvedValue(membership as any);
      prismaMock.groupMember.update.mockResolvedValue({
        ...membership,
        status: 'LEFT',
      } as any);

      await groupService.leaveGroup('user-1', 'group-1');

      expect(prismaMock.groupMember.update).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: 'user-1',
            groupId: 'group-1',
          },
        },
        data: { status: 'LEFT' },
      });
    });

    it('should throw error if not a member', async () => {
      prismaMock.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        groupService.leaveGroup('user-1', 'group-1')
      ).rejects.toThrow('이 그룹의 멤버가 아닙니다.');
    });

    it('should throw error if admin tries to leave', async () => {
      const membership = {
        userId: 'user-1',
        groupId: 'group-1',
        status: 'ACTIVE',
        role: 'ADMIN',
      };

      prismaMock.groupMember.findFirst.mockResolvedValue(membership as any);

      await expect(
        groupService.leaveGroup('user-1', 'group-1')
      ).rejects.toThrow('관리자는 그룹을 떠날 수 없습니다. 먼저 다른 멤버에게 관리자 권한을 이전하세요.');
    });
  });

  describe('updateGroup', () => {
    it('should update group details', async () => {
      const groupId = 'group-1';
      const userId = 'user-1';
      const updateData = {
        description: 'Updated description',
        maxMembers: 100,
      };

      const membership = {
        userId,
        groupId,
        role: 'ADMIN',
      };

      const updatedGroup = createMockGroup({
        id: groupId,
        ...updateData,
      });

      prismaMock.groupMember.findFirst.mockResolvedValue(membership as any);
      prismaMock.group.update.mockResolvedValue(updatedGroup as any);

      const result = await groupService.updateGroup(groupId, userId, updateData);

      expect(result).toEqual(updatedGroup);
      expect(prismaMock.group.update).toHaveBeenCalledWith({
        where: { id: groupId },
        data: updateData,
        include: {
          creator: true,
          _count: {
            select: { members: true },
          },
        },
      });
    });

    it('should throw error if not admin', async () => {
      const membership = {
        userId: 'user-1',
        groupId: 'group-1',
        role: 'MEMBER',
      };

      prismaMock.groupMember.findFirst.mockResolvedValue(membership as any);

      await expect(
        groupService.updateGroup('group-1', 'user-1', { description: 'New' })
      ).rejects.toThrow('그룹을 수정할 권한이 없습니다.');
    });
  });

  describe('searchGroups', () => {
    it('should search groups by name', async () => {
      const mockGroups = [
        createMockGroup({ name: 'Test Group 1' }),
        createMockGroup({ name: 'Test Group 2' }),
      ];

      prismaMock.group.findMany.mockResolvedValue(mockGroups as any);

      const result = await groupService.searchGroups({ name: 'Test' });

      expect(result).toEqual(mockGroups);
      expect(prismaMock.group.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Test', mode: 'insensitive' },
          status: 'ACTIVE',
        },
        include: {
          creator: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { members: { _count: 'desc' } },
        take: 20,
      });
    });

    it('should filter by group type', async () => {
      prismaMock.group.findMany.mockResolvedValue([]);

      await groupService.searchGroups({ type: 'OFFICIAL' });

      expect(prismaMock.group.findMany).toHaveBeenCalledWith({
        where: {
          type: 'OFFICIAL',
          status: 'ACTIVE',
        },
        include: expect.any(Object),
        orderBy: { members: { _count: 'desc' } },
        take: 20,
      });
    });
  });

  describe('getGenderBalance', () => {
    it('should calculate gender balance correctly', async () => {
      const groupId = 'group-1';
      const members = [
        { user: { gender: 'MALE' } },
        { user: { gender: 'MALE' } },
        { user: { gender: 'FEMALE' } },
        { user: { gender: 'FEMALE' } },
        { user: { gender: 'FEMALE' } },
      ];

      prismaMock.groupMember.findMany.mockResolvedValue(members as any);

      const result = await groupService.getGenderBalance(groupId);

      expect(result).toEqual({
        male: 2,
        female: 3,
        total: 5,
        maleRatio: 0.4,
        femaleRatio: 0.6,
        isBalanced: true,
      });
    });

    it('should handle groups with no members', async () => {
      prismaMock.groupMember.findMany.mockResolvedValue([]);

      const result = await groupService.getGenderBalance('group-1');

      expect(result).toEqual({
        male: 0,
        female: 0,
        total: 0,
        maleRatio: 0,
        femaleRatio: 0,
        isBalanced: false,
      });
    });
  });
});