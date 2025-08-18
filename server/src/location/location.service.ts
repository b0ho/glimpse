import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyUsersQueryDto } from './dto/nearby-users.dto';
import {
  CreateLocationGroupDto,
  JoinLocationGroupDto,
} from './dto/location-group.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * 위치 기반 서비스
 *
 * 사용자 위치 관리, 주변 사용자 검색, 위치 기반 그룹 등을 처리합니다.
 */
@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 사용자 위치 업데이트
   *
   * @param userId 사용자 ID
   * @param data 위치 데이터
   */
  async updateUserLocation(userId: string, data: UpdateLocationDto) {
    const { latitude, longitude, accuracy } = data;

    // 위치 정보를 user의 location 필드에 저장
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        location: JSON.stringify({ latitude, longitude, accuracy }),
        lastActive: new Date(),
      },
    });

    // 캐시에 저장 (5분간 유지)
    const cacheKey = `location:${userId}`;
    await this.cacheService.set(
      cacheKey,
      { latitude, longitude },
      { ttl: 300 },
    );

    // 위치 기반 그룹 자동 가입 체크
    await this.checkAndJoinNearbyGroups(userId, latitude, longitude);
  }

  /**
   * 주변 사용자 검색
   *
   * @param userId 요청 사용자 ID
   * @param query 검색 조건
   * @returns 주변 사용자 목록
   */
  async getNearbyUsers(userId: string, query: NearbyUsersQueryDto) {
    const { radius = 5, limit = 20, offset = 0 } = query;

    // 현재 사용자 위치 가져오기
    const userLocation = await this.getUserLocation(userId);
    if (!userLocation) {
      throw new BadRequestException(
        '위치 정보가 없습니다. 먼저 위치를 업데이트해주세요.',
      );
    }

    // 위치 정보가 있는 사용자들 조회
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        deletedAt: null,
        location: { not: null },
        lastActive: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // 30분 이내 활동
        },
      },
      select: {
        id: true,
        nickname: true,
        age: true,
        gender: true,
        profileImage: true,
        bio: true,
        isVerified: true,
        isPremium: true,
        location: true,
        lastActive: true,
        locationProfileMode: true,
        personaProfile: true,
        groupMemberships: {
          where: { status: 'ACTIVE' },
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // 거리 계산 및 필터링
    const nearbyUsers = users
      .map((user) => {
        const location = user.location ? JSON.parse(user.location) : null;
        if (!location?.latitude || !location?.longitude) return null;

        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude,
        );

        if (distance > radius) return null;

        // 프로필 모드에 따라 정보 결정
        let displayProfile: any = {};

        if (user.locationProfileMode === 'persona' && user.personaProfile) {
          // 페르소나 프로필 사용
          const persona = user.personaProfile as any;
          displayProfile = {
            nickname: persona.nickname || `익명_${user.id.slice(-4)}`,
            age: persona.age || null,
            bio: persona.bio || '페르소나 프로필을 사용 중입니다.',
            profileImage: persona.profileImage || null,
          };
        } else {
          // 실제 프로필 사용
          displayProfile = {
            nickname: user.nickname || `사용자_${user.id.slice(-4)}`,
            age: user.age,
            bio: user.bio,
            profileImage: user.profileImage,
          };
        }

        // 공통 그룹 찾기
        const commonGroups = user.groupMemberships.map((m) => m.group.name);

        // 마지막 활동 시간 계산
        const lastActiveMinutes = Math.floor(
          (Date.now() - new Date(user.lastActive).getTime()) / 60000,
        );
        let lastSeen = '방금 전';
        if (lastActiveMinutes > 5) lastSeen = '5분 전';
        if (lastActiveMinutes > 15) lastSeen = '15분 전';
        if (lastActiveMinutes > 30) lastSeen = '30분 전';

        return {
          id: user.id,
          ...displayProfile,
          gender: user.gender,
          isVerified: user.isVerified,
          isPremium: user.isPremium,
          distance: Math.round(distance * 1000), // meters로 변환
          lastSeen,
          isOnline: lastActiveMinutes < 5,
          commonGroups: commonGroups.slice(0, 3),
          profileMode: user.locationProfileMode || 'real',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance)
      .slice(offset, offset + limit);

    return {
      users: nearbyUsers,
      pagination: {
        limit,
        offset,
        hasMore: nearbyUsers.length === limit,
      },
    };
  }

  /**
   * 위치 기반 그룹 생성
   *
   * @param userId 생성자 ID
   * @param data 그룹 데이터
   * @returns 생성된 그룹
   */
  async createLocationGroup(userId: string, data: CreateLocationGroupDto) {
    const {
      name,
      description,
      latitude,
      longitude,
      radius = 1,
      durationHours = 4,
    } = data;

    // QR 코드 생성
    const qrCode = this.generateQrCode();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const group = await this.prisma.group.create({
      data: {
        name,
        description,
        type: 'LOCATION',
        creatorId: userId,
        isActive: true,
        location: {
          latitude,
          longitude,
          radius,
          qrCode,
          expiresAt: expiresAt.toISOString(),
        } as any, // TODO: location field not in schema
        settings: {}, // Required field
        members: {
          create: {
            userId,
            role: 'ADMIN' as const,
            joinedAt: new Date(),
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // 위치 정보를 캐시에 저장
    const cacheKey = `location-group:${group.id}`;
    await this.cacheService.set(
      cacheKey,
      { latitude, longitude, radius, qrCode },
      { ttl: durationHours * 3600 },
    );

    return {
      ...group,
      qrCode,
      expiresAt,
    };
  }

  /**
   * QR 코드로 위치 그룹 가입
   *
   * @param userId 사용자 ID
   * @param data QR 코드 데이터
   */
  async joinLocationGroupByQr(userId: string, data: JoinLocationGroupDto) {
    const { qrCode } = data;

    // QR 코드로 그룹 찾기
    const group = await this.prisma.group.findFirst({
      where: {
        type: 'LOCATION',
        isActive: true,
        location: {
          path: ['qrCode'],
          equals: qrCode,
        },
      },
    });

    if (!group) {
      throw new NotFoundException('유효하지 않은 QR 코드입니다.');
    }

    // 만료 시간 체크
    const locationData = group.location as any;
    if (
      locationData &&
      locationData.expiresAt &&
      new Date(locationData.expiresAt) < new Date()
    ) {
      throw new BadRequestException('만료된 QR 코드입니다.');
    }

    // 사용자 위치 확인
    const userLocation = await this.getUserLocation(userId);
    if (!userLocation) {
      throw new BadRequestException('위치 정보가 필요합니다.');
    }

    // 거리 체크
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      locationData.latitude || locationData.location?.latitude,
      locationData.longitude || locationData.location?.longitude,
    );

    const radius = locationData.radius || locationData.location?.radius || 1;
    if (distance > radius) {
      throw new BadRequestException(
        `그룹 위치에서 ${radius}km 이내에 있어야 합니다.`,
      );
    }

    // 그룹 가입
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'MEMBER',
        joinedAt: new Date(),
      },
    });

    return { message: '그룹에 가입했습니다.' };
  }

  /**
   * 사용자 페르소나 업데이트
   */
  async updateUserPersona(
    userId: string,
    personaData: {
      description: string;
      interests: string[];
      lookingFor: string;
      availability: string;
    },
  ) {
    // 사용자 프로필에 페르소나 정보 저장
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        personaSettings: personaData,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return {
      message: '페르소나가 설정되었습니다.',
      persona: personaData,
    };
  }

  /**
   * 사용자 페르소나 조회
   */
  async getUserPersona(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        persona: true,
      },
    });

    if (!user || !user.persona) {
      return {
        description: '',
        interests: [],
        lookingFor: '',
        availability: '',
      };
    }

    return user.persona;
  }

  /**
   * 위치 기반 그룹 검색
   * 모든 그룹 중 location 필드가 있는 그룹을 검색합니다.
   *
   * @param userId 사용자 ID
   * @param radius 검색 반경 (km)
   */
  async getNearbyLocationGroups(userId: string, radius: number = 5) {
    const userLocation = await this.getUserLocation(userId);
    if (!userLocation) {
      throw new BadRequestException('위치 정보가 없습니다.');
    }

    // location 필드가 null이 아닌 모든 활성 그룹 조회
    const groups = await this.prisma.group.findMany({
      where: {
        isActive: true,
        location: {
          not: Prisma.JsonNull,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        members: {
          where: { status: 'ACTIVE' },
          select: { userId: true },
        },
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    // 거리 계산 및 필터링
    const nearbyGroups = groups
      .map((group) => {
        const location = group.location as any;

        // location 필드 검증
        if (!location?.latitude || !location?.longitude) return null;

        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude,
        );

        // 그룹의 radius가 있으면 사용, 없으면 기본값 1km
        const groupRadius = location.radius || 1;

        // 그룹의 유효 반경과 사용자 검색 반경 모두 고려
        if (distance > Math.min(radius, groupRadius * 2)) return null;

        // 사용자가 이미 멤버인지 확인
        const isJoined = group.members.some(
          (member) => member.userId === userId,
        );

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: groupRadius,
          distance: Math.round(distance * 1000), // meters로 변환
          memberCount: group._count.members,
          activeMembers: group._count.members, // 활성 멤버만 카운트
          createdBy: group.creator?.nickname || 'Unknown',
          createdAt: group.createdAt,
          expiresAt: location.expiresAt
            ? new Date(location.expiresAt)
            : undefined,
          isJoined,
          qrCode: location.qrCode,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance);

    return nearbyGroups;
  }

  /**
   * 사용자 위치 정보 가져오기
   *
   * @param userId 사용자 ID
   * @returns 위치 정보
   */
  private async getUserLocation(userId: string) {
    // 캐시 확인
    const cacheKey = `location:${userId}`;
    const cached = await this.cacheService.get<{
      latitude: number;
      longitude: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    // DB에서 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { location: true },
    });

    if (!user || !user.location) return null;

    const location = JSON.parse(user.location);

    if (location) {
      // 캐시에 저장
      await this.cacheService.set(
        cacheKey,
        { latitude: location.latitude, longitude: location.longitude },
        { ttl: 300 },
      );
    }

    return location;
  }

  /**
   * 주변 그룹 자동 가입 체크
   *
   * @param userId 사용자 ID
   * @param latitude 위도
   * @param longitude 경도
   */
  private async checkAndJoinNearbyGroups(
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    // 자동 가입이 활성화된 위치 기반 그룹 찾기
    const autoJoinGroups = await this.prisma.group.findMany({
      where: {
        type: 'LOCATION',
        isActive: true,
        location: {
          path: ['autoJoin'],
          equals: true,
        },
      },
    });

    for (const group of autoJoinGroups) {
      const locationData = group.location as any;
      if (!locationData) continue;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        locationData.latitude,
        locationData.longitude,
      );

      if (distance <= (locationData.radius || 1)) {
        // 이미 가입했는지 확인
        const existingMember = await this.prisma.groupMember.findUnique({
          where: {
            id: `${group.id}_${userId}`, // Using concatenated ID workaround
          },
        });

        if (!existingMember) {
          // 자동 가입
          await this.prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId,
              role: 'MEMBER',
              joinedAt: new Date(),
            },
          });
        }
      }
    }
  }

  /**
   * 두 지점 간 거리 계산 (Haversine 공식)
   *
   * @param lat1 지점 1 위도
   * @param lon1 지점 1 경도
   * @param lat2 지점 2 위도
   * @param lon2 지점 2 경도
   * @returns 거리 (km)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 도를 라디안으로 변환
   *
   * @param deg 도
   * @returns 라디안
   */
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * QR 코드 생성
   *
   * @returns QR 코드 문자열
   */
  private generateQrCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 위치 공유 토글
   *
   * @param userId 사용자 ID
   * @param enabled 활성화 여부
   */
  async toggleLocationSharing(userId: string, enabled: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: {
          locationSharing: enabled,
        } as any, // TODO: fix settings field in schema
      },
    });

    if (!enabled) {
      // 위치 정보 삭제
      await this.prisma.user.update({
        where: { id: userId },
        data: { location: null },
      });

      // 캐시 삭제
      const cacheKey = `location:${userId}`;
      await this.cacheService.del(cacheKey);
    }

    return { locationSharing: enabled };
  }

  /**
   * 위치 히스토리 조회
   *
   * @param userId 사용자 ID
   * @param days 조회 기간 (일)
   */
  async getLocationHistory(userId: string, days: number = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 위치 기록은 LocationCheckIn으로 대체
    const history = await this.prisma.locationCheckIn.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return history.map((entry) => ({
      latitude: entry.latitude,
      longitude: entry.longitude,
      timestamp: entry.createdAt,
    }));
  }

  /**
   * 프로필 모드 설정
   *
   * @param userId 사용자 ID
   * @param mode 프로필 모드 ('real' | 'persona')
   * @param personaData 페르소나 프로필 데이터 (선택적)
   */
  async setProfileMode(
    userId: string,
    mode: 'real' | 'persona',
    personaData?: {
      nickname?: string;
      age?: number;
      bio?: string;
      profileImage?: string;
    },
  ) {
    const updateData: any = {
      locationProfileMode: mode,
    };

    if (mode === 'persona') {
      // 페르소나 모드인 경우 페르소나 프로필 업데이트
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { personaProfile: true },
      });

      const existingPersona = (currentUser?.personaProfile || {}) as any;

      updateData.personaProfile = {
        ...existingPersona,
        ...personaData,
        updatedAt: new Date().toISOString(),
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        locationProfileMode: true,
        personaProfile: true,
      },
    });

    return {
      mode: updatedUser.locationProfileMode,
      personaProfile: mode === 'persona' ? updatedUser.personaProfile : null,
    };
  }

  /**
   * 현재 프로필 모드 조회
   *
   * @param userId 사용자 ID
   */
  async getProfileMode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        locationProfileMode: true,
        personaProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      mode: user.locationProfileMode || 'real',
      personaProfile:
        user.locationProfileMode === 'persona' ? user.personaProfile : null,
    };
  }
}
