import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { FirebaseModule } from '../core/firebase/firebase.module';

@Module({
  imports: [PrismaModule, FirebaseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
