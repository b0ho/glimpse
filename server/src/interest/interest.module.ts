import { Module } from '@nestjs/common';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { EncryptionModule } from '../core/encryption/encryption.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    NotificationModule,
    AuthModule,
  ],
  controllers: [InterestController],
  providers: [InterestService],
  exports: [InterestService],
})
export class InterestModule {}