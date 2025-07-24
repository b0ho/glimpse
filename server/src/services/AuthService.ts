import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export class AuthService {
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

  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}