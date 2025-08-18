import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import {
  CreatePersonaDto,
  UpdatePersonaDto,
  UpdateLocationDto,
} from './dto/persona.dto';

@Injectable()
export class PersonaService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(userId: string, dto: CreatePersonaDto) {
    // Check if persona exists
    const existing = await this.prisma.persona.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing persona
      return this.prisma.persona.update({
        where: { userId },
        data: {
          nickname: dto.nickname,
          age: dto.age,
          bio: dto.bio,
          interests: dto.interests || [],
          occupation: dto.occupation,
          height: dto.height,
          mbti: dto.mbti,
          drinking: dto.drinking,
          smoking: dto.smoking,
          isActive: true,
        },
      });
    } else {
      // Create new persona
      return this.prisma.persona.create({
        data: {
          userId,
          nickname: dto.nickname,
          age: dto.age,
          bio: dto.bio,
          interests: dto.interests || [],
          occupation: dto.occupation,
          height: dto.height,
          mbti: dto.mbti,
          drinking: dto.drinking,
          smoking: dto.smoking,
          isActive: true,
        },
      });
    }
  }

  async getMyPersona(userId: string) {
    const persona = await this.prisma.persona.findUnique({
      where: { userId },
    });

    if (!persona) {
      return null;
    }

    return persona;
  }

  async togglePersona(userId: string, isActive: boolean) {
    const persona = await this.prisma.persona.findUnique({
      where: { userId },
    });

    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    return this.prisma.persona.update({
      where: { userId },
      data: { isActive },
    });
  }

  async deletePersona(userId: string) {
    const persona = await this.prisma.persona.findUnique({
      where: { userId },
    });

    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    return this.prisma.persona.delete({
      where: { userId },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const updateData: any = {};

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.lastLatitude = dto.latitude;
      updateData.lastLongitude = dto.longitude;
      updateData.lastLocationUpdateAt = new Date();
    }

    if (dto.locationSharingEnabled !== undefined) {
      updateData.locationSharingEnabled = dto.locationSharingEnabled;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async getNearbyPersonas(
    userId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ) {
    // Update user's location
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationUpdateAt: new Date(),
      },
    });

    // Calculate bounds for the search radius
    const kmPerDegree = 111;
    const latDelta = radiusKm / kmPerDegree;
    const lonDelta =
      radiusKm / (kmPerDegree * Math.cos((latitude * Math.PI) / 180));

    // Find nearby users with active personas
    const nearbyUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        lastLatitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        lastLongitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
        lastLocationUpdateAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Active in last 30 minutes
        },
        locationSharingEnabled: true,
      },
      include: {
        persona: {
          where: { isActive: true },
        },
      },
    });

    // Filter users with personas and calculate distance
    const personasWithDistance = nearbyUsers
      .filter((user: any) => user.persona)
      .map((user: any) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          user.lastLatitude,
          user.lastLongitude,
        );

        return {
          userId: user.id,
          anonymousId: user.anonymousId,
          persona: user.persona,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          lastActive: user.lastLocationUpdateAt,
        };
      })
      .filter((item: any) => item.distance <= radiusKm)
      .sort((a: any, b: any) => a.distance - b.distance);

    return personasWithDistance;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
