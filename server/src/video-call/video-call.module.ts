import { Module } from '@nestjs/common';
import { VideoCallController } from './video-call.controller';
import { VideoCallService } from './video-call.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [VideoCallController],
  providers: [VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {}
