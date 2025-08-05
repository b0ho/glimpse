import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthGuard } from './guards/auth.guard';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 인증 모듈
 *
 * Clerk JWT 기반 인증 시스템을 제공합니다.
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('CLERK_SECRET_KEY'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard, WsAuthGuard],
  exports: [AuthService, PassportModule, AuthGuard, WsAuthGuard],
})
export class AuthModule {}
