import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 매칭 모듈
 * 
 * 매칭 목록 조회, 매칭 관리, 채팅 시작 기능을 제공합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
