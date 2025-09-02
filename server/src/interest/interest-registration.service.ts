/**
 * 통합 관심 등록 서비스
 * 내 정보 등록과 찾는 정보 등록을 통합 관리
 * 모든 개인정보는 암호화하여 저장
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// Prisma service will be injected via constructor
// import { PrismaService } from '../prisma/prisma.service';
import { InterestType, SearchStatus, RelationshipIntent } from '@prisma/client';
import {
  encryptPersonalData,
  decryptPersonalData,
  generateHash,
  maskValue,
  generateCompositeHash,
  PersonalData,
} from '../utils/encryption';

// 등록 유형
export enum RegistrationType {
  MY_INFO = 'MY_INFO',
  LOOKING_FOR = 'LOOKING_FOR',
}

// 매칭 상태
export enum MatchPairStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHATTING = 'CHATTING',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

// 등록 DTO
export interface RegisterInterestDto {
  registrationType: RegistrationType;
  type: InterestType;
  relationshipIntent: RelationshipIntent;
  personalData: PersonalData;
  deviceId?: string;
}

// 매칭 결과 DTO
export interface MatchResultDto {
  matchId: string;
  matchedUserId: string;
  matchedUserNickname?: string;
  matchType: InterestType;
  matchScore: number;
  status: MatchPairStatus;
  matchedAt: Date;
}

@Injectable()
export class InterestRegistrationService {
  constructor(private prisma: any) {} // PrismaService type

  /**
   * 관심 등록 (내 정보 또는 찾는 정보)
   */
  async registerInterest(
    userId: string,
    dto: RegisterInterestDto
  ): Promise<any> {
    const { registrationType, type, relationshipIntent, personalData, deviceId } = dto;

    // 1. 주요 값 추출 및 해시 생성
    const primaryValue = this.extractPrimaryValue(type, personalData);
    if (!primaryValue) {
      throw new BadRequestException('주요 값이 필요합니다');
    }

    const primaryHash = generateHash(type, primaryValue);
    
    // 2. 보조 해시 생성 (복합 조건용)
    let secondaryHash: string | undefined;
    let tertiaryHash: string | undefined;
    
    if (type === 'COMPANY' && personalData.department) {
      secondaryHash = generateHash('DEPARTMENT', personalData.department);
    }
    if (type === 'SCHOOL' && personalData.major) {
      secondaryHash = generateHash('MAJOR', personalData.major);
    }

    // 3. 개인정보 암호화
    const { encrypted, iv, tag } = encryptPersonalData(personalData);

    // 4. 중복 확인
    const existing = await this.prisma.interestRegistration.findUnique({
      where: {
        userId_type_primaryHash_registrationType: {
          userId,
          type,
          primaryHash,
          registrationType,
        },
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('이미 등록된 정보입니다');
    }

    // 5. 등록 생성
    const registration = await this.prisma.interestRegistration.create({
      data: {
        userId,
        registrationType,
        type,
        status: 'ACTIVE',
        relationshipIntent,
        primaryHash,
        secondaryHash,
        tertiaryHash,
        encryptedData: encrypted,
        encryptedIV: iv,
        encryptedTag: tag,
        displayValue: maskValue(type, primaryValue),
        // 검색용 비식별 정보
        ...this.extractSearchableData(type, personalData),
        deviceId: deviceId ? generateHash('DEVICE', deviceId) : undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        cooldownEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 쿨다운
      },
    });

    // 6. 즉시 매칭 확인
    const matches = await this.findMatches(registration);
    
    // 7. 매칭 발생 시 MatchedPair 생성
    const createdMatches = [];
    for (const match of matches) {
      const matchedPair = await this.createMatchedPair(registration, match);
      if (matchedPair) {
        createdMatches.push(matchedPair);
      }
    }

    return {
      registration: {
        id: registration.id,
        type: registration.type,
        displayValue: registration.displayValue,
        status: registration.status,
        expiresAt: registration.expiresAt,
        registrationType: registration.registrationType,
      },
      matches: createdMatches.length,
      message: createdMatches.length > 0 
        ? `${createdMatches.length}건의 매칭이 발견되었습니다!` 
        : '등록이 완료되었습니다',
    };
  }

  /**
   * 매칭 찾기
   */
  private async findMatches(registration: any): Promise<any[]> {
    // 반대 유형 찾기 (MY_INFO <-> LOOKING_FOR)
    const oppositeType = registration.registrationType === 'MY_INFO' 
      ? 'LOOKING_FOR' 
      : 'MY_INFO';

    // 같은 해시값을 가진 반대 유형 검색
    const matches = await this.prisma.interestRegistration.findMany({
      where: {
        registrationType: oppositeType,
        type: registration.type,
        primaryHash: registration.primaryHash,
        secondaryHash: registration.secondaryHash || undefined,
        status: 'ACTIVE',
        userId: { not: registration.userId }, // 자기 자신 제외
        relationshipIntent: registration.relationshipIntent, // 같은 관계 의도
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

    return matches;
  }

  /**
   * 매칭 페어 생성
   */
  private async createMatchedPair(
    registration1: any,
    registration2: any
  ): Promise<MatchResultDto | null> {
    try {
      // 중복 매칭 방지
      const existing = await this.prisma.matchedPair.findFirst({
        where: {
          OR: [
            {
              registration1Id: registration1.id,
              registration2Id: registration2.id,
            },
            {
              registration1Id: registration2.id,
              registration2Id: registration1.id,
            },
          ],
        },
      });

      if (existing) {
        return null;
      }

      // 매칭 페어 생성
      const matchedPair = await this.prisma.matchedPair.create({
        data: {
          registration1Id: registration1.registrationType === 'LOOKING_FOR' 
            ? registration1.id 
            : registration2.id,
          registration2Id: registration1.registrationType === 'MY_INFO' 
            ? registration1.id 
            : registration2.id,
          user1Id: registration1.registrationType === 'LOOKING_FOR' 
            ? registration1.userId 
            : registration2.userId,
          user2Id: registration1.registrationType === 'MY_INFO' 
            ? registration1.userId 
            : registration2.userId,
          matchType: registration1.type,
          matchScore: 100, // 기본 점수
          status: 'PENDING',
          matchMethod: 'auto',
        },
      });

      // 알림 발송 (비동기)
      this.sendMatchNotification(matchedPair).catch(console.error);

      return {
        matchId: matchedPair.id,
        matchedUserId: registration2.userId,
        matchedUserNickname: registration2.user?.nickname,
        matchType: matchedPair.matchType,
        matchScore: matchedPair.matchScore,
        status: matchedPair.status as MatchPairStatus,
        matchedAt: matchedPair.matchedAt,
      };
    } catch (error) {
      console.error('Failed to create matched pair:', error);
      return null;
    }
  }

  /**
   * 내 등록 목록 조회
   */
  async getMyRegistrations(
    userId: string,
    registrationType?: RegistrationType
  ): Promise<any[]> {
    const registrations = await this.prisma.interestRegistration.findMany({
      where: {
        userId,
        registrationType: registrationType || undefined,
        status: { in: ['ACTIVE', 'MATCHED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 복호화하여 반환
    return registrations.map((reg: any) => {
      try {
        // 개인정보 복호화 (본인 것만)
        const decrypted = decryptPersonalData(
          reg.encryptedData,
          reg.encryptedIV,
          reg.encryptedTag
        );

        return {
          id: reg.id,
          type: reg.type,
          registrationType: reg.registrationType,
          displayValue: reg.displayValue,
          personalData: decrypted, // 본인 데이터는 복호화하여 제공
          status: reg.status,
          relationshipIntent: reg.relationshipIntent,
          expiresAt: reg.expiresAt,
          cooldownEndsAt: reg.cooldownEndsAt,
          createdAt: reg.createdAt,
        };
      } catch (error) {
        // 복호화 실패 시 마스킹된 정보만 제공
        return {
          id: reg.id,
          type: reg.type,
          registrationType: reg.registrationType,
          displayValue: reg.displayValue,
          status: reg.status,
          relationshipIntent: reg.relationshipIntent,
          expiresAt: reg.expiresAt,
          createdAt: reg.createdAt,
        };
      }
    });
  }

  /**
   * 매칭 목록 조회
   */
  async getMyMatches(userId: string): Promise<MatchResultDto[]> {
    const matches = await this.prisma.matchedPair.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
        status: { not: 'REJECTED' },
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        registration1: true,
        registration2: true,
      },
      orderBy: { matchedAt: 'desc' },
    });

    return matches.map((match: any) => {
      const isUser1 = match.user1Id === userId;
      const matchedUser = isUser1 ? match.user2 : match.user1;

      return {
        matchId: match.id,
        matchedUserId: matchedUser.id,
        matchedUserNickname: matchedUser.nickname,
        matchType: match.matchType,
        matchScore: match.matchScore,
        status: match.status as MatchPairStatus,
        matchedAt: match.matchedAt,
      };
    });
  }

  /**
   * 매칭 확인/수락
   */
  async confirmMatch(userId: string, matchId: string): Promise<any> {
    const match = await this.prisma.matchedPair.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('매칭을 찾을 수 없습니다');
    }

    // 권한 확인
    const isUser1 = match.user1Id === userId;
    const isUser2 = match.user2Id === userId;
    
    if (!isUser1 && !isUser2) {
      throw new BadRequestException('권한이 없습니다');
    }

    // 확인 상태 업데이트
    const updateData: any = {};
    if (isUser1) {
      updateData.user1Confirmed = true;
    }
    if (isUser2) {
      updateData.user2Confirmed = true;
    }

    // 양쪽 모두 확인한 경우 상태 변경
    const updatedMatch = await this.prisma.matchedPair.update({
      where: { id: matchId },
      data: {
        ...updateData,
        status: (match.user1Confirmed || isUser1) && (match.user2Confirmed || isUser2) 
          ? 'CONFIRMED' 
          : match.status,
        confirmedAt: (match.user1Confirmed || isUser1) && (match.user2Confirmed || isUser2)
          ? new Date()
          : undefined,
      },
    });

    // 양쪽 확인 완료 시 채팅방 생성
    if (updatedMatch.status === 'CONFIRMED' && !updatedMatch.chatRoomId) {
      // TODO: 채팅방 생성 로직
      // const chatRoom = await this.createChatRoom(updatedMatch);
    }

    return updatedMatch;
  }

  /**
   * 주요 값 추출
   */
  private extractPrimaryValue(type: InterestType, data: PersonalData): string | null {
    switch (type) {
      case 'PHONE': return data.phoneNumber || null;
      case 'EMAIL': return data.email || null;
      case 'SOCIAL_ID': return data.socialId || null;
      case 'BIRTHDATE': return data.birthdate || null;
      case 'NICKNAME': return data.nickname || null;
      case 'COMPANY': return data.companyName || data.companyEmail || null;
      case 'SCHOOL': return data.schoolName || null;
      case 'PART_TIME_JOB': return data.partTimePlace || null;
      case 'PLATFORM': return data.platformId || null;
      case 'GAME_ID': return data.gamerId || null;
      default: return null;
    }
  }

  /**
   * 검색 가능한 비식별 데이터 추출
   */
  private extractSearchableData(type: InterestType, data: PersonalData): any {
    const result: any = {};

    switch (type) {
      case 'PHONE':
        if (data.phoneNumber) {
          const digits = data.phoneNumber.replace(/\D/g, '');
          result.phoneCountryCode = '+82';
          result.phoneLastDigits = digits.slice(-4);
        }
        break;

      case 'EMAIL':
        if (data.email) {
          const [local, domain] = data.email.split('@');
          result.emailDomain = domain;
          result.emailFirstChar = local?.[0];
        }
        break;

      case 'SOCIAL_ID':
        result.socialPlatform = data.socialPlatform;
        break;

      case 'BIRTHDATE':
        if (data.birthdate) {
          const year = parseInt(data.birthdate.slice(0, 4));
          result.birthYear = year;
          const age = new Date().getFullYear() - year;
          result.ageRange = `${Math.floor(age / 10) * 10}대`;
        }
        break;

      case 'COMPANY':
        result.companyDomain = data.companyEmail?.split('@')[1];
        break;

      case 'SCHOOL':
        result.schoolName = data.schoolName;
        break;

      case 'PART_TIME_JOB':
        result.partTimeCategory = this.categorizePartTime(data.partTimePlace);
        break;

      case 'PLATFORM':
        result.platformName = data.socialPlatform;
        break;

      case 'GAME_ID':
        result.gameTitle = data.additionalInfo?.gameTitle;
        break;
    }

    return result;
  }

  /**
   * 알바 카테고리 분류
   */
  private categorizePartTime(place?: string): string | undefined {
    if (!place) return undefined;
    
    if (place.includes('카페') || place.includes('커피')) return '카페';
    if (place.includes('편의점') || place.includes('GS') || place.includes('CU')) return '편의점';
    if (place.includes('음식') || place.includes('식당')) return '음식점';
    if (place.includes('마트') || place.includes('백화점')) return '유통';
    
    return '기타';
  }

  /**
   * 매칭 알림 발송
   */
  private async sendMatchNotification(matchedPair: any): Promise<void> {
    // TODO: FCM 알림 발송 구현
    console.log('Sending match notification for:', matchedPair.id);
  }
}