import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  radius?: number = 1; // 기본 1km

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24)
  durationHours?: number = 4; // 기본 4시간
}

export class JoinLocationGroupDto {
  @IsString()
  qrCode: string;
}