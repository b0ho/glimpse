import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { MessageType } from '@prisma/client';

/**
 * 메시지 전송 DTO
 */
export class SendMessageDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

/**
 * 메시지 반응 DTO
 */
export class MessageReactionDto {
  @IsString()
  @MaxLength(10)
  emoji: string;
}

/**
 * 메시지 검색 DTO
 */
export class SearchMessagesDto {
  @IsString()
  @MaxLength(100)
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 타이핑 상태 DTO
 */
export class SetTypingStatusDto {
  @IsBoolean()
  isTyping: boolean;
}

/**
 * 페이지네이션 쿼리 DTO
 */
export class PaginationQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
