import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserDeletionController } from './user-deletion.controller';
import { UserDeletionService } from './user-deletion.service';
import { AccountDeletionSchedulerService } from './account-deletion-scheduler.service';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 사용자 모듈
 *
 * 사용자 프로필 및 관련 기능을 제공합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [UserController, UserDeletionController],
  providers: [UserService, UserDeletionService, AccountDeletionSchedulerService],
  exports: [UserService, UserDeletionService],
})
export class UserModule {}
