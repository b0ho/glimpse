import { Prisma, LocationCheckMethod } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationInfo {
  address: string;
  city: string;
  district: string;
  country: string;
}

export class LocationService {
  private readonly kakaoApiKey = process.env.KAKAO_API_KEY;

  async validateCoordinates(latitude: number, longitude: number): Promise<boolean> {
    // Validate coordinates are within valid range
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;
    
    // Check if coordinates are within South Korea
    const koreaLatRange = { min: 33, max: 39 };
    const koreaLngRange = { min: 124, max: 132 };
    
    return (
      latitude >= koreaLatRange.min &&
      latitude <= koreaLatRange.max &&
      longitude >= koreaLngRange.min &&
      longitude <= koreaLngRange.max
    );
  }

  async getAddressFromCoordinates(lat: number, lng: number): Promise<LocationInfo> {
    if (!this.kakaoApiKey) {
      throw createError(500, 'Kakao API key not configured');
    }

    try {
      const response = await axios.get(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
        {
          headers: {
            Authorization: `KakaoAK ${this.kakaoApiKey}`
          }
        }
      );

      if (!response.data.documents || response.data.documents.length === 0) {
        throw createError(404, '주소를 찾을 수 없습니다');
      }

      const address = response.data.documents[0].address;
      const roadAddress = response.data.documents[0].road_address;

      return {
        address: roadAddress?.address_name || address.address_name,
        city: address.region_1depth_name,
        district: address.region_2depth_name,
        country: 'KR'
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw createError(401, 'Invalid Kakao API key');
      }
      throw createError(500, '주소 조회에 실패했습니다');
    }
  }

  async calculateDistance(coords1: Coordinates, coords2: Coordinates): Promise<number> {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);
    const lat1 = this.toRad(coords1.latitude);
    const lat2 = this.toRad(coords2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  async findNearbyGroups(latitude: number, longitude: number, radiusKm: number = 5) {
    // Calculate bounding box
    const latDelta = radiusKm / 111; // 1 degree latitude = ~111km
    const lngDelta = radiusKm / (111 * Math.cos(this.toRad(latitude)));

    const groups = await prisma.group.findMany({
      where: {
        type: 'LOCATION',
        location: {
          not: Prisma.JsonNull
        },
        isActive: true
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    // Calculate exact distances
    const groupsWithDistance = await Promise.all(
      groups.map(async (group) => {
        const groupLocation = group.location as any;
        const groupLat = groupLocation?.latitude as number;
        const groupLng = groupLocation?.longitude as number;
        
        if (!groupLat || !groupLng) return null;
        
        const distance = await this.calculateDistance(
          { latitude, longitude },
          { latitude: groupLat, longitude: groupLng }
        );
        
        if (distance > radiusKm) return null;
        
        return {
          ...group,
          distance: Math.round(distance * 1000) / 1000 // Round to 3 decimal places
        };
      })
    );

    return groupsWithDistance
      .filter(g => g !== null)
      .sort((a, b) => a!.distance - b!.distance);
  }

  async createLocationGroup(data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    radius: number;
    creatorId: string;
  }) {
    const { latitude, longitude, radius, ...groupData } = data;

    // Validate coordinates
    if (!await this.validateCoordinates(latitude, longitude)) {
      throw createError(400, '유효하지 않은 위치입니다');
    }

    // Get address info
    const locationInfo = await this.getAddressFromCoordinates(latitude, longitude);

    const group = await prisma.group.create({
      data: {
        ...groupData,
        type: 'LOCATION',
        location: {
          latitude,
          longitude,
          radius,
          address: locationInfo.address,
          city: locationInfo.city,
          district: locationInfo.district,
          coordinates: [
            longitude - radius / 111,
            latitude - radius / 111,
            longitude + radius / 111,
            latitude + radius / 111
          ]
        },
        settings: {
          requiresLocationCheck: true,
          locationCheckRadius: radius
        }
      }
    });

    return group;
  }

  async checkIn(userId: string, groupId: string, coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    method?: string;
  }) {
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group || group.type !== 'LOCATION') {
      throw createError(404, '위치 기반 그룹을 찾을 수 없습니다');
    }

    const groupLocation = group.location as any;
    const groupLat = groupLocation?.latitude as number;
    const groupLng = groupLocation?.longitude as number;
    const groupRadius = groupLocation?.radius as number || 0.5; // Default 500m

    if (!groupLat || !groupLng) {
      throw createError(500, '그룹 위치 정보가 없습니다');
    }

    // Calculate distance
    const distance = await this.calculateDistance(
      coordinates,
      { latitude: groupLat, longitude: groupLng }
    );

    if (distance > groupRadius) {
      throw createError(400, `그룹 위치에서 ${Math.round(distance * 1000)}m 떨어져 있습니다. ${groupRadius * 1000}m 이내에서 체크인해주세요.`);
    }

    // Create check-in record
    const checkIn = await prisma.locationCheckIn.create({
      data: {
        userId,
        groupId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy || 0,
        method: (coordinates.method || 'GPS') as LocationCheckMethod,
        isValid: true
      }
    });

    // Update user's last active time
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: new Date()
      }
    });

    return {
      checkIn,
      distance: Math.round(distance * 1000),
      message: '체크인 되었습니다'
    };
  }

  async getCheckIns(groupId: string, page: number = 1, limit: number = 20) {
    const [checkIns, total] = await Promise.all([
      prisma.locationCheckIn.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.locationCheckIn.count({ where: { groupId } })
    ]);

    return {
      checkIns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserLocationHistory(userId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const checkIns = await prisma.locationCheckIn.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return checkIns;
  }
}

export const locationService = new LocationService();