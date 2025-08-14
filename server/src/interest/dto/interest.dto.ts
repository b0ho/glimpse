import { IsString, IsEnum, IsOptional, IsObject, IsDateString, MaxLength, MinLength } from 'class-validator';
import { InterestType, SearchStatus } from '@prisma/client';

export class CreateInterestSearchDto {
  @IsEnum(InterestType)
  type: InterestType;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  value: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateInterestSearchDto {
  @IsOptional()
  @IsEnum(SearchStatus)
  status?: SearchStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class GetInterestSearchesQueryDto {
  @IsOptional()
  @IsEnum(InterestType)
  type?: InterestType;

  @IsOptional()
  @IsEnum(SearchStatus)
  status?: SearchStatus;
}

export class CheckMatchDto {
  @IsEnum(InterestType)
  type: InterestType;

  @IsString()
  @MinLength(1)
  value: string;
}

export class InterestSearchResponseDto {
  id: string;
  type: InterestType;
  value: string;
  metadata?: Record<string, any>;
  status: SearchStatus;
  matchedWithId?: string;
  matchedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 매칭된 사용자 정보 (익명)
  matchedUser?: {
    nickname: string;
    profileImage?: string;
  };
}

export class InterestMatchResponseDto {
  searchId: string;
  matchedSearchId: string;
  matchedUserId: string;
  matchedUser: {
    nickname: string;
    profileImage?: string;
  };
  matchType: InterestType;
  matchValue: string;
  matchedAt: Date;
}