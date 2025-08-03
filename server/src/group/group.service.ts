import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { GroupType, Group, Prisma } from '@prisma/client';
// TODO: Import from shared when available
const GROUP_CONFIG = {
  MAX_MEMBERS: {
    OFFICIAL: 1000,
    CREATED: 100,
    INSTANCE: 50,
    LOCATION: 200,
  },
  MIN_MEMBERS_FOR_MATCHING: 10,
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * 그룹 서비스
 * 
 * 그룹 생성, 관리, 멤버십 처리를 담당합니다.
 */
@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

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
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    const userMembership = group.members.find(member => member.userId === userId);

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
    const maxMembers = GROUP_CONFIG.MAX_MEMBERS[type];

    // 위치 기반 그룹 검증
    if (type === 'LOCATION' && !location) {
      throw new BadRequestException('위치 기반 그룹은 위치 정보가 필요합니다.');
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
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 최대 멤버 수 확인
    if (group.maxMembers && group._count.members >= group.maxMembers) {
      throw new BadRequestException('그룹의 최대 인원을 초과했습니다.');
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
        throw new BadRequestException('이미 그룹에 가입되어 있습니다.');
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
      throw new NotFoundException('그룹 멤버십을 찾을 수 없습니다.');
    }

    if (membership.role === 'CREATOR') {
      throw new BadRequestException('그룹 생성자는 그룹을 탈퇴할 수 없습니다.');
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
      throw new BadRequestException('유효하지 않은 초대 코드입니다.');
    }

    const group = invite.group;

    if (!group) {
      throw new BadRequestException('유효하지 않은 초대 코드입니다.');
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
      throw new ForbiddenException('그룹 멤버가 아닙니다.');
    }

    if (membership.role !== 'CREATOR' && membership.role !== 'ADMIN') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
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
    const minMembers = GROUP_CONFIG.MIN_MEMBERS_FOR_MATCHING;

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
}
