import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Clerk JWT 인증 전략
 * 
 * Clerk에서 발급한 JWT 토큰을 검증하고 사용자 정보를 추출합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('CLERK_PUBLISHABLE_KEY') || 'dummy-key',
    });
  }

  /**
   * JWT 페이로드 검증 및 사용자 정보 반환
   * 
   * @param payload JWT 페이로드
   * @returns 사용자 정보
   */
  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      // Clerk 사용자 정보 조회
      const user = await clerkClient.users.getUser(payload.sub);
      
      return {
        userId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        phoneNumber: user.phoneNumbers?.[0]?.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
}