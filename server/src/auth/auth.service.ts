import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * 인증 서비스
 * 
 * Clerk와 연동하여 사용자 인증을 처리합니다.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Clerk 사용자 정보를 기반으로 로컬 데이터베이스에 사용자 생성 또는 업데이트
   * 
   * @param clerkUserId Clerk 사용자 ID
   * @returns 생성 또는 업데이트된 사용자 정보
   */
  async createOrUpdateUser(clerkUserId: string) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      
      const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || '';
      
      return await this.prisma.user.upsert({
        where: { clerkId: clerkUserId },
        update: {
          phoneNumber: phoneNumber || undefined,
          updatedAt: new Date(),
        },
        create: {
          clerkId: clerkUserId,
          phoneNumber,
          nickname: `user_${clerkUserId.substring(0, 8)}`,
          credits: 1,
          isPremium: false,
        },
      });
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * JWT 토큰 검증
   * 
   * @param token JWT 토큰
   * @returns 검증 결과
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return await clerkClient.verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Clerk 사용자 ID로 로컬 사용자 조회
   * 
   * @param clerkUserId Clerk 사용자 ID
   * @returns 로컬 사용자 정보
   */
  async findUserByClerkId(clerkUserId: string) {
    return await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
  }
}
