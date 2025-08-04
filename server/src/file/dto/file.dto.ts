import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

/**
 * 이미지 처리 옵션 DTO
 */
export class ImageProcessingOptionsDto {
  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  quality?: number;

  @IsOptional()
  @IsEnum(['jpeg', 'png', 'webp'])
  format?: 'jpeg' | 'png' | 'webp';

  @IsOptional()
  progressive?: boolean;

  @IsOptional()
  @IsNumber()
  blur?: number;
}

/**
 * 프로필 이미지 업로드 응답 DTO
 */
export class ProfileImageUploadResponseDto {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
}

/**
 * 채팅 이미지 업로드 응답 DTO
 */
export class ChatImageUploadResponseDto {
  url: string;
  thumbnailUrl: string;
  previewUrl: string;
}

/**
 * 파일 사용량 통계 DTO
 */
export class FileStatsDto {
  totalFiles: number;
  totalSize: number;
  categories: Record<string, {
    count: number;
    size: number;
  }>;
}