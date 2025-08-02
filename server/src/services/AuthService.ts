import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { metrics } from '../utils/monitoring';

/**
 * 인증 서비스 - Clerk 연동 및 JWT 관리
 * @class AuthService
 */
export class AuthService {
  private readonly clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
  private readonly clerkApiUrl = 'https://api.clerk.com/v1';

  /**
   * 전화번호 인증 및 사용자 생성/업데이트
   * @param {string} phoneNumber - 전화번호
   * @param {string} verificationCode - 인증 코드
   * @returns {Promise<User>} 사용자 객체
   * @throws {Error} 인증 실패 시
   */
  async verifyPhoneNumber(phoneNumber: string, verificationCode: string): Promise<User> {
    try {
      // Verify with Clerk API
      const clerkResponse = await axios.post(
        `${this.clerkApiUrl}/phone_numbers/verify`,
        {
          phone_number: phoneNumber,
          code: verificationCode
        },
        {
          headers: {
            'Authorization': `Bearer ${this.clerkSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!clerkResponse.data.verified) {
        metrics.authLoginFailuresTotal.labels('invalid_verification_code').inc();
        throw createError(400, '전화번호 인증에 실패했습니다.');
      }

      // Find or create user in our database
      let user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            phoneNumber,
            isVerified: true,
            // Set default values
            credits: 1, // 1 free daily like
            isPremium: false,
          }
        });
      } else {
        // Update verification status
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
        });
      }

      return user;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw createError(400, '잘못된 인증 코드입니다.');
      }
      throw createError(500, '인증 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * Clerk 사용자 ID로 사용자 조회
   * @param {string} clerkUserId - Clerk 사용자 ID
   * @returns {Promise<User|null>} 사용자 객체 또는 null
   */
  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    try {
      // Get user details from Clerk
      const clerkResponse = await axios.get(
        `${this.clerkApiUrl}/users/${clerkUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.clerkSecretKey}`,
          }
        }
      );

      const phoneNumber = clerkResponse.data.phone_numbers?.[0]?.phone_number;
      if (!phoneNumber) {
        return null;
      }

      // Find user in our database
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      return user;
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return null;
    }
  }

  /**
   * Clerk와 사용자 데이터 동기화
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   * @throws {Error} 사용자를 찾을 수 없을 때
   */
  async syncWithClerk(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    try {
      // Update user metadata in Clerk
      await axios.patch(
        `${this.clerkApiUrl}/users`,
        {
          public_metadata: {
            userId: user.id,
            nickname: user.nickname,
            isPremium: user.isPremium,
            credits: user.credits
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.clerkSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error syncing with Clerk:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * SMS 인증 코드 전송
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<void>}
   * @throws {Error} SMS 전송 실패 시
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      await axios.post(
        `${this.clerkApiUrl}/phone_numbers`,
        {
          phone_number: phoneNumber,
          verified: false,
          primary: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.clerkSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      if (error.response?.status === 422) {
        // Phone number already exists, try to resend code
        await this.resendVerificationCode(phoneNumber);
      } else {
        throw createError(500, 'SMS 전송에 실패했습니다.');
      }
    }
  }

  /**
   * SMS 인증 코드 재전송
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<void>}
   * @throws {Error} SMS 재전송 실패 시
   */
  async resendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      await axios.post(
        `${this.clerkApiUrl}/phone_numbers/resend_code`,
        {
          phone_number: phoneNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${this.clerkSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      throw createError(500, 'SMS 재전송에 실패했습니다.');
    }
  }

  /**
   * 사용자 계정 삭제 (소프트 삭제)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   * @throws {Error} 사용자를 찾을 수 없을 때
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    // Soft delete in our database
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        phoneNumber: `DELETED_${user.phoneNumber}_${Date.now()}` // Ensure uniqueness
      }
    });

    // Note: We don't delete from Clerk as they might have other apps
  }

  /**
   * JWT 토큰 생성 (레거시 지원 및 내부 사용)
   * @param {User} user - 사용자 객체
   * @returns {string} JWT 토큰
   * @note 기본 인증은 Clerk 토큰을 사용해야 함
   */
  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '30d'
    });
  }

  /**
   * 레거시 JWT 토큰 검증
   * @param {string} token - JWT 토큰
   * @returns {any} 디코드된 토큰 페이로드
   * @throws {Error} 토큰 검증 실패 시
   */
  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}

export const authService = new AuthService();