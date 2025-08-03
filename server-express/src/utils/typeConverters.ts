/**
 * 타입 변환 유틸리티
 * @module utils/typeConverters
 * @description Prisma 모델과 공유 타입 간의 변환 함수
 */

import { User as PrismaUser } from '@prisma/client';
import { UserResponse } from '@shared/types';

/**
 * Prisma User 모델을 UserResponse 타입으로 변환
 * @function prismaUserToUserResponse
 * @param {PrismaUser} prismaUser - Prisma에서 가져온 사용자 데이터
 * @returns {UserResponse} 공유 타입의 사용자 응답 객체
 * @description 데이터베이스 모델을 API 응답 형식으로 변환
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
 * 여러 Prisma User 모델을 UserResponse 배열로 변환
 * @function prismaUsersToUserResponses
 * @param {PrismaUser[]} prismaUsers - Prisma 사용자 배열
 * @returns {UserResponse[]} 공유 타입의 사용자 응답 배열
 * @description 여러 사용자 데이터를 일괄 변환
 */
export function prismaUsersToUserResponses(prismaUsers: PrismaUser[]): UserResponse[] {
  return prismaUsers.map(prismaUserToUserResponse);
}