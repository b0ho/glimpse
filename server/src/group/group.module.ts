import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 그룹 모듈
 * 
 * 그룹 생성, 관리, 멤버십 기능을 제공합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
