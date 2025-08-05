import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

/**
 * 채팅 모듈
 *
 * 실시간 메시징 및 채팅 관리 기능을 제공하는 모듈입니다.
 * 메시지 암호화, 읽음 표시, 타이핑 상태 등을 처리합니다.
 */
@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
