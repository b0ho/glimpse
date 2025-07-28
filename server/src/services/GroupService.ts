import { GroupType } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { contentFilterService } from './ContentFilterService';
import { GROUP_CONFIG } from '@shared/constants';
import { generateId } from '@shared/utils';



interface CreateGroupData {
  name: string;
  description?: string;
  type: GroupType;
  settings: any;
  location?: any;
  companyId?: string;
  creatorId: string;
}

interface GetGroupsOptions {
  userId: string;
  type?: GroupType;
  search?: string;
  page: number;
  limit: number;
}

export class GroupService {
  async getGroups(options: GetGroupsOptions) {
    const { userId, type, search, page, limit } = options;

    const where: any = {
      isActive: true
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        creator: {
          select: { id: true, nickname: true }
        },
        company: {
          select: { id: true, name: true, logo: true }
        },
        members: {
          where: { status: 'ACTIVE' },
          select: { userId: true, role: true }
        },
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } }
        }
      },
      orderBy: [
        { type: 'asc' }, // Official groups first
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    return groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      memberCount: group._count.members,
      maxMembers: group.maxMembers,
      settings: group.settings,
      location: group.location,
      creator: group.creator,
      company: group.company,
      isUserMember: group.members.some(member => member.userId === userId),
      userRole: group.members.find(member => member.userId === userId)?.role,
      createdAt: group.createdAt
    }));
  }

  async createGroup(data: CreateGroupData) {
    const { name, description, type, settings, location, companyId, creatorId } = data;

    // Validate group limits
    const maxMembers = GROUP_CONFIG.MAX_MEMBERS[type];
    
    // For location groups, validate location data
    if (type === 'LOCATION' && !location) {
      throw createError(400, '위치 기반 그룹은 위치 정보가 필요합니다.');
    }

    // Filter group name
    const nameFilter = await contentFilterService.filterText(name, 'group');
    if (nameFilter.severity === 'blocked') {
      throw createError(400, '그룹 이름에 부적절한 내용이 포함되어 있습니다.');
    }
    const filteredName = nameFilter.filteredText || name;

    // Filter description if provided
    let filteredDescription = description;
    if (description) {
      const descFilter = await contentFilterService.filterText(description, 'group');
      if (descFilter.severity === 'blocked') {
        throw createError(400, '그룹 설명에 부적절한 내용이 포함되어 있습니다.');
      }
      filteredDescription = descFilter.filteredText || description;
    }

    const group = await prisma.group.create({
      data: {
        name: filteredName,
        description: filteredDescription,
        type,
        maxMembers,
        settings,
        location,
        companyId,
        creatorId
      }
    });

    // Add creator as group member
    await prisma.groupMember.create({
      data: {
        userId: creatorId,
        groupId: group.id,
        role: 'CREATOR',
        status: 'ACTIVE'
      }
    });

    return group;
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: { id: true, nickname: true, profileImage: true }
        },
        company: {
          select: { id: true, name: true, logo: true, description: true }
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, nickname: true, profileImage: true, lastActive: true }
            }
          },
          orderBy: [
            { role: 'asc' }, // Creator first, then admin, then member
            { joinedAt: 'asc' }
          ]
        }
      }
    });

    if (!group) return null;

    const userMembership = group.members.find(member => member.userId === userId);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive,
      memberCount: group.members.length,
      maxMembers: group.maxMembers,
      settings: group.settings,
      location: group.location,
      creator: group.creator,
      company: group.company,
      members: group.members.map(member => ({
        id: member.id,
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt
      })),
      isUserMember: !!userMembership,
      userRole: userMembership?.role,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }

  async generateInviteLink(groupId: string, userId: string): Promise<string> {
    // Check if user has permission to generate invite link
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
        role: { in: ['CREATOR', 'ADMIN'] }
      }
    });

    if (!membership) {
      throw createError(403, '초대 링크를 생성할 권한이 없습니다.');
    }

    // Generate unique invite code
    const inviteCode = generateId(8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invite in database
    await prisma.groupInvite.create({
      data: {
        groupId,
        inviteCode,
        createdByUserId: userId,
        expiresAt,
        maxUses: 100,
        uses: 0
      }
    });

    // Return the invite link
    const baseUrl = process.env.FRONTEND_URL || 'https://glimpse.app';
    return `${baseUrl}/invite/${inviteCode}`;
  }

  async joinGroupByInvite(inviteCode: string, userId: string) {
    // Find the invite
    const invite = await prisma.groupInvite.findUnique({
      where: { inviteCode },
      include: {
        group: {
          include: {
            _count: {
              select: { members: { where: { status: 'ACTIVE' } } }
            }
          }
        }
      }
    });

    if (!invite) {
      throw createError(404, '유효하지 않은 초대 코드입니다.');
    }

    if (invite.expiresAt < new Date()) {
      throw createError(400, '만료된 초대 코드입니다.');
    }

    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw createError(400, '초대 코드 사용 횟수를 초과했습니다.');
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: invite.groupId,
        userId
      }
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        throw createError(400, '이미 그룹의 멤버입니다.');
      } else if (existingMembership.status === 'BANNED') {
        throw createError(403, '이 그룹에서 차단되었습니다.');
      }
    }

    // Check if group is full
    if (invite.group._count.members >= invite.group.maxMembers) {
      throw createError(400, '그룹이 가득 찼습니다.');
    }

    // Add user to group
    await prisma.$transaction(async (tx) => {
      // Create membership
      await tx.groupMember.create({
        data: {
          userId,
          groupId: invite.groupId,
          role: 'MEMBER',
          status: invite.group.settings?.requireApproval ? 'PENDING' : 'ACTIVE'
        }
      });

      // Update invite usage
      await tx.groupInvite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } }
      });
    });

    return {
      success: true,
      requiresApproval: invite.group.settings?.requireApproval || false,
      group: {
        id: invite.group.id,
        name: invite.group.name,
        type: invite.group.type
      }
    };
  }

  async getGroupInvites(groupId: string, userId: string) {
    // Check if user has permission
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
        role: { in: ['CREATOR', 'ADMIN'] }
      }
    });

    if (!membership) {
      throw createError(403, '초대 링크를 조회할 권한이 없습니다.');
    }

    const invites = await prisma.groupInvite.findMany({
      where: {
        groupId,
        expiresAt: { gt: new Date() }
      },
      include: {
        createdBy: {
          select: { id: true, nickname: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return invites.map(invite => ({
      id: invite.id,
      inviteCode: invite.inviteCode,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      uses: invite.uses,
      maxUses: invite.maxUses,
      link: `${process.env.FRONTEND_URL || 'https://glimpse.app'}/invite/${invite.inviteCode}`
    }));
  }

  async revokeInvite(inviteId: string, userId: string) {
    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
      include: {
        group: {
          include: {
            members: {
              where: { userId, status: 'ACTIVE' }
            }
          }
        }
      }
    });

    if (!invite) {
      throw createError(404, '초대를 찾을 수 없습니다.');
    }

    const userMembership = invite.group.members[0];
    if (!userMembership || !['CREATOR', 'ADMIN'].includes(userMembership.role)) {
      throw createError(403, '초대를 취소할 권한이 없습니다.');
    }

    await prisma.groupInvite.delete({
      where: { id: inviteId }
    });

    return { success: true };
  }

  async updateGroup(groupId: string, updateData: any) {
    const { name, description, settings, location, maxMembers } = updateData;

    const filteredData: any = {};

    // Filter group name if provided
    if (name) {
      const nameFilter = await contentFilterService.filterText(name, 'group');
      if (nameFilter.severity === 'blocked') {
        throw createError(400, '그룹 이름에 부적절한 내용이 포함되어 있습니다.');
      }
      filteredData.name = nameFilter.filteredText || name;
    }

    // Filter description if provided
    if (description) {
      const descFilter = await contentFilterService.filterText(description, 'group');
      if (descFilter.severity === 'blocked') {
        throw createError(400, '그룹 설명에 부적절한 내용이 포함되어 있습니다.');
      }
      filteredData.description = descFilter.filteredText || description;
    }

    // Add other fields without filtering
    if (settings) filteredData.settings = settings;
    if (location) filteredData.location = location;
    if (maxMembers) filteredData.maxMembers = maxMembers;

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...filteredData,
        updatedAt: new Date()
      }
    });

    return group;
  }

  async deleteGroup(groupId: string) {
    // Check if group has active matches or conversations
    const hasActiveMatches = await prisma.match.count({
      where: { groupId, status: 'ACTIVE' }
    });

    if (hasActiveMatches > 0) {
      // Soft delete - deactivate instead of hard delete
      await prisma.group.update({
        where: { id: groupId },
        data: { isActive: false }
      });
    } else {
      // Hard delete if no active content
      await prisma.group.delete({
        where: { id: groupId }
      });
    }
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: { where: { status: 'ACTIVE' } } } }
      }
    });

    if (!group || !group.isActive) {
      throw createError(404, '그룹을 찾을 수 없습니다.');
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId }
      }
    });

    if (existingMembership?.status === 'ACTIVE') {
      throw createError(400, '이미 그룹에 가입되어 있습니다.');
    }

    if (existingMembership?.status === 'BANNED') {
      throw createError(403, '그룹에서 차단된 사용자입니다.');
    }

    // Check group capacity
    if (group.maxMembers && group._count.members >= group.maxMembers) {
      throw createError(400, '그룹 용량이 가득 찼습니다.');
    }

    // Check group settings
    const settings = group.settings as any || {};
    const requiresApproval = settings.requiresApproval || false;

    if (existingMembership) {
      // Update existing membership
      await prisma.groupMember.update({
        where: { id: existingMembership.id },
        data: {
          status: requiresApproval ? 'PENDING' : 'ACTIVE',
          joinedAt: new Date()
        }
      });
    } else {
      // Create new membership
      await prisma.groupMember.create({
        data: {
          userId,
          groupId,
          role: 'MEMBER',
          status: requiresApproval ? 'PENDING' : 'ACTIVE'
        }
      });
    }

    return {
      groupId,
      status: requiresApproval ? 'PENDING' : 'ACTIVE',
      message: requiresApproval ? '가입 승인을 기다리고 있습니다.' : '그룹에 가입되었습니다.'
    };
  }

  async leaveGroup(userId: string, groupId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId }
      }
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw createError(404, '그룹 멤버십을 찾을 수 없습니다.');
    }

    if (membership.role === 'CREATOR') {
      throw createError(400, '그룹 생성자는 그룹을 나갈 수 없습니다. 그룹을 삭제하거나 관리자 권한을 이양하세요.');
    }

    await prisma.groupMember.delete({
      where: { id: membership.id }
    });
  }

  async getGroupMembers(groupId: string, page: number, limit: number) {
    const members = await prisma.groupMember.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            lastActive: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    return members.map(member => ({
      id: member.id,
      user: member.user,
      role: member.role,
      joinedAt: member.joinedAt
    }));
  }

  async inviteUsersToGroup(groupId: string, phoneNumbers: string[], inviterId: string) {
    const results = [];

    for (const phoneNumber of phoneNumbers) {
      try {
        const user = await prisma.user.findUnique({
          where: { phoneNumber }
        });

        if (user) {
          // User exists, add to group
          await this.joinGroup(user.id, groupId);
          results.push({ phoneNumber, status: 'invited', userId: user.id });
        } else {
          // User doesn't exist, could send SMS invitation
          results.push({ phoneNumber, status: 'user_not_found' });
        }
      } catch (error) {
        results.push({ phoneNumber, status: 'error', error: (error as Error).message });
      }
    }

    return results;
  }

  async createInviteCode(groupId: string, createdBy: string, maxUses: number, expiresInHours: number) {
    const code = generateId().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        groupId,
        createdBy,
        maxUses,
        expiresAt
      }
    });

    return {
      code: inviteCode.code,
      maxUses: inviteCode.maxUses,
      expiresAt: inviteCode.expiresAt
    };
  }

  async joinByInviteCode(userId: string, code: string) {
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code },
      include: { group: true }
    });

    if (!inviteCode) {
      throw createError(404, '유효하지 않은 초대 코드입니다.');
    }

    if (new Date() > inviteCode.expiresAt) {
      throw createError(400, '초대 코드가 만료되었습니다.');
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      throw createError(400, '초대 코드 사용 횟수가 초과되었습니다.');
    }

    // Join the group
    const result = await this.joinGroup(userId, inviteCode.groupId);

    // Update invite code usage
    await prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } }
    });

    return {
      ...result,
      groupName: inviteCode.group.name
    };
  }

  async getGroupStats(groupId: string) {
    const [totalMembers, activeMembers, totalLikes, totalMatches] = await Promise.all([
      prisma.groupMember.count({ where: { groupId } }),
      prisma.groupMember.count({ where: { groupId, status: 'ACTIVE' } }),
      prisma.userLike.count({ where: { groupId } }),
      prisma.match.count({ where: { groupId, status: 'ACTIVE' } })
    ]);

    return {
      totalMembers,
      activeMembers,
      totalLikes,
      totalMatches
    };
  }
}

export const groupService = new GroupService();
