import { Global, Module } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * 메시지 큐 모듈
 *
 * Redis 기반 메시지 큐 시스템을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [MessageQueueService],
  exports: [MessageQueueService],
})
export class MessageQueueModule {}
