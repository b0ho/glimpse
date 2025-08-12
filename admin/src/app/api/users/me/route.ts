import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';
import { UserResponse } from '@shared/types';

const prisma = new PrismaClient();

// Convert Prisma User to shared UserResponse type
interface UserWithTokens extends User {
  deviceTokens?: Array<{ id: string; token: string }>;
  fcmTokens?: Array<{ id: string; token: string }>;
}

function prismaUserToUserResponse(prismaUser: UserWithTokens): UserResponse {
  return {
    id: prismaUser.clerkId || '',
    anonymousId: prismaUser.anonymousId,
    phoneNumber: prismaUser.phoneNumber || '',
    nickname: prismaUser.nickname || undefined,
    age: prismaUser.age || undefined,
    gender: prismaUser.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        deviceTokens: true,
        fcmTokens: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userResponse = prismaUserToUserResponse(user);
    return NextResponse.json(userResponse);

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}