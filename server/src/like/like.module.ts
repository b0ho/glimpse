import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { PrismaModule } from '../core/prisma/prisma.module';

/**
 * 좋아요 모듈
 * 
 * 좋아요 전송, 조회, 취소 기능을 제공합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [LikeController],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
