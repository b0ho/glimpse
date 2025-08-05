import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { GroupType } from '@prisma/client';

/**
 * 그룹 생성 DTO
 */
export class CreateGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(GroupType)
  type: GroupType;

  @IsObject()
  settings: any;

  @IsOptional()
  @IsObject()
  location?: any;

  @IsOptional()
  @IsString()
  companyId?: string;
}

/**
 * 그룹 수정 DTO
 */
export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  settings?: any;

  @IsOptional()
  @IsObject()
  location?: any;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(1000)
  maxMembers?: number;
}

/**
 * 그룹 목록 조회 쿼리 DTO
 */
export class GetGroupsQueryDto {
  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

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
 * 멤버 역할 변경 DTO
 */
export class UpdateMemberRoleDto {
  @IsEnum(['ADMIN', 'MEMBER'])
  role: 'ADMIN' | 'MEMBER';
}

/**
 * 가입 승인/거절 DTO
 */
export class ApproveJoinRequestDto {
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
