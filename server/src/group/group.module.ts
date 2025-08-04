import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { PrismaModule } from '../core/prisma/prisma.module';
import { CacheModule } from '../core/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService],
})
export class GroupModule {}
