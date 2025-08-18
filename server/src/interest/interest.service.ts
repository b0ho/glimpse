import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EncryptionService } from '../core/encryption/encryption.service';
import { NotificationService } from '../notification/notification.service';
import { 
  CreateInterestSearchDto, 
  UpdateInterestSearchDto, 
  GetInterestSearchesQueryDto,
  CheckMatchDto,
  InterestSearchResponseDto,
  InterestMatchResponseDto 
} from './dto/interest.dto';
import { InterestType, SearchStatus, Prisma } from '@prisma/client';
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
        value: this.normalizeValue(dto.type, dto.value),
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

    if (activeSearchCount >= maxSearchesPerType) {
      const message = premiumLevel === 'FREE'
        ? `무료 사용자는 ${dto.type} 유형으로 최대 ${maxSearchesPerType}개까지만 등록 가능합니다. 프리미엄 업그레이드를 통해 더 많은 관심상대를 등록하세요.`
        : `현재 프리미엄 레벨에서는 ${dto.type} 유형으로 최대 ${maxSearchesPerType}개까지만 등록 가능합니다.`;
      throw new BadRequestException(message);
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
    const encryptedValue = this.shouldEncrypt(dto.type) 
      ? await this.encryptionService.encrypt(dto.value)
      : dto.value;

    // 검색 등록
    const interestSearch = await this.prisma.interestSearch.create({
      data: {
        userId,
        type: dto.type,
        value: this.normalizeValue(dto.type, encryptedValue),
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

    return Promise.all(searches.map(search => this.formatInterestSearchResponse(search)));
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

    return matches.map(match => ({
      searchId: match.id,
      matchedSearchId: '', // 상대방 검색 ID는 프라이버시를 위해 숨김
      matchedUserId: match.matchedWithId!,
      matchedUser: {
        nickname: match.matchedWith!.nickname!,
        profileImage: match.matchedWith!.profileImage || undefined,
      },
      matchType: match.type,
      matchValue: this.shouldEncrypt(match.type) ? '***' : match.value,
      matchedAt: match.matchedAt!,
    }));
  }

  /**
   * 즉시 매칭 확인
   */
  async checkMatch(userId: string, dto: CheckMatchDto): Promise<InterestMatchResponseDto | null> {
    const normalizedValue = this.normalizeValue(dto.type, dto.value);
    
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
      matchValue: this.shouldEncrypt(dto.type) ? '***' : normalizedValue,
      matchedAt: new Date(),
    };
  }

  /**
   * 매칭 확인 (내부 메서드)
   */
  private async checkForMatches(search: any): Promise<void> {
    const normalizedValue = search.value;

    // 같은 타입, 같은 값으로 검색하는 다른 사용자 찾기
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
  }

  /**
   * 양방향 매칭 확인
   */
  private async isBidirectionalMatch(search1: any, search2: any): Promise<boolean> {
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
            type: 'INTEREST',
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
  private normalizeValue(type: InterestType, value: string): string {
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
      default:
        return value.trim();
    }
  }

  /**
   * 암호화 필요 여부 확인
   */
  private shouldEncrypt(type: InterestType): boolean {
    return type === InterestType.PHONE || type === InterestType.EMAIL;
  }

  /**
   * 응답 포맷팅
   */
  private async formatInterestSearchResponse(search: any): Promise<InterestSearchResponseDto> {
    let displayValue = search.value;
    
    // 암호화된 값 복호화 (단, 표시용으로는 마스킹)
    if (this.shouldEncrypt(search.type)) {
      try {
        const decrypted = await this.encryptionService.decrypt(search.value);
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
      matchedUser: search.matchedWith ? {
        nickname: search.matchedWith.nickname,
        profileImage: search.matchedWith.profileImage,
      } : undefined,
    };
  }

  /**
   * 민감한 값 마스킹
   */
  private maskSensitiveValue(type: InterestType, value: string): string {
    switch (type) {
      case InterestType.PHONE:
        // 010-****-5678 형태로 마스킹
        if (value.length >= 10) {
          return `${value.slice(0, 3)}-****-${value.slice(-4)}`;
        }
        return '***';
      case InterestType.EMAIL:
        // u***@example.com 형태로 마스킹
        const [local, domain] = value.split('@');
        if (local && domain) {
          return `${local[0]}***@${domain}`;
        }
        return '***';
      default:
        return value;
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