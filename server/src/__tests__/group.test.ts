import request from 'supertest';
import express from 'express';
import { groupController } from '../controllers/GroupController';
import { groupService } from '../services/GroupService';
import { prisma } from '../config/database';
import { createMockUser, createMockGroup } from './setup';
import { errorHandler } from '../middleware/errorHandler';

// Mock services
jest.mock('../services/GroupService');

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount group routes with mocked auth
app.get('/groups', mockAuth, groupController.getGroups);
app.post('/groups', mockAuth, groupController.createGroup);
app.get('/groups/:groupId', mockAuth, groupController.getGroupById);
app.post('/groups/:groupId/join', mockAuth, groupController.joinGroup);
app.post('/groups/:groupId/leave', mockAuth, groupController.leaveGroup);
app.get('/groups/:groupId/members', mockAuth, groupController.getGroupMembers);

// Add error handler
app.use(errorHandler);

describe('Group API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /groups', () => {
    it('should return paginated group list', async () => {
      const mockGroups = [
        createMockGroup({ name: 'Group 1' }),
        createMockGroup({ name: 'Group 2' }),
      ];
      
      (groupService.getGroups as jest.Mock).mockResolvedValue(mockGroups);

      const response = await request(app)
        .get('/groups')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Group 1' }),
          expect.objectContaining({ name: 'Group 2' }),
        ])
      });
    });

    it('should filter groups by type', async () => {
      const officialGroup = createMockGroup({ type: 'OFFICIAL' });
      
      (groupService.getGroups as jest.Mock).mockResolvedValue([officialGroup]);

      const response = await request(app)
        .get('/groups')
        .query({ type: 'OFFICIAL' })
        .expect(200);

      expect(groupService.getGroups).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'OFFICIAL' })
      );
    });
  });

  describe('POST /groups', () => {
    const groupData = {
      name: 'Test Group',
      description: 'Test description',
      type: 'CREATED',
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
    };

    it('should create group successfully', async () => {
      const mockUser = createMockUser();
      const mockGroup = createMockGroup(groupData);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (groupService.createGroup as jest.Mock).mockResolvedValue(mockGroup);

      const response = await request(app)
        .post('/groups')
        .send(groupData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          name: groupData.name,
          description: groupData.description,
          type: groupData.type,
        })
      });
    });

    it('should validate group name length', async () => {
      const response = await request(app)
        .post('/groups')
        .send({ ...groupData, name: 'a' }) // Too short
        .expect(400);

      expect(response.body.error?.message).toBeDefined();
    });

    it('should prevent non-premium users from creating too many groups', async () => {
      const mockUser = createMockUser({ isPremium: false });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.group.count as jest.Mock).mockResolvedValue(3); // Already has 3 groups

      const response = await request(app)
        .post('/groups')
        .send(groupData)
        .expect(403);

      expect(response.body.error.message).toBe('무료 사용자는 최대 3개의 그룹만 생성할 수 있습니다.');
    });
  });

  describe('GET /groups/:groupId', () => {
    it('should return group details with member status', async () => {
      const mockGroup = createMockGroup();
      const mockMember = {
        id: 'member-id',
        userId: 'test-user-id',
        groupId: mockGroup.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      };
      
      (groupService.getGroupById as jest.Mock).mockResolvedValue({
        ...mockGroup,
        isUserMember: true,
        userRole: 'MEMBER',
      });

      const response = await request(app)
        .get(`/groups/${mockGroup.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockGroup.id,
          name: mockGroup.name,
          isUserMember: true,
          userRole: 'MEMBER',
        }),
      });
    });

    it('should return 404 for non-existent group', async () => {
      (groupService.getGroupById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/groups/non-existent-id')
        .expect(404);

      expect(response.body.error.message).toBe('그룹을 찾을 수 없습니다.');
    });
  });

  describe('POST /groups/:groupId/join', () => {
    it('should join group successfully', async () => {
      const mockUser = createMockUser();
      const mockGroup = createMockGroup();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
      (prisma.groupMember.findFirst as jest.Mock).mockResolvedValue(null); // Not a member
      (groupService.joinGroup as jest.Mock).mockResolvedValue({
        id: 'membership-id',
        role: 'MEMBER',
        status: 'ACTIVE',
      });

      const response = await request(app)
        .post(`/groups/${mockGroup.id}/join`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          role: 'MEMBER',
          status: 'ACTIVE',
        }),
      });
    });

    it('should prevent duplicate joins', async () => {
      const mockGroup = createMockGroup();
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue({
        ...mockGroup,
        _count: { members: 10 }
      });
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-membership',
        status: 'ACTIVE',
      });

      const response = await request(app)
        .post(`/groups/${mockGroup.id}/join`)
        .expect(400);

      expect(response.body.error.message).toBe('이미 그룹에 가입되어 있습니다.');
    });

    it('should check group capacity', async () => {
      const mockGroup = createMockGroup({
        memberCount: 100,
        maxMembers: 100,
      });
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue({
        ...mockGroup,
        _count: { members: 100 }
      });
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/groups/${mockGroup.id}/join`)
        .expect(400);

      expect(response.body.error.message).toBe('그룹 용량이 가득 찼습니다.');
    });
  });

  describe('POST /groups/:groupId/leave', () => {
    it('should leave group successfully', async () => {
      const mockGroup = createMockGroup();
      const mockMembership = {
        id: 'membership-id',
        userId: 'test-user-id',
        groupId: mockGroup.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      };
      
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.groupMember.delete as jest.Mock).mockResolvedValue(mockMembership);

      const response = await request(app)
        .post(`/groups/${mockGroup.id}/leave`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { message: '그룹에서 나갔습니다.' },
      });
    });

    it('should prevent creator from leaving their group', async () => {
      const mockGroup = createMockGroup({ creatorId: 'test-user-id' });
      const mockMembership = {
        id: 'membership-id',
        role: 'CREATOR',
        status: 'ACTIVE',
      };
      
      (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);

      const response = await request(app)
        .post(`/groups/${mockGroup.id}/leave`)
        .expect(400);

      expect(response.body.error.message).toBe('그룹 생성자는 그룹을 나갈 수 없습니다. 그룹을 삭제하거나 관리자 권한을 이양하세요.');
    });
  });

  describe('GET /groups/:groupId/members', () => {
    it('should return group members list', async () => {
      const mockGroup = createMockGroup();
      const mockMembers = [
        {
          id: 'member-1',
          user: createMockUser({ nickname: 'User1' }),
          role: 'ADMIN',
          joinedAt: new Date(),
        },
        {
          id: 'member-2',
          user: createMockUser({ nickname: 'User2' }),
          role: 'MEMBER',
          joinedAt: new Date(),
        },
      ];
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
      (prisma.groupMember.findFirst as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });
      (groupService.getGroupMembers as jest.Mock).mockResolvedValue({
        members: mockMembers,
        total: 2,
      });

      const response = await request(app)
        .get(`/groups/${mockGroup.id}/members`)
        .expect(200);

      expect(response.body).toEqual({
        members: expect.arrayContaining([
          expect.objectContaining({
            user: expect.objectContaining({ nickname: 'User1' }),
            role: 'ADMIN',
          }),
          expect.objectContaining({
            user: expect.objectContaining({ nickname: 'User2' }),
            role: 'MEMBER',
          }),
        ]),
        total: 2,
      });
    });

    it('should restrict access to private group members', async () => {
      const mockGroup = createMockGroup({
        settings: { isPrivate: true },
      });
      
      (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
      (prisma.groupMember.findFirst as jest.Mock).mockResolvedValue(null); // Not a member

      const response = await request(app)
        .get(`/groups/${mockGroup.id}/members`)
        .expect(403);

      expect(response.body.error.message).toBe('그룹 멤버만 멤버 목록을 볼 수 있습니다.');
    });
  });
});