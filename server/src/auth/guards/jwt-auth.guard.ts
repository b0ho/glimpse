import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 *
 * JWT 토큰을 요구하는 보호된 라우트에 사용됩니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
