import { Controller, Post, Body, UseGuards, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * 인증 컨트롤러
 * 
 * 사용자 인증 및 회원가입 관련 API를 제공합니다.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Clerk 연동 회원가입/로그인
   * 
   * Clerk에서 인증된 사용자를 로컬 데이터베이스에 등록합니다.
   * 
   * @param body Clerk 사용자 ID
   * @returns 생성된 사용자 정보
   */
  @Post('register')
  async register(@Body() body: { clerkUserId: string }) {
    try {
      const user = await this.authService.createOrUpdateUser(body.clerkUserId);
      return {
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
          isPremium: user.isPremium,
          credits: user.credits,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '회원가입에 실패했습니다.',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 현재 사용자 정보 조회
   * 
   * JWT 토큰을 기반으로 현재 인증된 사용자의 정보를 반환합니다.
   * 
   * @param user 현재 인증된 사용자
   * @returns 사용자 정보
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    try {
      const userData = await this.authService.findUserByClerkId(user.userId);
      
      if (!userData) {
        throw new HttpException(
          {
            success: false,
            message: '사용자를 찾을 수 없습니다.',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: {
          id: userData.id,
          nickname: userData.nickname,
          phoneNumber: userData.phoneNumber,
          isPremium: userData.isPremium,
          credits: userData.credits,
          profileImage: userData.profileImage,
          bio: userData.bio,
          age: userData.age,
          gender: userData.gender,
          height: userData.height,
          mbti: userData.mbti,
          location: userData.location,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: '사용자 정보 조회에 실패했습니다.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 토큰 검증
   * 
   * JWT 토큰의 유효성을 검증합니다.
   * 
   * @param body JWT 토큰
   * @returns 검증 결과
   */
  @Post('verify')
  async verifyToken(@Body() body: { token: string }) {
    const result = await this.authService.verifyToken(body.token);
    
    return {
      success: !!result,
      data: result ? { valid: true } : null,
      message: result ? null : '유효하지 않은 토큰입니다.',
    };
  }
}
