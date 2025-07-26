import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';
import jwt from 'jsonwebtoken';



export class AuthService {
  private readonly clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
  private readonly clerkApiUrl = 'https://api.clerk.com/v1';

  /**
   * Verify phone number with Clerk and create/update user in database
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
   * Get user by Clerk user ID
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
   * Sync user data with Clerk
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
   * Send SMS verification code via Clerk
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
   * Resend SMS verification code
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
   * Delete user account
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
   * Generate JWT token for legacy support or internal use
   * Note: Primary authentication should use Clerk tokens
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
   * Verify legacy JWT token
   */
  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}

export const authService = new AuthService();