import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
} from 'class-validator';

/**
 * 사용자 차단/해제 DTO
 */
export class BanUserDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsEnum(['ban', 'suspend'])
  action: 'ban' | 'suspend';
}

/**
 * 그룹 승인/거절 DTO
 */
export class ModerateGroupDto {
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * 그룹 관리 DTO
 */
export class ManageGroupDto {
  @IsEnum(['approve', 'deactivate'])
  action: 'approve' | 'deactivate';

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * 신고 처리 DTO
 */
export class HandleReportDto {
  @IsEnum(['WARN', 'BLOCK', 'DISMISS'])
  action: 'WARN' | 'BLOCK' | 'DISMISS';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  blockDurationDays?: number;
}

/**
 * 통계 조회 쿼리 DTO
 */
export class GetStatsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY'])
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

/**
 * 관리자 통계 쿼리 DTO
 */
export class AdminStatsQueryDto extends GetStatsQueryDto {}

/**
 * 사용자 목록 조회 쿼리 DTO
 */
export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'BANNED', 'DELETED'])
  status?: 'ACTIVE' | 'BANNED' | 'DELETED';

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

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
 * 사용자 목록 조회 쿼리 DTO (별칭)
 */
export class UserListQueryDto extends GetUsersQueryDto {
  @IsOptional()
  @IsEnum(['all', 'premium', 'banned'])
  filter?: 'all' | 'premium' | 'banned';
}

/**
 * 공지사항 생성 DTO
 */
export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['INFO', 'WARNING', 'CRITICAL'])
  type?: 'INFO' | 'WARNING' | 'CRITICAL';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetGroups?: string[];
}

/**
 * 브로드캐스트 알림 DTO
 */
export class BroadcastNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(['all', 'premium', 'active'])
  targetAudience?: 'all' | 'premium' | 'active';
}
