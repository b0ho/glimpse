import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { GroupType, Group, Prisma } from '@prisma/client';
// import { GROUP_CONFIG } from '@shared/constants';
// import { generateId } from '@shared/utils';

const GROUP_CONFIG = {
  MAX_MEMBERS: 100,
  MIN_MEMBERS_FOR_ACTIVATION: 10,
  INVITE_CODE_LENGTH: 8,
  INVITE_CODE_EXPIRY_DAYS: 7,
  MIN_MALE_RATIO: 0.3,
  MIN_FEMALE_RATIO: 0.3,
};

const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
import {
  CreateGroupDto,
  UpdateGroupDto,
  GetGroupsQueryDto,
  UpdateMemberRoleDto,
  ApproveJoinRequestDto,
} from './dto/group.dto';

/**
 * 그룹 서비스
 *
 * 그룹 생성, 관리, 멤버십 처리를 담당합니다.
 */
@Injectable()
export class GroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 그룹 목록 조회
   *
   * @param userId 사용자 ID
   * @param type 그룹 타입 필터
   * @param search 검색어
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 그룹 목록
   */
  async getGroups(
    userId: string,
    type?: GroupType,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: Prisma.GroupWhereInput = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const groups = await this.prisma.group.findMany({
      where,
      include: {
        creator: {
          select: { id: true, nickname: true },
        },
        company: {
          select: { id: true, name: true, logo: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          select: { userId: true, role: true },
        },
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: [
        { type: 'asc' }, // 공식 그룹 우선
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return groups.map((group) => ({
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
      isUserMember: group.members.some((member) => member.userId === userId),
      userRole: group.members.find((member) => member.userId === userId)?.role,
      createdAt: group.createdAt,
    }));
  }

  /**
   * 그룹 상세 정보 조회
   *
   * @param groupId 그룹 ID
   * @param userId 요청 사용자 ID
   * @returns 그룹 상세 정보
   */
  async getGroupById(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
      include: {
        creator: {
          select: { id: true, nickname: true },
        },
        company: {
          select: { id: true, name: true, logo: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!group) {
      throw new HttpException('그룹을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    const userMembership = group.members.find(
      (member) => member.userId === userId,
    );

    return {
      ...group,
      memberCount: group._count.members,
      isUserMember: !!userMembership,
      userRole: userMembership?.role,
      isMatchingEnabled: this.isMatchingEnabled(group),
    };
  }

  /**
   * 그룹 생성
   *
   * @param creatorId 생성자 ID
   * @param data 그룹 생성 데이터
   * @returns 생성된 그룹
   */
  async createGroup(
    creatorId: string,
    data: {
      name: string;
      description?: string;
      type: GroupType;
      settings?: any;
      location?: any;
      companyId?: string;
    },
  ) {
    const { name, description, type, settings, location, companyId } = data;

    // 그룹 타입별 최대 멤버 수 설정
    const maxMembers = GROUP_CONFIG.MAX_MEMBERS;

    // 위치 기반 그룹 검증
    if (type === 'LOCATION' && !location) {
      throw new HttpException(
        '위치 기반 그룹은 위치 정보가 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: 콘텐츠 필터링 추가

    const group = await this.prisma.group.create({
      data: {
        name,
        description,
        type,
        maxMembers,
        settings: settings || {},
        location,
        companyId,
        creatorId,
      },
    });

    // 생성자를 그룹 멤버로 추가
    await this.prisma.groupMember.create({
      data: {
        userId: creatorId,
        groupId: group.id,
        role: 'CREATOR',
        status: 'ACTIVE',
      },
    });

    return group;
  }

  /**
   * 그룹 업데이트
   *
   * @param groupId 그룹 ID
   * @param userId 요청 사용자 ID
   * @param data 업데이트 데이터
   * @returns 업데이트된 그룹
   */
  async updateGroup(
    groupId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      settings?: any;
    },
  ) {
    // 권한 확인
    await this.checkAdminPermission(groupId, userId);

    return await this.prisma.group.update({
      where: { id: groupId },
      data,
    });
  }

  /**
   * 그룹 가입
   *
   * @param groupId 그룹 ID
   * @param userId 사용자 ID
   * @returns 멤버십 정보
   */
  async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!group || !group.isActive) {
      throw new HttpException('그룹을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 최대 멤버 수 확인
    if (group.maxMembers && group._count.members >= group.maxMembers) {
      throw new HttpException(
        '그룹의 최대 인원을 초과했습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 기존 멤버십 확인
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === 'ACTIVE') {
        throw new HttpException(
          '이미 그룹에 가입되어 있습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
      // 비활성 멤버 재활성화
      return await this.prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        data: {
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });
    }

    // 새 멤버 추가
    return await this.prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  }

  /**
   * 그룹 탈퇴
   *
   * @param groupId 그룹 ID
   * @param userId 사용자 ID
   */
  async leaveGroup(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new HttpException(
        '그룹 멤버십을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (membership.role === 'CREATOR') {
      throw new HttpException(
        '그룹 생성자는 그룹을 탈퇴할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      data: {
        status: 'BANNED',
        // leftAt 필드 삭제
      },
    });
  }

  /**
   * 그룹 초대 링크 생성
   *
   * @param groupId 그룹 ID
   * @param userId 요청 사용자 ID
   * @returns 초대 링크
   */
  async generateInviteLink(groupId: string, userId: string) {
    // 권한 확인
    await this.checkAdminPermission(groupId, userId);

    const inviteCode = generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    // GroupInvite 모델 사용
    await this.prisma.groupInvite.create({
      data: {
        groupId,
        inviteCode,
        createdByUserId: userId,
        expiresAt,
      },
    });

    return {
      inviteCode,
      expiresAt,
      inviteLink: `glimpse://group/invite/${inviteCode}`,
    };
  }

  /**
   * 초대 코드로 그룹 가입
   *
   * @param inviteCode 초대 코드
   * @param userId 사용자 ID
   * @returns 그룹 정보
   */
  async joinByInviteCode(inviteCode: string, userId: string) {
    // GroupInvite로 먼저 검색
    const invite = await this.prisma.groupInvite.findFirst({
      where: {
        inviteCode,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        group: true,
      },
    });

    if (!invite || !invite.group.isActive) {
      throw new HttpException(
        '유효하지 않은 초대 코드입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const group = invite.group;

    if (!group) {
      throw new HttpException(
        '유효하지 않은 초대 코드입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.joinGroup(group.id, userId);
    return group;
  }

  /**
   * 관리자 권한 확인
   *
   * @param groupId 그룹 ID
   * @param userId 사용자 ID
   */
  private async checkAdminPermission(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new HttpException('그룹 멤버가 아닙니다.', HttpStatus.FORBIDDEN);
    }

    if (membership.role !== 'CREATOR' && membership.role !== 'ADMIN') {
      throw new HttpException(
        '관리자 권한이 필요합니다.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * 매칭 활성화 여부 확인
   *
   * @param group 그룹 정보
   * @returns 매칭 활성화 여부
   */
  private isMatchingEnabled(group: any): boolean {
    const activeMembers = group.members.length;
    const minMembers = 10; // minimum members for matching

    // 최소 멤버 수 확인
    if (activeMembers < minMembers) {
      return false;
    }

    // 성별 균형 확인 (30% 이상)
    const maleCount = group.members.filter(
      (m: any) => m.user.gender === 'MALE',
    ).length;
    const femaleCount = group.members.filter(
      (m: any) => m.user.gender === 'FEMALE',
    ).length;

    const maleRatio = maleCount / activeMembers;
    const femaleRatio = femaleCount / activeMembers;

    return maleRatio >= 0.3 && femaleRatio >= 0.3;
  }

  /**
   * 그룹 멤버 제거
   */
  async removeMember(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
  ) {
    // 권한 확인
    await this.checkAdminPermission(groupId, adminUserId);

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new HttpException('멤버를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (membership.role === 'CREATOR') {
      throw new HttpException(
        '그룹 생성자는 제거할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
      data: {
        status: 'BANNED',
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(targetUserId);
  }

  /**
   * 멤버 역할 변경
   */
  async updateMemberRole(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
    roleData: UpdateMemberRoleDto,
  ) {
    // 권한 확인 (CREATOR만 가능)
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: adminUserId,
          groupId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== 'CREATOR') {
      throw new HttpException(
        '그룹 생성자만 역할을 변경할 수 있습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetMembership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== 'ACTIVE') {
      throw new HttpException('멤버를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    await this.prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
      data: {
        role: roleData.role,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(targetUserId);
  }

  /**
   * 사용자가 속한 그룹 목록 조회
   */
  async getUserGroups(userId: string) {
    const cacheKey = `user-groups:${userId}`;
    const cached = await this.cacheService.getUserCache(userId, cacheKey);
    if (cached) {
      return cached;
    }

    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            _count: {
              select: { members: { where: { status: 'ACTIVE' } } },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const groups = memberships.map((membership) => ({
      ...membership.group,
      memberCount: membership.group._count.members,
      userRole: membership.role,
      joinedAt: membership.joinedAt,
    }));

    // 캐시 저장 (10분)
    await this.cacheService.setUserCache(userId, cacheKey, groups, 600);

    return groups;
  }

  /**
   * 가입 대기 중인 요청 목록 조회
   */
  async getPendingJoinRequests(groupId: string, adminUserId: string) {
    // 권한 확인
    await this.checkAdminPermission(groupId, adminUserId);

    const pendingMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return pendingMembers;
  }

  /**
   * 가입 요청 승인/거절
   */
  async handleJoinRequest(
    groupId: string,
    requestUserId: string,
    adminUserId: string,
    data: ApproveJoinRequestDto,
  ) {
    // 권한 확인
    await this.checkAdminPermission(groupId, adminUserId);

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: requestUserId,
          groupId,
        },
      },
    });

    if (!membership || membership.status !== 'PENDING') {
      throw new HttpException(
        '가입 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (data.action === 'APPROVE') {
      await this.prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: requestUserId,
            groupId,
          },
        },
        data: {
          status: 'ACTIVE',
        },
      });

      // TODO: 승인 알림 전송
    } else {
      await this.prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId: requestUserId,
            groupId,
          },
        },
      });

      // TODO: 거절 알림 전송 (선택적)
    }

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(requestUserId);
  }

  /**
   * 그룹 통계 조회
   */
  async getGroupStats(groupId: string) {
    const [memberCount, maleCount, femaleCount, matchCount, messageCount] =
      await Promise.all([
        this.prisma.groupMember.count({
          where: { groupId, status: 'ACTIVE' },
        }),
        this.prisma.groupMember.count({
          where: {
            groupId,
            status: 'ACTIVE',
            user: { gender: 'MALE' },
          },
        }),
        this.prisma.groupMember.count({
          where: {
            groupId,
            status: 'ACTIVE',
            user: { gender: 'FEMALE' },
          },
        }),
        this.prisma.match.count({
          where: { groupId, status: 'ACTIVE' },
        }),
        this.prisma.chatMessage.count({
          where: {
            match: { groupId },
          },
        }),
      ]);

    return {
      memberCount,
      genderRatio: {
        male: memberCount > 0 ? (maleCount / memberCount) * 100 : 0,
        female: memberCount > 0 ? (femaleCount / memberCount) * 100 : 0,
      },
      matchCount,
      messageCount,
      isMatchingEnabled: memberCount >= 10, // minimum members for matching
    };
  }

  /**
   * 그룹 초대 목록 조회
   */
  async getGroupInvites(groupId: string, adminUserId: string) {
    // 권한 확인
    await this.checkAdminPermission(groupId, adminUserId);

    const invites = await this.prisma.groupInvite.findMany({
      where: {
        groupId,
        expiresAt: { gt: new Date() },
      },
      include: {
        createdBy: {
          select: { id: true, nickname: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      inviteCode: invite.inviteCode,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      uses: invite.uses,
      maxUses: invite.maxUses,
      link: `glimpse://group/invite/${invite.inviteCode}`,
    }));
  }

  /**
   * 초대 취소
   */
  async revokeInvite(inviteId: string, adminUserId: string) {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { id: inviteId },
      include: { group: true },
    });

    if (!invite) {
      throw new HttpException('초대를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // 권한 확인
    await this.checkAdminPermission(invite.groupId, adminUserId);

    await this.prisma.groupInvite.delete({
      where: { id: inviteId },
    });

    return { success: true };
  }
}
