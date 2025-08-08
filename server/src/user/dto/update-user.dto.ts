import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Sanitize,
  SanitizeUrl,
} from '../../common/decorators/sanitize.decorator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class UpdateUserDto {
  @ApiProperty({ description: '닉네임', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Sanitize()
  nickname?: string;

  @ApiProperty({ description: '자기소개', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Sanitize()
  bio?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsUrl()
  @SanitizeUrl()
  profileImage?: string;

  @ApiProperty({ description: '성별', enum: Gender, required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: '생년월일', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: '관심사', required: false })
  @IsOptional()
  @IsString({ each: true })
  @Sanitize()
  interests?: string[];

  @ApiProperty({ description: '직업', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Sanitize()
  occupation?: string;

  @ApiProperty({ description: '학력', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Sanitize()
  education?: string;
}
