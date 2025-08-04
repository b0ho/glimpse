import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingStatisticsService } from './matching-statistics.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { CacheModule } from '../core/cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationModule, CacheModule, AuthModule],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingStatisticsService],
  exports: [MatchingService, MatchingStatisticsService],
})
export class MatchingModule {}
