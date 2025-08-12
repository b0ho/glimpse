import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';
import { UserResponse, UserCreateRequest } from '@shared/types';

const prisma = new PrismaClient();

// Convert Prisma User to shared UserResponse type
function prismaUserToUserResponse(prismaUser: User): UserResponse {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body: UserCreateRequest = await request.json();
    
    // Validate required fields
    if (!body.nickname || !body.phoneNumber) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 사용자입니다.' }, { status: 409 });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
        phoneNumber: body.phoneNumber,
        nickname: body.nickname,
        age: body.age,
        gender: body.gender as 'MALE' | 'FEMALE' | 'OTHER',
        bio: body.bio,
        credits: 5, // Default credits
        isPremium: false,
        isVerified: false
      }
    });

    const userResponse = prismaUserToUserResponse(newUser);
    return NextResponse.json(userResponse, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}