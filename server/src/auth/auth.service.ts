import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../core/prisma/prisma.service';
import { SmsService } from '../core/sms/sms.service';
import { CacheService } from '../core/cache/cache.service';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

/**
 * 인증 서비스
 *
 * Clerk와 연동하여 사용자 인증을 처리합니다.
 */
@Injectable()
export class AuthService {
  private readonly clerkApiUrl = 'https://api.clerk.com/v1';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 전화번호 인증 및 사용자 생성/업데이트
   */
  async verifyPhoneNumber(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<User> {
    try {
      // Verify with our SMS service first
      const isValid = await this.smsService.verifyCode(
        phoneNumber,
        verificationCode,
      );

      if (!isValid) {
        throw new HttpException(
          '잘못된 인증 코드입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find or create user in our database
      let user = await this.prismaService.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        // Create new user
        user = await this.prismaService.user.create({
          data: {
            phoneNumber,
            isVerified: true,
            nickname: await this.generateUniqueNickname(),
            credits: 1, // 1 free daily like
            isPremium: false,
          },
        });

        // Cache new user
        await this.cacheService.set(`user:${user.id}`, user);
      } else {
        // Update verification status
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            lastActive: new Date(),
          },
        });

        // Update cache
        await this.cacheService.set(`user:${user.id}`, user);
      }

      return user;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '인증 처리 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * SMS 인증 코드 전송
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      await this.smsService.sendVerificationCode(phoneNumber);
    } catch (error) {
      throw new HttpException(
        'SMS 전송에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * SMS 인증 코드 재전송
   */
  async resendVerificationCode(phoneNumber: string): Promise<void> {
    // Check rate limit
    const rateLimitKey = `resend_code:${phoneNumber}`;
    const attempts = (await this.cacheService.get<number>(rateLimitKey)) || 0;

    if (attempts >= 3) {
      throw new HttpException(
        '인증 코드 재전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendVerificationCode(phoneNumber);
    await this.cacheService.set(rateLimitKey, attempts + 1, { ttl: 600 }); // 10 minutes
  }

  /**
   * Clerk 사용자 ID로 사용자 조회
   */
  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    try {
      // Check cache first
      const cacheKey = `clerk_user:${clerkUserId}`;
      const cached = await this.cacheService.get<User>(cacheKey);
      if (cached) return cached;

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber;

      if (!phoneNumber) {
        return null;
      }

      // Find user in our database
      const user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ clerkId: clerkUserId }, { phoneNumber }],
        },
      });

      if (user) {
        // Update clerkId if not set
        if (!user.clerkId) {
          const updatedUser = await this.prismaService.user.update({
            where: { id: user.id },
            data: { clerkId: clerkUserId },
          });
          await this.cacheService.set(cacheKey, updatedUser, { ttl: 3600 });
          return updatedUser;
        }

        await this.cacheService.set(cacheKey, user, { ttl: 3600 });
      }

      return user;
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return null;
    }
  }

  /**
   * Clerk와 사용자 데이터 동기화
   */
  async syncWithClerk(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      if (user.clerkId) {
        // Update user metadata in Clerk
        await clerkClient.users.updateUserMetadata(user.clerkId, {
          publicMetadata: {
            userId: user.id,
            nickname: user.nickname,
            isPremium: user.isPremium,
            credits: user.credits,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing with Clerk:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Clerk 사용자 정보를 기반으로 로컬 데이터베이스에 사용자 생성 또는 업데이트
   */
  async createOrUpdateUser(clerkUserId: string): Promise<User> {
    try {
      // 개발 모드 확인
      const useDevAuth =
        this.configService.get<string>('USE_DEV_AUTH') === 'true';
      const devAccountType = this.configService.get<string>(
        'DEV_ACCOUNT_TYPE',
        'premium',
      );

      let clerkUser;
      let phoneNumber: string;

      if (useDevAuth) {
        // 개발 모드에서는 더미 데이터 사용
        phoneNumber = clerkUserId.startsWith('+')
          ? clerkUserId
          : '+82' + clerkUserId;
        clerkUser = {
          id: 'dev_' + Date.now(),
          phoneNumbers: [{ phoneNumber }],
        };
      } else {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
        phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || '';
      }

      // Check if user already exists by phone number
      const existingUser = await this.prismaService.user.findUnique({
        where: { phoneNumber },
      });

      if (existingUser) {
        // Update existing user with Clerk ID
        const updatedUser = await this.prismaService.user.update({
          where: { id: existingUser.id },
          data: {
            clerkId: clerkUserId,
            updatedAt: new Date(),
            lastActive: new Date(),
          },
        });

        await this.cacheService.setUserCache(
          updatedUser.id,
          'profile',
          updatedUser,
        );
        return updatedUser;
      }

      // Create new user
      const newUser = await this.prismaService.user.create({
        data: {
          clerkId: useDevAuth ? 'dev_' + clerkUserId : clerkUserId,
          phoneNumber,
          nickname: await this.generateUniqueNickname(),
          credits: useDevAuth && devAccountType === 'premium' ? 999 : 1,
          isPremium: useDevAuth && devAccountType === 'premium',
          isVerified: true,
          age: 25,
          gender: 'MALE',
        },
      });

      await this.cacheService.setUserCache(newUser.id, 'profile', newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new HttpException(
        '사용자 생성/업데이트에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자 계정 삭제 (소프트 삭제)
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete in our database
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        phoneNumber: `DELETED_${user.phoneNumber}_${Date.now()}`, // Ensure uniqueness
        isVerified: false,
      },
    });

    // Clear cache
    await this.cacheService.del(`user:${userId}`);
    if (user.clerkId) {
      await this.cacheService.delete(`clerk_user:${user.clerkId}`);
    }

    // Note: We don't delete from Clerk as they might have other apps
  }

  /**
   * JWT 토큰 생성 (레거시 지원 및 내부 사용)
   */
  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    const secret = this.configService.get<string>(
      'JWT_SECRET',
      'default-secret',
    );
    return jwt.sign(payload, secret, {
      expiresIn: '30d',
    });
  }

  /**
   * JWT 토큰 검증
   */
  async verifyToken(token: string): Promise<any> {
    // 개발 모드 확인
    const useDevAuth =
      this.configService.get<string>('USE_DEV_AUTH') === 'true';

    if (useDevAuth && token.startsWith('dev-')) {
      // 개발 모드 간단한 토큰 처리
      if (token === 'dev-token') {
        return {
          sub: 'admin-dev-1',
          role: 'admin',
          email: 'admin@glimpse.app',
        };
      }
      // dev-user-{userId} 형식 처리
      const match = token.match(/^dev-user-(.+)$/);
      if (match) {
        return {
          sub: match[1],
          userId: match[1],
          role: 'user',
        };
      }
    }

    try {
      // Try Clerk token first
      const clerkVerification = await clerkClient.verifyToken(token);
      if (clerkVerification) {
        return clerkVerification;
      }
    } catch (error) {
      // Fall back to legacy JWT
      try {
        const secret = this.configService.get<string>(
          'JWT_SECRET',
          'default-secret',
        );
        return jwt.verify(token, secret);
      } catch (jwtError) {
        console.error('Token verification failed:', jwtError);
        return null;
      }
    }
  }

  /**
   * Clerk 사용자 ID로 로컬 사용자 조회
   */
  async findUserByClerkId(clerkUserId: string): Promise<User | null> {
    // Check cache first
    const cached = await this.cacheService.get<User>(
      `clerk_user_db:${clerkUserId}`,
    );
    if (cached) return cached;

    const user = await this.prismaService.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (user) {
      await this.cacheService.set(`clerk_user_db:${clerkUserId}`, user, {
        ttl: 3600,
      });
    }

    return user;
  }

  /**
   * 전화번호로 사용자 조회
   */
  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { phoneNumber },
    });
  }

  /**
   * 고유 닉네임 생성
   */
  private async generateUniqueNickname(): Promise<string> {
    const adjectives = [
      '행복한',
      '즐거운',
      '신나는',
      '활발한',
      '따뜻한',
      '밝은',
      '귀여운',
      '멋진',
      '상쾌한',
      '유쾌한',
    ];
    const nouns = [
      '고양이',
      '강아지',
      '토끼',
      '펭귄',
      '코알라',
      '판다',
      '여우',
      '다람쥐',
      '햄스터',
      '수달',
    ];

    let nickname: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const number = Math.floor(Math.random() * 1000);

      nickname = `${adjective}${noun}${number}`;

      // Check if nickname is unique
      const existing = await this.prismaService.user.findFirst({
        where: { nickname: nickname },
      });

      if (!existing) {
        isUnique = true;
      }

      attempts++;
    }

    // If still not unique, add timestamp
    if (!isUnique) {
      nickname = `사용자${Date.now()}`;
    }

    return nickname!;
  }

  /**
   * 사용자 활동 시간 업데이트
   */
  async updateLastActive(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });

    // Update cache
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.cacheService.setUserCache(userId, 'profile', user);
    }
  }

  /**
   * 사용자 온라인 상태 확인
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const user = await this.cacheService.get<User>(`user:${userId}`);

    if (!user?.lastActive) {
      return false;
    }

    // Consider user online if active within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return user.lastActive > fiveMinutesAgo;
  }

  /**
   * 사용자 세션 정리
   */
  async cleanupUserSession(userId: string): Promise<void> {
    // Clear all user-related cache
    await this.cacheService.del(`user:${userId}`);
    await this.cacheService.delete(`user_groups:${userId}`);
    await this.cacheService.delete(`user_matches:${userId}`);

    // Update user status
    await this.prismaService.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
  }
}
