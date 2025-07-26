import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { authService } from '../services/AuthService';
import { smsService } from '../services/SMSService';
import { createError } from '../middleware/errorHandler';
import { validatePhoneNumber } from '@shared/utils';

export class AuthController {
  async sendSMS(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
        throw createError(400, '올바른 전화번호 형식이 아닙니다.');
      }

      const result = await smsService.sendVerificationCode(phoneNumber);
      
      res.json({
        success: true,
        data: {
          message: '인증 코드가 전송되었습니다.',
          verificationId: result.verificationId
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifySMS(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, verificationCode, verificationId } = req.body;

      if (!phoneNumber || !verificationCode || !verificationId) {
        throw createError(400, '필수 정보가 누락되었습니다.');
      }

      const isValid = await smsService.verifyCode(verificationId, verificationCode);
      
      if (!isValid) {
        throw createError(400, '인증 코드가 올바르지 않습니다.');
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            clerkId: `temp_${Date.now()}`, // 임시 Clerk ID
            nickname: `사용자${Date.now().toString().slice(-4)}`, // 임시 닉네임
            phoneNumber,
            isVerified: true
          }
        });
      } else {
        // Update verification status
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
        });
      }

      const token = authService.generateToken(user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            nickname: user.nickname,
            isVerified: user.isVerified,
            credits: user.credits,
            isPremium: user.isPremium
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, nickname, age, gender, bio } = req.body;

      if (!phoneNumber || !nickname || !age || !gender) {
        throw createError(400, '필수 정보가 누락되었습니다.');
      }

      // Verify user exists and is verified
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber }
      });

      if (!existingUser || !existingUser.isVerified) {
        throw createError(400, '전화번호 인증이 필요합니다.');
      }

      // Update user profile
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nickname,
          age,
          gender,
          bio
        }
      });

      const token = authService.generateToken(user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            nickname: user.nickname,
            age: user.age,
            gender: user.gender,
            bio: user.bio,
            isVerified: user.isVerified,
            credits: user.credits,
            isPremium: user.isPremium
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw createError(400, '토큰이 필요합니다.');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      const newToken = authService.generateToken(user);

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a more complex setup, you might want to blacklist the token
      // For now, we'll just send a success response
      res.json({
        success: true,
        data: { message: '로그아웃되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();