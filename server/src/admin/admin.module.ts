import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { PrismaModule } from '../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { CacheModule } from '../core/cache/cache.module';

@Module({
  imports: [PrismaModule, NotificationModule, CacheModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
