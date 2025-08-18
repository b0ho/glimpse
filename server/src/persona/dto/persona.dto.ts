import { IsString, IsOptional, IsInt, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonaDto {
  @ApiProperty({ description: 'Persona nickname (different from main nickname)' })
  @IsString()
  nickname: string;

  @ApiProperty({ description: 'Age', required: false })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  age?: number;

  @ApiProperty({ description: 'Bio/Introduction', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Interests', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiProperty({ description: 'Occupation', required: false })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ description: 'Height in cm', required: false })
  @IsOptional()
  @IsInt()
  @Min(140)
  @Max(220)
  height?: number;

  @ApiProperty({ description: 'MBTI type', required: false })
  @IsOptional()
  @IsString()
  mbti?: string;

  @ApiProperty({ description: 'Drinking habits', required: false })
  @IsOptional()
  @IsString()
  drinking?: string;

  @ApiProperty({ description: 'Smoking habits', required: false })
  @IsOptional()
  @IsString()
  smoking?: string;
}

export class UpdatePersonaDto extends CreatePersonaDto {}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude' })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: 'Enable location sharing' })
  @IsOptional()
  @IsBoolean()
  locationSharingEnabled?: boolean;
}

export class GetNearbyPersonasDto {
  @ApiProperty({ description: 'Current latitude' })
  latitude: number;

  @ApiProperty({ description: 'Current longitude' })
  longitude: number;

  @ApiProperty({ description: 'Search radius in km', required: false, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  radiusKm?: number;
}