import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * 좌표 인터페이스
 * @interface Coordinates
 */
interface Coordinates {
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
}

/**
 * 카카오 주소 API 응답 인터페이스
 * @interface KakaoAddressResponse
 */
interface KakaoAddressResponse {
  /** 검색 결과 문서 배열 */
  documents: Array<{
    /** 지번 주소 */
    address: {
      /** 전체 주소 */
      address_name: string;
      /** 시/도 */
      region_1depth_name: string;
      /** 구/군 */
      region_2depth_name: string;
      /** 동/면/읍 */
      region_3depth_name: string;
    };
    /** 도로명 주소 */
    road_address?: {
      /** 전체 도로명 주소 */
      address_name: string;
      /** 건물명 */
      building_name?: string;
    };
  }>;
}

/**
 * 위치 기반 그룹 데이터 인터페이스
 * @interface LocationGroupData
 */
interface LocationGroupData {
  /** 그룹명 */
  name: string;
  /** 그룹 설명 */
  description?: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 반경 (미터) */
  radius: number;
  /** 최대 멤버 수 */
  maxMembers?: number;
}

/**
 * 위치 기반 서비스 - 위치 기반 그룹, 지오코딩, QR 코드 관리
 * @class LocationService
 */
export class LocationService {
  /** 싱글턴 인스턴스 */
  private static instance: LocationService;
  /** 카카오 API 키 */
  private kakaoApiKey: string;
  
  private constructor() {
    this.kakaoApiKey = process.env.KAKAO_API_KEY || '';
    if (!this.kakaoApiKey) {
      console.warn('Kakao API key not configured');
    }
  }
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 좌표로 주소 가져오기 (역지오코딩)
   * @param {Coordinates} coordinates - 위도/경도 좌표
   * @returns {Promise<string>} 주소 문자열
   * @throws {Error} API 미설정 또는 주소 찾기 실패 시
   */
  async getAddressFromCoordinates(coordinates: Coordinates): Promise<string> {
    if (!this.kakaoApiKey) {
      throw createError(500, 'Kakao API가 설정되지 않았습니다.');
    }

    try {
      const response = await axios.get<KakaoAddressResponse>(
        'https://dapi.kakao.com/v2/local/geo/coord2address.json',
        {
          params: {
            x: coordinates.longitude,
            y: coordinates.latitude,
            input_coord: 'WGS84'
          },
          headers: {
            'Authorization': `KakaoAK ${this.kakaoApiKey}`
          }
        }
      );

      if (response.data.documents.length === 0) {
        throw createError(404, '주소를 찾을 수 없습니다.');
      }

      const doc = response.data.documents[0];
      if (!doc) {
        throw createError(404, '주소를 찾을 수 없습니다.');
      }
      return doc.road_address?.address_name || doc.address.address_name;
    } catch (error) {
      console.error('Kakao API error:', error);
      throw createError(500, '주소 검색에 실패했습니다.');
    }
  }

  /**
   * 두 지점 간의 거리 계산 (미터 단위)
   * @param {Coordinates} coord1 - 첫 번째 좌표
   * @param {Coordinates} coord2 - 두 번째 좌표
   * @returns {number} 거리 (미터)
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * 위치 기반 그룹 생성
   * @param {string} creatorId - 생성자 ID
   * @param {LocationGroupData} data - 그룹 데이터
   * @returns {Promise<Object>} 생성된 그룹과 QR 코드
   * @throws {Error} 그룹 생성 실패 시
   */
  async createLocationGroup(creatorId: string, data: LocationGroupData) {
    try {
      // 주소 가져오기
      const address = await this.getAddressFromCoordinates({
        latitude: data.latitude,
        longitude: data.longitude
      });

      // 위치 기반 그룹 생성
      const group = await prisma.group.create({
        data: {
          name: data.name,
          description: data.description,
          type: 'LOCATION',
          isActive: true,
          maxMembers: data.maxMembers || 100,
          creatorId,
          settings: {}, // 기본 설정
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            address
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      });

      // 생성자를 그룹 멤버로 추가
      await prisma.groupMember.create({
        data: {
          userId: creatorId,
          groupId: group.id,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      // QR 코드 생성
      const qrCode = await this.generateLocationQRCode(group.id);

      return {
        ...group,
        qrCode
      };
    } catch (error) {
      console.error('Failed to create location group:', error);
      throw error;
    }
  }

  /**
   * 위치 기반 그룹 참여 검증
   * @param {string} userId - 사용자 ID
   * @param {string} groupId - 그룹 ID
   * @param {Coordinates} userCoordinates - 사용자 좌표
   * @returns {Promise<Object>} 가입 결과
   * @throws {Error} 그룹 미존재, 위치 범위 벗어남 등
   */
  async verifyLocationForGroup(userId: string, groupId: string, userCoordinates: Coordinates) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!group) {
      throw createError(404, '그룹을 찾을 수 없습니다.');
    }

    if (group.type !== 'LOCATION') {
      throw createError(400, '위치 기반 그룹이 아닙니다.');
    }

    const groupLocation = group.location as any;
    if (!groupLocation) {
      throw createError(500, '그룹 위치 정보가 없습니다.');
    }

    // 거리 확인
    const distance = this.calculateDistance(userCoordinates, {
      latitude: groupLocation.latitude,
      longitude: groupLocation.longitude
    });

    const allowedRadius = groupLocation.radius || 100; // 기본 100m

    if (distance > allowedRadius) {
      throw createError(400, `그룹 위치에서 ${allowedRadius}m 이내에 있어야 합니다. 현재 거리: ${Math.round(distance)}m`);
    }

    // 위치 체크인 기록
    await prisma.locationCheckIn.create({
      data: {
        userId,
        groupId,
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
        accuracy: distance,
        method: 'GPS',
        isValid: true
      }
    });

    // 이미 멤버인 경우
    if (group.members.length > 0) {
      return {
        alreadyMember: true,
        group
      };
    }

    // 그룹 참여
    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    return {
      alreadyMember: false,
      group
    };
  }

  /**
   * 위치 그룹 QR 코드 생성
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<string>} QR 코드 Data URL
   */
  async generateLocationQRCode(groupId: string): Promise<string> {
    const qrData = {
      type: 'location_group',
      groupId,
      timestamp: Date.now(),
      signature: this.generateQRSignature(groupId)
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  }

  /**
   * QR 코드로 그룹 참여
   * @param {string} userId - 사용자 ID
   * @param {string} qrData - QR 코드 데이터
   * @returns {Promise<Object>} 가입 결과
   * @throws {Error} 유효하지 않은 QR 코드, 만료된 QR 코드 등
   */
  async joinGroupByQRCode(userId: string, qrData: string) {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type !== 'location_group') {
        throw createError(400, '유효하지 않은 QR 코드입니다.');
      }

      // 서명 검증
      const expectedSignature = this.generateQRSignature(data.groupId);
      if (data.signature !== expectedSignature) {
        throw createError(400, '유효하지 않은 QR 코드입니다.');
      }

      // 타임스탬프 검증 (5분 이내)
      const now = Date.now();
      if (now - data.timestamp > 5 * 60 * 1000) {
        throw createError(400, 'QR 코드가 만료되었습니다.');
      }

      const group = await prisma.group.findUnique({
        where: { id: data.groupId },
        include: {
          members: {
            where: { userId }
          }
        }
      });

      if (!group) {
        throw createError(404, '그룹을 찾을 수 없습니다.');
      }

      if (!group.isActive) {
        throw createError(400, '비활성화된 그룹입니다.');
      }

      // 위치 체크인 기록 (QR 방식)
      await prisma.locationCheckIn.create({
        data: {
          userId,
          groupId: group.id,
          latitude: 0, // QR 코드 방식은 좌표 없음
          longitude: 0,
          accuracy: 0,
          method: 'QR_CODE',
          isValid: true
        }
      });

      // 이미 멤버인 경우
      if (group.members.length > 0) {
        return {
          alreadyMember: true,
          group
        };
      }

      // 그룹 참여
      await prisma.groupMember.create({
        data: {
          userId,
          groupId: group.id,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });

      return {
        alreadyMember: false,
        group
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw createError(400, '유효하지 않은 QR 코드입니다.');
      }
      throw error;
    }
  }

  /**
   * 주변 위치 기반 그룹 검색
   * @param {Coordinates} coordinates - 검색 중심 좌표
   * @param {number} [radiusKm=5] - 검색 반경 (km)
   * @returns {Promise<Array>} 주변 그룹 목록 (거리순 정렬)
   */
  async getNearbyGroups(coordinates: Coordinates, radiusKm: number = 5) {
    const groups = await prisma.group.findMany({
      where: {
        type: 'LOCATION',
        isActive: true
      },
      include: {
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    // 거리 계산 및 필터링
    const nearbyGroups = groups.filter(group => {
      const groupLocation = group.location as any;
      if (!groupLocation) return false;

      const distance = this.calculateDistance(coordinates, {
        latitude: groupLocation.latitude,
        longitude: groupLocation.longitude
      });

      return distance <= radiusKm * 1000; // km to meters
    }).map(group => {
      const groupLocation = group.location as any;
      const distance = this.calculateDistance(coordinates, {
        latitude: groupLocation.latitude,
        longitude: groupLocation.longitude
      });

      return {
        ...group,
        distance: Math.round(distance),
        address: groupLocation.address
      };
    });

    // 거리순 정렬
    nearbyGroups.sort((a, b) => a.distance - b.distance);

    return nearbyGroups;
  }

  /**
   * 사용자의 위치 체크인 히스토리 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 체크인 기록 목록
   */
  async getUserLocationHistory(userId: string) {
    const checkIns = await prisma.locationCheckIn.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return checkIns;
  }

  /**
   * QR 코드 서명 생성
   * @private
   * @param {string} groupId - 그룹 ID
   * @returns {string} HMAC 서명
   */
  private generateQRSignature(groupId: string): string {
    const secret = process.env.QR_CODE_SECRET || 'default-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(groupId)
      .digest('hex')
      .substring(0, 16);
  }
}

export const locationService = LocationService.getInstance();