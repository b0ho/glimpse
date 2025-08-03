import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 사용자 모듈
 * 
 * 사용자 프로필 및 관련 기능을 제공합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
