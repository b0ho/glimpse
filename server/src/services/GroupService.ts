/**
 * @module GroupService
 * @description 그룹 생성, 관리, 멤버십 처리를 담당하는 서비스
 * 회사/대학 공식 그룹, 사용자 생성 그룹, 위치 기반 그룹 등을 관리합니다.
 */

import { GroupType } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { contentFilterService } from './ContentFilterService';
import { GROUP_CONFIG } from '@shared/constants';
import { generateId } from '@shared/utils';

/**
 * 그룹 생성 데이터 인터페이스
 * @interface CreateGroupData
 */
interface CreateGroupData {
  /** 그룹명 */
  name: string;
  /** 그룹 설명 */
  description?: string;
  /** 그룹 타입 */
  type: GroupType;
  /** 그룹 설정 */
  settings: any;
  /** 위치 정보 (LOCATION 타입) */
  location?: any;
  /** 회사 ID (OFFICIAL 타입) */
  companyId?: string;
  /** 생성자 ID */
  creatorId: string;
}

/**
 * 그룹 조회 옵션 인터페이스
 * @interface GetGroupsOptions
 */
interface GetGroupsOptions {
  /** 사용자 ID */
  userId: string;
  /** 그룹 타입 필터 */
  type?: GroupType;
  /** 검색어 */
  search?: string;
  /** 페이지 번호 */
  page: number;
  /** 페이지당 항목 수 */
  limit: number;
}

/**
 * 그룹 관리 서비스 클래스
 * @class GroupService
 * @description 그룹 생성, 조회, 수정, 삭제 및 멤버 관리 기능을 제공합니다.
 * 그룹 타입별 특수 로직과 매칭 활성화 조건을 처리합니다.
 */
export class GroupService {
  /**
   * 그룹 목록 조회
   * @async
   * @param {GetGroupsOptions} options - 조회 옵션
   * @returns {Promise<Array>} 그룹 목록 및 멤버 정보
   * @description 사용자가 접근 가능한 그룹 목록을 조회합니다.
   * 타입별 필터링, 검색, 페이지네이션을 지원합니다.
   */
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

  /**
   * 그룹 생성
   * @async
   * @param {CreateGroupData} data - 그룹 생성 데이터
   * @returns {Promise<Object>} 생성된 그룹 정보
   * @throws {Error} 부적절한 내용이나 위치 정보 누락 시
   * @description 새로운 그룹을 생성하고 생성자를 관리자로 지정합니다.
   * 그룹 이름과 설명을 필터링하여 부적절한 내용을 차단합니다.
   */
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

  /**
   * ID로 그룹 상세 정보 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<Object|null>} 그룹 상세 정보 및 멤버 수
   * @description 그룹의 상세 정보와 현재 사용자의 멤버 상태를 포함하여 반환합니다.
   * 비활성화된 그룹은 null을 반환합니다.
   */
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

  /**
   * 그룹 초대 링크 생성
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<string>} 초대 링크 URL
   * @throws {Error} 권한이 없을 때
   * @description 그룹 관리자가 7일간 유효한 초대 링크를 생성합니다.
   * 최대 100명까지 사용 가능한 초대 코드를 발급합니다.
   */
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
    const inviteCode = generateId('INV');
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

  /**
   * 초대 코드로 그룹 가입
   * @async
   * @param {string} inviteCode - 초대 코드
   * @param {string} userId - 가입할 사용자 ID
   * @returns {Promise<Object>} 가입 결과 및 그룹 정보
   * @throws {Error} 유효하지 않은 코드, 만료, 정원 초과 등
   * @description 초대 코드를 검증하고 사용자를 그룹에 추가합니다.
   * 그룹 설정에 따라 승인 대기 상태로 추가될 수 있습니다.
   */
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
    if (invite.group._count.members >= (invite.group.maxMembers || 50)) {
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
          status: (invite.group.settings as any)?.requireApproval ? 'PENDING' : 'ACTIVE'
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
      requiresApproval: (invite.group.settings as any)?.requireApproval || false,
      group: {
        id: invite.group.id,
        name: invite.group.name,
        type: invite.group.type
      }
    };
  }

  /**
   * 그룹의 활성 초대 목록 조회
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<Array>} 초대 목록
   * @throws {Error} 권한이 없을 때
   */
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

  /**
   * 초대 취소
   * @async
   * @param {string} inviteId - 초대 ID
   * @param {string} userId - 요청 사용자 ID
   * @returns {Promise<Object>} 취소 결과
   * @throws {Error} 초대를 찾을 수 없거나 권한이 없을 때
   * @description 그룹 관리자가 발급한 초대 링크를 취소합니다.
   */
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

  /**
   * 그룹 정보 수정
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object>} 수정된 그룹
   * @throws {Error} 부적절한 내용 포함 시
   * @description 그룹 이름, 설명, 설정 등을 수정합니다.
   * 수정 내용은 컨텐츠 필터를 거쳐 검증됩니다.
   */
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

  /**
   * 그룹 삭제
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   * @description 그룹을 삭제하거나 비활성화합니다.
   * 활성 매칭이 있는 경우 소프트 삭제, 없는 경우 하드 삭제합니다.
   */
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

  /**
   * 그룹 가입
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<Object>} 가입 결과
   * @throws {Error} 이미 가입됨, 차단됨, 정원 초과 등
   * @description 사용자를 그룹에 가입시킵니다.
   * 그룹 설정에 따라 승인 대기 상태로 가입될 수 있습니다.
   */
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

  /**
   * 그룹 탈퇴
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   * @throws {Error} 멤버십을 찾을 수 없거나 생성자인 경우
   * @description 사용자를 그룹에서 탈퇴시킵니다.
   * 그룹 생성자는 탈퇴할 수 없습니다.
   */
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

  /**
   * 그룹 멤버 목록 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Array>} 멤버 목록
   * @description 활성 멤버 목록을 역할별, 가입일순으로 정렬하여 반환합니다.
   */
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

  /**
   * 전화번호로 사용자 초대
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string[]} phoneNumbers - 전화번호 목록
   * @param {string} inviterId - 초대자 ID
   * @returns {Promise<Array>} 초대 결과 목록
   * @description 전화번호로 사용자를 검색하여 그룹에 초대합니다.
   * 각 전화번호에 대한 초대 결과를 반환합니다.
   */
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

  /**
   * 초대 코드 생성
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} createdBy - 생성자 ID
   * @param {number} maxUses - 최대 사용 횟수
   * @param {number} expiresInHours - 만료 시간 (시간)
   * @returns {Promise<Object>} 생성된 초대 코드 정보
   * @description 8자리 대문자 초대 코드를 생성합니다.
   */
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

  /**
   * 초대 코드로 그룹 가입
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} code - 초대 코드
   * @returns {Promise<Object>} 가입 결과와 그룹명
   * @throws {Error} 유효하지 않거나 만료된 코드
   * @description 초대 코드를 검증하고 사용자를 그룹에 가입시킵니다.
   */
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

  /**
   * 그룹 통계 조회
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<Object>} 그룹 통계 (멤버 수, 좋아요 수, 매칭 수)
   */
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

  /**
   * 승인 대기 중인 멤버 목록 조회
   * @param {string} groupId - 그룹 ID
   * @param {string} adminUserId - 관리자 사용자 ID
   * @returns {Promise<Array>} 대기 중인 멤버 목록
   * @throws {Error} 권한이 없을 때
   */
  async getPendingMembers(groupId: string, adminUserId: string) {
    // Check if user is admin
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: adminUserId,
        role: { in: ['CREATOR', 'ADMIN'] },
        status: 'ACTIVE'
      }
    });

    if (!adminMembership) {
      throw createError(403, '대기 중인 멤버를 조회할 권한이 없습니다.');
    }

    const pendingMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            age: true,
            gender: true,
            bio: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return pendingMembers;
  }

  /**
   * 멤버 가입 승인
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 승인할 사용자 ID
   * @param {string} adminUserId - 관리자 사용자 ID
   * @returns {Promise<Object>} 업데이트된 멤버십
   * @throws {Error} 권한이 없을 때
   */
  async approveMember(groupId: string, userId: string, adminUserId: string) {
    // Check if admin has permission
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: adminUserId,
        role: { in: ['CREATOR', 'ADMIN'] },
        status: 'ACTIVE'
      }
    });

    if (!adminMembership) {
      throw createError(403, '멤버를 승인할 권한이 없습니다.');
    }

    // Update member status
    const membership = await prisma.groupMember.update({
      where: {
        userId_groupId: { userId, groupId }
      },
      data: {
        status: 'ACTIVE'
      }
    });

    // TODO: Send notification to approved user
    // await notificationService.sendNotification(userId, {
    //   type: 'GROUP_APPROVED',
    //   message: '그룹 가입이 승인되었습니다.'
    // });

    return membership;
  }

  /**
   * 멤버 가입 거절
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 거절할 사용자 ID
   * @param {string} adminUserId - 관리자 사용자 ID
   * @param {string} [reason] - 거절 사유
   * @returns {Promise<Object>} 거절 결과
   * @throws {Error} 권한이 없을 때
   */
  async rejectMember(groupId: string, userId: string, adminUserId: string, reason?: string) {
    // Check if admin has permission
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: adminUserId,
        role: { in: ['CREATOR', 'ADMIN'] },
        status: 'ACTIVE'
      }
    });

    if (!adminMembership) {
      throw createError(403, '멤버를 거절할 권한이 없습니다.');
    }

    // Delete membership request
    await prisma.groupMember.delete({
      where: {
        userId_groupId: { userId, groupId }
      }
    });

    // TODO: Send notification to rejected user with reason
    // await notificationService.sendNotification(userId, {
    //   type: 'GROUP_REJECTED',
    //   message: reason || '그룹 가입이 거절되었습니다.'
    // });

    return { success: true };
  }
}

export const groupService = new GroupService();
