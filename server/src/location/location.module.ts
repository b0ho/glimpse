import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { CacheModule } from '../core/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
