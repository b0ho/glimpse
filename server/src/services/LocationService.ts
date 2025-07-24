import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';

const prisma = new PrismaClient();

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationInfo {
  address: string;
  city: string;
  district: string;
  country: string;
  postalCode?: string;
}

interface NearbyUser {
  id: string;
  nickname: string;
  profileImage: string | null;
  distance: number;
  lastActive: Date;
}

export class LocationService {
  private readonly kakaoApiKey = process.env.KAKAO_REST_API_KEY || '';
  private readonly maxDistance = 50; // km
  private readonly locationCacheTime = 10 * 60 * 1000; // 10 minutes

  async updateUserLocation(userId: string, coordinates: Coordinates): Promise<void> {
    try {
      // Get location info from coordinates
      const locationInfo = await this.reverseGeocode(coordinates);

      // Update user location
      await prisma.user.update({
        where: { id: userId },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          locationAddress: locationInfo.address,
          locationCity: locationInfo.city,
          locationDistrict: locationInfo.district,
          locationUpdatedAt: new Date()
        }
      });

      console.log(`Updated location for user ${userId}: ${locationInfo.address}`);
    } catch (error) {
      console.error('Failed to update user location:', error);
      throw createError(500, '위치 정보 업데이트에 실패했습니다.');
    }
  }

  async getNearbyUsers(userId: string, maxDistance: number = this.maxDistance): Promise<NearbyUser[]> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        latitude: true,
        longitude: true,
        locationUpdatedAt: true
      }
    });

    if (!currentUser?.latitude || !currentUser?.longitude) {
      throw createError(400, '현재 위치 정보가 없습니다. 위치를 업데이트해주세요.');
    }

    // Check if location is recent (within 1 hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    if (!currentUser.locationUpdatedAt || currentUser.locationUpdatedAt < oneHourAgo) {
      throw createError(400, '위치 정보가 오래되었습니다. 위치를 다시 업데이트해주세요.');
    }

    // Get users already liked or matched
    const alreadyInteracted = await prisma.userLike.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true }
    });

    const excludeUserIds = [userId, ...alreadyInteracted.map(like => like.toUserId)];

    // Find users within range
    const nearbyUsers = await prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        latitude: { not: null },
        longitude: { not: null },
        locationUpdatedAt: { gte: oneHourAgo },
        isActive: true
      },
      select: {
        id: true,
        nickname: true,
        profileImage: true,
        latitude: true,
        longitude: true,
        lastActive: true
      }
    });

    // Calculate distances and filter
    const usersWithDistance = nearbyUsers
      .map(user => {
        const distance = this.calculateDistance(
          currentUser.latitude!,
          currentUser.longitude!,
          user.latitude!,
          user.longitude!
        );

        return {
          id: user.id,
          nickname: user.nickname || '',
          profileImage: user.profileImage,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          lastActive: user.lastActive
        };
      })
      .filter(user => user.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limit to 20 users

    return usersWithDistance;
  }

  async createLocationGroup(
    userId: string,
    name: string,
    description: string,
    coordinates: Coordinates,
    radius: number = 1 // km
  ): Promise<string> {
    // Verify user location is within the group area
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true }
    });

    if (!user?.latitude || !user?.longitude) {
      throw createError(400, '위치 정보가 필요합니다.');
    }

    const distance = this.calculateDistance(
      user.latitude,
      user.longitude,
      coordinates.latitude,
      coordinates.longitude
    );

    if (distance > radius) {
      throw createError(400, '그룹 생성 위치에서 너무 멀리 떨어져 있습니다.');
    }

    // Get location info
    const locationInfo = await this.reverseGeocode(coordinates);

    // Create location-based group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        type: 'LOCATION',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationRadius: radius,
        locationAddress: locationInfo.address,
        locationCity: locationInfo.city,
        locationDistrict: locationInfo.district,
        maxMembers: 100,
        isActive: true,
        createdBy: userId
      }
    });

    // Add creator as admin
    await prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    return group.id;
  }

  async joinLocationGroup(userId: string, groupId: string): Promise<boolean> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        type: true,
        latitude: true,
        longitude: true,
        locationRadius: true,
        maxMembers: true,
        _count: {
          select: {
            members: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    if (!group || group.type !== 'LOCATION') {
      throw createError(404, '위치 기반 그룹을 찾을 수 없습니다.');
    }

    if (group._count.members >= group.maxMembers) {
      throw createError(400, '그룹 정원이 가득 찼습니다.');
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      throw createError(400, '이미 그룹의 멤버입니다.');
    }

    // Verify user location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true }
    });

    if (!user?.latitude || !user?.longitude || !group.latitude || !group.longitude) {
      throw createError(400, '위치 정보가 필요합니다.');
    }

    const distance = this.calculateDistance(
      user.latitude,
      user.longitude,
      group.latitude,
      group.longitude
    );

    if (distance > group.locationRadius) {
      throw createError(400, '그룹 위치에서 너무 멀리 떨어져 있습니다.');
    }

    // Join the group
    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    return true;
  }

  async getLocationGroups(coordinates: Coordinates, radius: number = 10): Promise<any[]> {
    // Find location groups within radius
    const groups = await prisma.group.findMany({
      where: {
        type: 'LOCATION',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        _count: {
          select: {
            members: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    // Filter by distance and add distance info
    const nearbyGroups = groups
      .map(group => {
        const distance = this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          group.latitude!,
          group.longitude!
        );

        return {
          ...group,
          distance: Math.round(distance * 100) / 100,
          memberCount: group._count.members
        };
      })
      .filter(group => group.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyGroups;
  }

  async getPopularLocationsByCity(city: string): Promise<any[]> {
    const locations = await prisma.group.groupBy({
      by: ['locationDistrict'],
      where: {
        type: 'LOCATION',
        locationCity: city,
        isActive: true
      },
      _count: {
        members: true
      },
      orderBy: {
        _count: {
          members: 'desc'
        }
      },
      take: 10
    });

    return locations.map(location => ({
      district: location.locationDistrict,
      groupCount: location._count.members
    }));
  }

  private async reverseGeocode(coordinates: Coordinates): Promise<LocationInfo> {
    try {
      const response = await axios.get(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${coordinates.longitude}&y=${coordinates.latitude}`,
        {
          headers: {
            Authorization: `KakaoAK ${this.kakaoApiKey}`
          }
        }
      );

      const address = response.data.documents[0];
      
      if (!address) {
        throw new Error('No address found for coordinates');
      }

      const roadAddress = address.road_address;
      const regionAddress = address.address;

      return {
        address: roadAddress?.address_name || regionAddress?.address_name || '',
        city: roadAddress?.region_1depth_name || regionAddress?.region_1depth_name || '',
        district: roadAddress?.region_2depth_name || regionAddress?.region_2depth_name || '',
        country: 'South Korea',
        postalCode: roadAddress?.zone_no
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Fallback to basic location info
      return {
        address: `위도 ${coordinates.latitude}, 경도 ${coordinates.longitude}`,
        city: '알 수 없음',
        district: '알 수 없음',
        country: 'South Korea'
      };
    }
  }

  async searchPlaces(query: string, coordinates?: Coordinates): Promise<any[]> {
    try {
      let url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
      
      if (coordinates) {
        url += `&x=${coordinates.longitude}&y=${coordinates.latitude}&radius=10000`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `KakaoAK ${this.kakaoApiKey}`
        }
      });

      return response.data.documents.map((place: any) => ({
        id: place.id,
        name: place.place_name,
        address: place.address_name,
        roadAddress: place.road_address_name,
        phone: place.phone,
        coordinates: {
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x)
        },
        distance: place.distance ? parseInt(place.distance) : null,
        category: place.category_name
      }));
    } catch (error) {
      console.error('Place search failed:', error);
      throw createError(500, '장소 검색에 실패했습니다.');
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getUserLocationHistory(userId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const locations = await prisma.userLocationHistory.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        latitude: true,
        longitude: true,
        address: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return locations;
  }

  async saveLocationHistory(userId: string, coordinates: Coordinates, address: string): Promise<void> {
    await prisma.userLocationHistory.create({
      data: {
        userId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address
      }
    });

    // Keep only last 100 location records per user
    const userLocationCount = await prisma.userLocationHistory.count({
      where: { userId }
    });

    if (userLocationCount > 100) {
      const oldLocations = await prisma.userLocationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: userLocationCount - 100,
        select: { id: true }
      });

      await prisma.userLocationHistory.deleteMany({
        where: {
          id: { in: oldLocations.map(l => l.id) }
        }
      });
    }
  }

  async getLocationStats(): Promise<any> {
    const [totalLocationGroups, activeLocationUsers, popularCities] = await Promise.all([
      prisma.group.count({
        where: { type: 'LOCATION', isActive: true }
      }),
      prisma.user.count({
        where: {
          latitude: { not: null },
          longitude: { not: null },
          locationUpdatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.user.groupBy({
        by: ['locationCity'],
        where: {
          locationCity: { not: null },
          isActive: true
        },
        _count: true,
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 10
      })
    ]);

    return {
      totalLocationGroups,
      activeLocationUsers,
      popularCities: popularCities.map(city => ({
        city: city.locationCity,
        userCount: city._count
      }))
    };
  }

  async cleanupOldLocationData(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.userLocationHistory.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`Cleaned up ${result.count} old location records`);
    return result.count;
  }

  validateCoordinates(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  async checkLocationPermission(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locationPermissionGranted: true }
    });

    return user?.locationPermissionGranted || false;
  }

  async updateLocationPermission(userId: string, granted: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { locationPermissionGranted: granted }
    });
  }
}