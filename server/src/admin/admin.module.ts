import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { PrismaModule } from '../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { CacheModule } from '../core/cache/cache.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    CacheModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development_jwt_secret_key_12345',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
