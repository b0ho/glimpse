import { User as PrismaUser } from '@prisma/client';
import { UserResponse } from '@shared/types';

/**
 * Convert Prisma User model to shared UserResponse type
 */
export function prismaUserToUserResponse(prismaUser: PrismaUser): UserResponse {
  return {
    id: prismaUser.id,
    clerkId: prismaUser.clerkId || undefined,
    anonymousId: prismaUser.anonymousId,
    phoneNumber: prismaUser.phoneNumber,
    nickname: prismaUser.nickname || undefined,
    age: prismaUser.age || undefined,
    gender: prismaUser.gender as 'MALE' | 'FEMALE' | undefined,
    profileImage: prismaUser.profileImage || undefined,
    bio: prismaUser.bio || undefined,
    isVerified: prismaUser.isVerified,
    credits: prismaUser.credits,
    isPremium: prismaUser.isPremium,
    premiumUntil: prismaUser.premiumUntil || undefined,
    lastActive: prismaUser.lastActive,
    lastOnline: prismaUser.lastOnline || undefined,
    deletedAt: prismaUser.deletedAt || undefined,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

/**
 * Convert multiple Prisma Users to UserResponse array
 */
export function prismaUsersToUserResponses(prismaUsers: PrismaUser[]): UserResponse[] {
  return prismaUsers.map(prismaUserToUserResponse);
}