import { PrismaClient, Prisma } from '@prisma/client';
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

interface GroupLocation {
  latitude: number;
  longitude: number;
  radius?: number;
  address?: string;
  city?: string;
  district?: string;
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

      // For now, we'll just log the location update
      // In the future, this could be stored in a separate UserLocation table
      console.log(`Location update for user ${userId}: ${locationInfo.address}`);
      
      // Store in location history if needed
      await this.saveLocationHistory(userId, coordinates, locationInfo.address);
    } catch (error) {
      console.error('Failed to update user location:', error);
      throw createError(500, '위치 정보 업데이트에 실패했습니다.');
    }
  }

  async getNearbyUsers(userId: string, maxDistance: number = this.maxDistance): Promise<NearbyUser[]> {
    // Since User table doesn't have location fields, we'll return empty array for now
    // This would require implementing a UserLocation table or adding location fields to User
    console.log(`getNearbyUsers called for user ${userId} - feature not fully implemented`);
    return [];
  }

  async createLocationGroup(
    userId: string,
    name: string,
    description: string,
    coordinates: Coordinates,
    radius: number = 1 // km
  ): Promise<string> {
    // For now, skip user location verification during group creation
    // This would require adding location fields to User model
    console.log(`User location verification skipped for group creation by user ${userId}`);

    // Get location info
    const locationInfo = await this.reverseGeocode(coordinates);

    // Create location-based group
    const locationData: GroupLocation = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radius,
      address: locationInfo.address,
      city: locationInfo.city,
      district: locationInfo.district
    };

    const group = await prisma.group.create({
      data: {
        name,
        description,
        type: 'LOCATION',
        maxMembers: 100,
        isActive: true,
        creatorId: userId,
        location: locationData as unknown as Prisma.JsonObject,
        settings: {} as Prisma.JsonObject
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
        location: true,
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

    if (group.maxMembers && group._count.members >= group.maxMembers) {
      throw createError(400, '그룹 정원이 가득 찼습니다.');
    }

    const locationData = group.location as unknown as GroupLocation | null;
    if (!locationData || typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') {
      throw createError(400, '그룹의 위치 정보가 올바르지 않습니다.');
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

    // For now, skip user location verification
    // This would require adding location fields to User model or separate UserLocation table
    console.log(`Location verification skipped for user ${userId}`);

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
        location: { not: Prisma.DbNull }
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
        const locationData = group.location as unknown as GroupLocation | null;
        if (!locationData || typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') {
          return null;
        }

        const distance = this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          locationData.latitude,
          locationData.longitude
        );

        return {
          ...group,
          location: locationData,
          distance: Math.round(distance * 100) / 100,
          memberCount: group._count.members
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null && group.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyGroups;
  }

  async getPopularLocationsByCity(city: string): Promise<any[]> {
    // Since we moved location data to JSON, we need to find groups differently
    const groups = await prisma.group.findMany({
      where: {
        type: 'LOCATION',
        isActive: true,
        location: { not: Prisma.DbNull }
      },
      select: {
        location: true,
        _count: {
          select: {
            members: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    // Filter and group by city in application layer
    const cityGroups = groups
      .filter(group => {
        const locationData = group.location as unknown as GroupLocation | null;
        return locationData && locationData.city === city;
      })
      .reduce((acc, group) => {
        const locationData = group.location as unknown as GroupLocation;
        const district = locationData.district || 'Unknown';
        if (!acc[district]) {
          acc[district] = 0;
        }
        acc[district] += group._count.members;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(cityGroups)
      .map(([district, groupCount]) => ({ district, groupCount }))
      .sort((a, b) => b.groupCount - a.groupCount)
      .slice(0, 10);
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
    // UserLocationHistory table doesn't exist in current schema
    // Return empty array for now
    console.log(`getUserLocationHistory called for user ${userId} - table not implemented`);
    return [];
  }

  async saveLocationHistory(userId: string, coordinates: Coordinates, address: string): Promise<void> {
    // UserLocationHistory table doesn't exist in current schema
    // Just log for now
    console.log(`Location history save requested for user ${userId}: ${address}`);
  }

  async getLocationStats(): Promise<any> {
    const totalLocationGroups = await prisma.group.count({
      where: { type: 'LOCATION', isActive: true }
    });

    return {
      totalLocationGroups,
      activeLocationUsers: 0, // User location fields not implemented
      popularCities: [] // User location fields not implemented
    };
  }

  async cleanupOldLocationData(): Promise<number> {
    // UserLocationHistory table doesn't exist
    console.log('cleanupOldLocationData called - no location history table to clean');
    return 0;
  }

  validateCoordinates(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  async checkLocationPermission(userId: string): Promise<boolean> {
    // User table doesn't have locationPermissionGranted field
    // Return true for now or implement separate permissions table
    return true;
  }

  async updateLocationPermission(userId: string, granted: boolean): Promise<void> {
    // User table doesn't have locationPermissionGranted field
    // Would need to implement separate permissions table
    console.log(`Location permission ${granted ? 'granted' : 'denied'} for user ${userId}`);
  }

  async checkIn(
    userId: string, 
    groupId: string, 
    options: {
      latitude: number;
      longitude: number;
      accuracy: number;
      method: 'GPS' | 'QR_CODE';
    }
  ): Promise<any> {
    try {
      const { latitude, longitude, accuracy, method } = options;

      // Validate coordinates
      if (!this.validateCoordinates({ latitude, longitude })) {
        throw createError(400, '유효하지 않은 좌표입니다.');
      }

      // Check if group exists and is a location-based group
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: {
          type: true,
          location: true,
          isActive: true
        }
      });

      if (!group) {
        throw createError(404, '그룹을 찾을 수 없습니다.');
      }

      if (!group.isActive) {
        throw createError(400, '비활성화된 그룹입니다.');
      }

      // Check if user is a member of the group
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId,
          groupId,
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '그룹 멤버만 체크인할 수 있습니다.');
      }

      // For location-based groups, verify user is within the allowed radius
      if (group.type === 'LOCATION') {
        const locationData = group.location as unknown as GroupLocation | null;
        if (locationData && typeof locationData.latitude === 'number' && typeof locationData.longitude === 'number') {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            locationData.latitude,
            locationData.longitude
          );

          const radius = locationData.radius || 1;
          if (distance > radius) {
            throw createError(400, `그룹 위치에서 ${radius}km 이내에 있어야 합니다. (현재 거리: ${distance.toFixed(2)}km)`);
          }
        }
      }

      // Check if user already checked in recently (within last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentCheckIn = await prisma.locationCheckIn.findFirst({
        where: {
          userId,
          groupId,
          createdAt: { gte: oneHourAgo }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentCheckIn) {
        throw createError(400, '한 시간 내에 이미 체크인했습니다.');
      }

      // Create check-in record
      const checkIn = await prisma.locationCheckIn.create({
        data: {
          userId,
          groupId,
          latitude,
          longitude,
          accuracy,
          method,
          isValid: true
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true
            }
          },
          group: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });

      console.log(`User ${userId} checked in to group ${groupId} at ${latitude}, ${longitude}`);

      return {
        id: checkIn.id,
        userId: checkIn.userId,
        groupId: checkIn.groupId,
        latitude: checkIn.latitude,
        longitude: checkIn.longitude,
        accuracy: checkIn.accuracy,
        method: checkIn.method,
        createdAt: checkIn.createdAt,
        user: checkIn.user,
        group: checkIn.group
      };
    } catch (error) {
      console.error('Check-in failed:', error);
      throw error;
    }
  }

  async getCheckIns(groupId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      // Get check-ins for the group with pagination
      const [checkIns, totalCount] = await Promise.all([
        prisma.locationCheckIn.findMany({
          where: {
            groupId,
            isValid: true
          },
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
          skip: offset,
          take: limit
        }),
        prisma.locationCheckIn.count({
          where: {
            groupId,
            isValid: true
          }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        checkIns: checkIns.map(checkIn => ({
          id: checkIn.id,
          userId: checkIn.userId,
          latitude: checkIn.latitude,
          longitude: checkIn.longitude,
          accuracy: checkIn.accuracy,
          method: checkIn.method,
          createdAt: checkIn.createdAt,
          user: checkIn.user
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Failed to get check-ins:', error);
      throw createError(500, '체크인 목록을 가져오는데 실패했습니다.');
    }
  }
}