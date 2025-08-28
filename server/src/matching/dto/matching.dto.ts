import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { RelationshipIntent } from '@prisma/client';

/**
 * 좋아요 생성 DTO
 */
export class CreateLikeDto {
  @IsString()
  targetUserId: string;

  @IsString()
  groupId: string;

  @IsEnum(RelationshipIntent)
  relationshipIntent: RelationshipIntent;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * 슈퍼 좋아요 생성 DTO
 */
export class CreateSuperLikeDto extends CreateLikeDto {
  @IsString()
  message: string;
}

/**
 * 매치 목록 조회 쿼리 DTO
 */
export class GetMatchesQueryDto {
  @IsOptional()
  @IsString()
  groupId?: string;

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
 * 매치 해제 DTO
 */
export class UnmatchDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
