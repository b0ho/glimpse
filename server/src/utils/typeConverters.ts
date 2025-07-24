import { User as PrismaUser } from '@prisma/client';
import { UserResponse } from '@shared/types';

/**
 * Convert Prisma User model to shared UserResponse type
 */
export function prismaUserToUserResponse(prismaUser: PrismaUser): UserResponse {
  return {
    id: prismaUser.clerkId, // Use clerkId as the public id
    phoneNumber: prismaUser.phoneNumber || '',
    nickname: prismaUser.nickname,
    age: prismaUser.age || undefined,
    gender: prismaUser.gender || undefined,
    profileImage: prismaUser.profileImage || undefined,
    bio: prismaUser.bio || undefined,
    isVerified: prismaUser.isVerified,
    credits: prismaUser.credits,
    isPremium: prismaUser.isPremium,
    lastActive: prismaUser.lastActive,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    premiumUntil: prismaUser.premiumUntil || undefined,
  };
}

/**
 * Convert multiple Prisma Users to UserResponse array
 */
export function prismaUsersToUserResponses(prismaUsers: PrismaUser[]): UserResponse[] {
  return prismaUsers.map(prismaUserToUserResponse);
}