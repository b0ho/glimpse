import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EncryptionService } from '../core/encryption/encryption.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateInterestSearchDto,
  UpdateInterestSearchDto,
  GetInterestSearchesQueryDto,
  CheckMatchDto,
  InterestSearchResponseDto,
  InterestMatchResponseDto,
} from './dto/interest.dto';
import { SearchStatus, Prisma } from '@prisma/client';

// InterestType enum 정의 (Prisma 스키마와 동기화)
enum InterestType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL_ID = 'SOCIAL_ID',
  NAME = 'NAME',
  GROUP = 'GROUP',
  LOCATION = 'LOCATION',
  NICKNAME = 'NICKNAME',
  COMPANY = 'COMPANY',
  SCHOOL = 'SCHOOL',
  HOBBY = 'HOBBY',
  PLATFORM = 'PLATFORM',  // 기타 플랫폼 (Discord, Slack 등)
  GAME_ID = 'GAME_ID',    // 게임 아이디
}
import * as crypto from 'crypto';

@Injectable()
export class InterestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 관심상대 검색 등록
   */
  async createInterestSearch(
    userId: string,
    dto: CreateInterestSearchDto,
  ): Promise<InterestSearchResponseDto> {
    // 유저 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 중복 검색 확인
    const existingSearch = await this.prisma.interestSearch.findFirst({
      where: {
        userId,
        type: dto.type,
        value: this.normalizeValue(dto.type as any, dto.value),
        status: SearchStatus.ACTIVE,
      },
    });

    if (existingSearch) {
      throw new BadRequestException('이미 동일한 검색이 등록되어 있습니다');
    }

    // 프리미엄 레벨별 유형당 등록 제한 확인
    const activeSearchCount = await this.prisma.interestSearch.count({
      where: {
        userId,
        type: dto.type,
        status: SearchStatus.ACTIVE,
      },
    });

    // 프리미엄 레벨에 따른 제한
    const premiumLevel = (user as any).premiumLevel || 'FREE';
    let maxSearchesPerType: number;
    let expirationDays: number | null;

    switch (premiumLevel) {
      case 'UPPER':
        maxSearchesPerType = 999; // 무제한
        expirationDays = null; // 무제한
        break;
      case 'BASIC':
        maxSearchesPerType = 3;
        expirationDays = 30;
        break;
      case 'FREE':
      default:
        maxSearchesPerType = 1;
        expirationDays = 7;
        break;
    }

    // 프리미엄 레벨별 제한 검사
    if (activeSearchCount >= maxSearchesPerType) {
      const message =
        premiumLevel === 'FREE'
          ? `무료 사용자는 ${dto.type} 유형으로 최대 ${maxSearchesPerType}개까지만 등록 가능합니다. 프리미엄 업그레이드를 통해 더 많은 관심상대를 등록하세요.`
          : `현재 프리미엄 레벨에서는 ${dto.type} 유형으로 최대 ${maxSearchesPerType}개까지만 등록 가능합니다.`;
      throw new BadRequestException(message);
    }
    
    // FREE 계정은 최대 3개 유형까지만 등록 가능
    if (premiumLevel === 'FREE') {
      const uniqueTypes = await this.prisma.interestSearch.findMany({
        where: {
          userId,
          status: SearchStatus.ACTIVE,
        },
        select: {
          type: true,
        },
        distinct: ['type'],
      });
      
      const hasCurrentType = uniqueTypes.some(search => search.type === dto.type);
      
      if (uniqueTypes.length >= 3 && !hasCurrentType) {
        throw new BadRequestException(
          '무료 사용자는 최대 3개 유형까지만 등록 가능합니다. 프리미엄 업그레이드를 통해 더 많은 유형을 등록하세요.'
        );
      }
    }

    // 유효기간 설정
    let expiresAt: Date | null = null;
    if (expirationDays && !dto.expiresAt) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
    } else if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
    }

    // 민감 정보 암호화
    const encryptedValue = this.shouldEncrypt(dto.type as any)
      ? this.encryptionService.encrypt(dto.value)
      : dto.value;

    // 검색 등록
    const interestSearch = await this.prisma.interestSearch.create({
      data: {
        userId,
        type: dto.type,
        value: this.normalizeValue(dto.type as any, encryptedValue),
        metadata: dto.metadata,
        expiresAt,
        status: SearchStatus.ACTIVE,
      },
      include: {
        matchedWith: {
          select: {
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    // 즉시 매칭 확인
    await this.checkForMatches(interestSearch);

    return this.formatInterestSearchResponse(interestSearch);
  }

  /**
   * 내 관심상대 검색 목록 조회
   */
  async getMyInterestSearches(
    userId: string,
    query: GetInterestSearchesQueryDto,
  ): Promise<InterestSearchResponseDto[]> {
    const where: Prisma.InterestSearchWhereInput = {
      userId,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };

    const searches = await this.prisma.interestSearch.findMany({
      where,
      include: {
        matchedWith: {
          select: {
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      searches.map((search) => this.formatInterestSearchResponse(search)),
    );
  }

  /**
   * 관심상대 검색 업데이트
   */
  async updateInterestSearch(
    userId: string,
    searchId: string,
    dto: UpdateInterestSearchDto,
  ): Promise<InterestSearchResponseDto> {
    const search = await this.prisma.interestSearch.findUnique({
      where: { id: searchId },
    });

    if (!search) {
      throw new NotFoundException('검색을 찾을 수 없습니다');
    }

    if (search.userId !== userId) {
      throw new ForbiddenException('권한이 없습니다');
    }

    const updated = await this.prisma.interestSearch.update({
      where: { id: searchId },
      data: {
        status: dto.status,
        metadata: dto.metadata,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        matchedWith: {
          select: {
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return this.formatInterestSearchResponse(updated);
  }

  /**
   * 관심상대 검색 삭제
   */
  async deleteInterestSearch(userId: string, searchId: string): Promise<void> {
    const search = await this.prisma.interestSearch.findUnique({
      where: { id: searchId },
    });

    if (!search) {
      throw new NotFoundException('검색을 찾을 수 없습니다');
    }

    if (search.userId !== userId) {
      throw new ForbiddenException('권한이 없습니다');
    }

    await this.prisma.interestSearch.delete({
      where: { id: searchId },
    });
  }

  /**
   * 매칭된 목록 조회
   */
  async getMatches(userId: string): Promise<InterestMatchResponseDto[]> {
    const matches = await this.prisma.interestSearch.findMany({
      where: {
        userId,
        status: SearchStatus.MATCHED,
        matchedWithId: { not: null },
      },
      include: {
        matchedWith: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    });

    return matches.map((match) => ({
      searchId: match.id,
      matchedSearchId: '', // 상대방 검색 ID는 프라이버시를 위해 숨김
      matchedUserId: match.matchedWithId!,
      matchedUser: {
        nickname: match.matchedWith!.nickname!,
        profileImage: match.matchedWith!.profileImage || undefined,
      },
      matchType: match.type,
      matchValue: this.shouldEncrypt(match.type as any) ? '***' : match.value,
      matchedAt: match.matchedAt!,
    }));
  }

  /**
   * 즉시 매칭 확인
   */
  async checkMatch(
    userId: string,
    dto: CheckMatchDto,
  ): Promise<InterestMatchResponseDto | null> {
    const normalizedValue = this.normalizeValue(dto.type as any, dto.value);

    // 양방향 매칭 확인
    const potentialMatch = await this.prisma.interestSearch.findFirst({
      where: {
        type: dto.type,
        value: normalizedValue,
        status: SearchStatus.ACTIVE,
        userId: { not: userId },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    if (!potentialMatch) {
      return null;
    }

    // 역방향 검색 확인
    const reverseSearch = await this.prisma.interestSearch.findFirst({
      where: {
        userId,
        type: dto.type,
        value: normalizedValue,
        status: SearchStatus.ACTIVE,
      },
    });

    if (!reverseSearch) {
      return null;
    }

    // 매칭 처리
    await this.createMatch(reverseSearch, potentialMatch);

    return {
      searchId: reverseSearch.id,
      matchedSearchId: potentialMatch.id,
      matchedUserId: potentialMatch.userId,
      matchedUser: {
        nickname: potentialMatch.user.nickname!,
        profileImage: potentialMatch.user.profileImage || undefined,
      },
      matchType: dto.type,
      matchValue: this.shouldEncrypt(dto.type as any) ? '***' : normalizedValue,
      matchedAt: new Date(),
    };
  }

  /**
   * 매칭 확인 (내부 메서드)
   */
  private async checkForMatches(search: any): Promise<void> {
    const normalizedValue = search.value;

    // 타입별 특수 매칭 로직
    switch (search.type) {
      case InterestType.NAME:
        // 이름 매칭 - 생일 정보도 함께 고려
        await this.checkNameMatches(search);
        break;

      case InterestType.COMPANY:
        // 회사 매칭 - 직원 이름, 부서 정보 고려
        await this.checkCompanyMatches(search);
        break;

      case InterestType.SCHOOL:
        // 학교 매칭 - 학생 이름, 학과 정보 고려
        await this.checkSchoolMatches(search);
        break;

      case InterestType.GROUP:
        // 그룹 매칭 - 그룹 멤버십 확인
        await this.checkGroupMatches(search);
        break;

      case InterestType.LOCATION:
        // 장소 매칭 - 위치 정보 확인
        await this.checkLocationMatches(search);
        break;

      case InterestType.NICKNAME:
        // 닉네임 매칭 - 부분 일치 지원
        await this.checkNicknameMatches(search);
        break;

      case InterestType.HOBBY:
        // 취미/관심사 매칭
        await this.checkHobbyMatches(search);
        break;

      default:
        // 기본 매칭 (PHONE, EMAIL, SOCIAL_ID)
        const potentialMatches = await this.prisma.interestSearch.findMany({
          where: {
            type: search.type,
            value: normalizedValue,
            status: SearchStatus.ACTIVE,
            userId: { not: search.userId },
          },
          include: {
            user: true,
          },
        });

        for (const potentialMatch of potentialMatches) {
          // 양방향 매칭 확인
          if (await this.isBidirectionalMatch(search, potentialMatch)) {
            await this.createMatch(search, potentialMatch);
          }
        }
        break;
    }
  }

  /**
   * 양방향 매칭 확인
   */
  private async isBidirectionalMatch(
    search1: any,
    search2: any,
  ): Promise<boolean> {
    // 기본적으로 같은 타입, 같은 값이면 매칭
    if (search1.type === search2.type && search1.value === search2.value) {
      return true;
    }

    // 추가 매칭 로직 (예: 그룹 내 상호 관심)
    if (search1.type === InterestType.GROUP) {
      const group1Members = await this.prisma.groupMember.findFirst({
        where: {
          userId: search1.userId,
          groupId: search1.value,
        },
      });

      const group2Members = await this.prisma.groupMember.findFirst({
        where: {
          userId: search2.userId,
          groupId: search1.value,
        },
      });

      return !!(group1Members && group2Members);
    }

    return false;
  }

  /**
   * 매칭 생성
   */
  private async createMatch(search1: any, search2: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 양쪽 검색 상태 업데이트
      await tx.interestSearch.update({
        where: { id: search1.id },
        data: {
          status: SearchStatus.MATCHED,
          matchedWithId: search2.userId,
          matchedAt: new Date(),
        },
      });

      await tx.interestSearch.update({
        where: { id: search2.id },
        data: {
          status: SearchStatus.MATCHED,
          matchedWithId: search1.userId,
          matchedAt: new Date(),
        },
      });

      // Match 테이블에도 기록 (기존 매칭 시스템과 호환)
      const existingMatch = await tx.match.findFirst({
        where: {
          OR: [
            { user1Id: search1.userId, user2Id: search2.userId },
            { user1Id: search2.userId, user2Id: search1.userId },
          ],
        },
      });

      if (!existingMatch) {
        await tx.match.create({
          data: {
            user1Id: search1.userId,
            user2Id: search2.userId,
            groupId: 'interest-search', // 특별한 그룹 ID
            interestType: 'GROUP',
            relationshipIntent: 'FRIEND',
            status: 'ACTIVE',
          },
        });
      }

      // 알림 전송
      await this.notificationService.sendNotification({
        userId: search1.userId,
        type: 'INTEREST_MATCH',
        content: '등록하신 조건과 일치하는 상대를 찾았습니다',
        data: {
          matchId: search2.id,
        },
      });

      await this.notificationService.sendNotification({
        userId: search2.userId,
        type: 'INTEREST_MATCH',
        content: '등록하신 조건과 일치하는 상대를 찾았습니다',
        data: {
          matchId: search1.id,
        },
      });
    });
  }

  /**
   * 값 정규화
   */
  private normalizeValue(type: InterestType | string, value: string): string {
    switch (type) {
      case InterestType.PHONE:
        // 전화번호 정규화 (하이픈 제거, 국가 코드 처리)
        return value.replace(/[-\s]/g, '').replace(/^\+82/, '0');
      case InterestType.EMAIL:
        // 이메일 소문자 변환
        return value.toLowerCase().trim();
      case InterestType.SOCIAL_ID:
        // 소셜 ID 정규화
        return value.toLowerCase().trim().replace('@', '');
      case InterestType.NAME:
        // 이름 정규화 (공백 제거)
        return value.replace(/\s+/g, '').trim();
      case InterestType.COMPANY:
      case InterestType.SCHOOL:
        // 회사/학교명 정규화
        return value.replace(/\s+/g, ' ').trim().toLowerCase();
      case InterestType.NICKNAME:
        // 닉네임 정규화
        return value.trim().toLowerCase();
      case InterestType.HOBBY:
        // 취미 정규화 (콤마로 구분, 공백 제거)
        return value
          .split(',')
          .map((h) => h.trim().toLowerCase())
          .join(',');
      default:
        return value.trim();
    }
  }

  /**
   * 암호화 필요 여부 확인
   */
  private shouldEncrypt(type: InterestType | string): boolean {
    return type === InterestType.PHONE || type === InterestType.EMAIL;
  }

  /**
   * 응답 포맷팅
   */
  private async formatInterestSearchResponse(
    search: any,
  ): Promise<InterestSearchResponseDto> {
    let displayValue = search.value;

    // 암호화된 값 복호화 (단, 표시용으로는 마스킹)
    if (this.shouldEncrypt(search.type)) {
      try {
        const decrypted = this.encryptionService.decrypt(search.value);
        displayValue = this.maskSensitiveValue(search.type, decrypted);
      } catch {
        displayValue = '***';
      }
    }

    return {
      id: search.id,
      type: search.type,
      value: displayValue,
      metadata: search.metadata,
      status: search.status,
      matchedWithId: search.matchedWithId,
      matchedAt: search.matchedAt,
      expiresAt: search.expiresAt,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
      matchedUser: search.matchedWith
        ? {
            nickname: search.matchedWith.nickname,
            profileImage: search.matchedWith.profileImage,
          }
        : undefined,
    };
  }

  /**
   * 민감한 값 마스킹
   */
  private maskSensitiveValue(
    type: InterestType | string,
    value: string,
  ): string {
    switch (type) {
      case InterestType.PHONE:
        // 010-****-5678 형태로 마스킹
        if (value.length >= 10) {
          return `${value.slice(0, 3)}-****-${value.slice(-4)}`;
        }
        return '***';
      case InterestType.EMAIL: {
        // u***@example.com 형태로 마스킹
        const [local, domain] = value.split('@');
        if (local && domain) {
          return `${local[0]}***@${domain}`;
        }
        return '***';
      }
      default:
        return value;
    }
  }

  /**
   * 이름 매칭 확인
   */
  private async checkNameMatches(search: any): Promise<void> {
    const whereCondition: any = {
      type: InterestType.NAME,
      value: search.value,
      status: SearchStatus.ACTIVE,
      userId: { not: search.userId },
    };

    // 생일 정보가 있으면 메타데이터에서도 확인
    if (search.metadata?.birthdate) {
      whereCondition.metadata = {
        path: ['birthdate'],
        equals: search.metadata.birthdate,
      };
    }

    const potentialMatches = await this.prisma.interestSearch.findMany({
      where: whereCondition,
      include: {
        user: true,
      },
    });

    for (const potentialMatch of potentialMatches) {
      await this.createMatch(search, potentialMatch);
    }
  }

  /**
   * 회사 매칭 확인
   */
  private async checkCompanyMatches(search: any): Promise<void> {
    const whereCondition: any = {
      type: InterestType.COMPANY,
      value: search.value, // 회사명
      status: SearchStatus.ACTIVE,
      userId: { not: search.userId },
    };

    // 추가 필터링 조건
    const potentialMatches = await this.prisma.interestSearch.findMany({
      where: whereCondition,
      include: {
        user: true,
      },
    });

    for (const potentialMatch of potentialMatches) {
      let shouldMatch = true;

      // metadata를 any 타입으로 캐스팅하여 타입 오류 회피
      const searchMeta = search.metadata;
      const matchMeta = potentialMatch.metadata as any;

      // 직원 이름 확인
      if (searchMeta?.employeeName && matchMeta?.employeeName) {
        if (searchMeta.employeeName !== matchMeta.employeeName) {
          shouldMatch = false;
        }
      }

      // 부서 확인
      if (searchMeta?.department && matchMeta?.department) {
        if (searchMeta.department !== matchMeta.department) {
          shouldMatch = false;
        }
      }

      // 생일 확인
      if (searchMeta?.birthdate && matchMeta?.birthdate) {
        if (searchMeta.birthdate !== matchMeta.birthdate) {
          shouldMatch = false;
        }
      }

      if (shouldMatch) {
        await this.createMatch(search, potentialMatch);
      }
    }
  }

  /**
   * 학교 매칭 확인
   */
  private async checkSchoolMatches(search: any): Promise<void> {
    const whereCondition: any = {
      type: InterestType.SCHOOL,
      value: search.value, // 학교명
      status: SearchStatus.ACTIVE,
      userId: { not: search.userId },
    };

    const potentialMatches = await this.prisma.interestSearch.findMany({
      where: whereCondition,
      include: {
        user: true,
      },
    });

    for (const potentialMatch of potentialMatches) {
      let shouldMatch = true;

      // metadata를 any 타입으로 캐스팅하여 타입 오류 회피
      const searchMeta = search.metadata;
      const matchMeta = potentialMatch.metadata as any;

      // 학생 이름 확인
      if (searchMeta?.studentName && matchMeta?.studentName) {
        if (searchMeta.studentName !== matchMeta.studentName) {
          shouldMatch = false;
        }
      }

      // 학과 확인
      if (searchMeta?.major && matchMeta?.major) {
        if (searchMeta.major !== matchMeta.major) {
          shouldMatch = false;
        }
      }

      // 생일 확인
      if (searchMeta?.birthdate && matchMeta?.birthdate) {
        if (searchMeta.birthdate !== matchMeta.birthdate) {
          shouldMatch = false;
        }
      }

      if (shouldMatch) {
        await this.createMatch(search, potentialMatch);
      }
    }
  }

  /**
   * 그룹 매칭 확인
   */
  private async checkGroupMatches(search: any): Promise<void> {
    // 같은 그룹에 속한 사용자들끼리 매칭
    const groupMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId: search.value,
        status: 'ACTIVE',
        userId: { not: search.userId },
      },
      include: {
        user: true,
      },
    });

    for (const member of groupMembers) {
      // 상대방도 그룹 기반 관심을 등록했는지 확인
      const reverseSearch = await this.prisma.interestSearch.findFirst({
        where: {
          userId: member.userId,
          type: InterestType.GROUP,
          value: search.value,
          status: SearchStatus.ACTIVE,
        },
      });

      if (reverseSearch) {
        await this.createMatch(search, reverseSearch);
      }
    }
  }

  /**
   * 위치 매칭 확인
   */
  private async checkLocationMatches(search: any): Promise<void> {
    // 위치 기반 매칭 - 같은 장소를 등록한 사용자들
    const potentialMatches = await this.prisma.interestSearch.findMany({
      where: {
        type: InterestType.LOCATION,
        value: search.value, // 장소명 또는 위치 코드
        status: SearchStatus.ACTIVE,
        userId: { not: search.userId },
      },
      include: {
        user: true,
      },
    });

    for (const potentialMatch of potentialMatches) {
      await this.createMatch(search, potentialMatch);
    }
  }


  /**
   * 닉네임 매칭 확인
   */
  private async checkNicknameMatches(search: any): Promise<void> {
    // 실제 사용자의 닉네임과 비교
    const users = await this.prisma.user.findMany({
      where: {
        nickname: {
          contains: search.value,
          mode: 'insensitive',
        },
        id: { not: search.userId },
      },
    });

    for (const user of users) {
      // 해당 사용자가 역으로 닉네임 검색을 등록했는지 확인
      const reverseSearch = await this.prisma.interestSearch.findFirst({
        where: {
          userId: user.id,
          type: InterestType.NICKNAME,
          status: SearchStatus.ACTIVE,
        },
      });

      if (reverseSearch) {
        // 역방향 검색의 닉네임도 현재 사용자와 일치하는지 확인
        const currentUser = await this.prisma.user.findUnique({
          where: { id: search.userId },
        });

        if (
          currentUser?.nickname
            ?.toLowerCase()
            .includes(reverseSearch.value.toLowerCase())
        ) {
          await this.createMatch(search, reverseSearch);
        }
      }
    }
  }

  /**
   * 취미/관심사 매칭 확인
   */
  private async checkHobbyMatches(search: any): Promise<void> {
    // 같은 취미/관심사를 등록한 사용자들
    const potentialMatches = await this.prisma.interestSearch.findMany({
      where: {
        type: InterestType.HOBBY,
        value: {
          contains: search.value,
          mode: 'insensitive',
        },
        status: SearchStatus.ACTIVE,
        userId: { not: search.userId },
      },
      include: {
        user: true,
      },
    });

    for (const potentialMatch of potentialMatches) {
      // 취미가 유사하면 매칭
      const searchHobbies = search.value
        .toLowerCase()
        .split(',')
        .map((h: string) => h.trim());
      const matchHobbies = potentialMatch.value
        .toLowerCase()
        .split(',')
        .map((h: string) => h.trim());

      const commonHobbies = searchHobbies.filter((hobby: string) =>
        matchHobbies.some((mh) => mh.includes(hobby) || hobby.includes(mh)),
      );

      // 공통 취미가 있으면 매칭
      if (commonHobbies.length > 0) {
        await this.createMatch(search, potentialMatch);
      }
    }
  }

  /**
   * 만료된 검색 정리 (크론 작업용)
   */
  async cleanupExpiredSearches(): Promise<void> {
    await this.prisma.interestSearch.updateMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        status: SearchStatus.ACTIVE,
      },
      data: {
        status: SearchStatus.EXPIRED,
      },
    });
  }
}
