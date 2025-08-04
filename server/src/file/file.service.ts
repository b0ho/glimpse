import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../core/prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import * as sharp from 'sharp';
import * as crypto from 'crypto';
import { Express } from 'express';
// import { generateId } from '@shared/utils';

const generateId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

const validateFileType = (mimeType: string, allowedTypes?: string[]): boolean => {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2);
      return mimeType.startsWith(baseType + '/');
    }
    return mimeType === type;
  });
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};
import {
  ImageProcessingOptionsDto,
  ProfileImageUploadResponseDto,
  ChatImageUploadResponseDto,
  FileStatsDto,
} from './dto/file.dto';

/**
 * 파일 업로드 및 처리 서비스
 * 
 * S3 업로드, 이미지 처리, CloudFront CDN 통합을 담당합니다.
 */
@Injectable()
export class FileService {
  private s3Client: S3Client;
  // private cloudFrontClient: CloudFrontClient;
  private bucketName: string;
  private cloudFrontDomain: string;
  private cloudFrontDistributionId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
    this.cloudFrontDomain = this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN') || '';
    this.cloudFrontDistributionId = this.configService.get<string>('AWS_CLOUDFRONT_DISTRIBUTION_ID') || '';

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    // this.cloudFrontClient = new CloudFrontClient({
    //   region: this.configService.get<string>('AWS_REGION'),
    //   credentials: {
    //     accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
    //     secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    //   },
    // });
  }

  /**
   * 프로필 이미지 업로드
   * 
   * @param file 업로드 파일
   * @param userId 사용자 ID
   * @returns 이미지 URL들
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<ProfileImageUploadResponseDto> {
    // 파일 타입 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new HttpException('허용되지 않은 파일 형식입니다.', HttpStatus.BAD_REQUEST);
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException('파일 크기는 10MB를 초과할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const imageBuffer = file.buffer;
    const fileId = generateId();
    const timestamp = Date.now();

    // 이미지 처리 및 여러 버전 생성
    const versions = await Promise.all([
      // 원본 (최대 1200x1200)
      this.processImage(imageBuffer, {
        width: 1200,
        height: 1200,
        quality: 90,
        progressive: true,
      }),
      // 대형 (600x600)
      this.processImage(imageBuffer, {
        width: 600,
        height: 600,
        quality: 85,
        progressive: true,
      }),
      // 중형 (300x300)
      this.processImage(imageBuffer, {
        width: 300,
        height: 300,
        quality: 85,
        progressive: true,
      }),
      // 썸네일 (100x100)
      this.processImage(imageBuffer, {
        width: 100,
        height: 100,
        quality: 80,
      }),
    ]);

    const versionNames = ['original', 'large', 'medium', 'thumbnail'];
    const uploadedUrls: Record<string, string> = {};

    // S3에 업로드
    for (let i = 0; i < versions.length; i++) {
      const key = `profiles/${userId}/${fileId}_${versionNames[i]}_${timestamp}.jpg`;
      await this.uploadToS3(key, versions[i], 'image/jpeg', true); // 프로필은 퍼블릭
      uploadedUrls[versionNames[i]] = this.getCloudFrontUrl(key);
    }

    // 데이터베이스에 저장
    await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        // fileKey: `profiles/${userId}/${fileId}_original_${timestamp}.jpg`,
        url: uploadedUrls.original,
        size: file.size,
        mimeType: 'image/jpeg',
        category: 'PROFILE',
      },
    });

    // 사용자 프로필 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: uploadedUrls.original,
      },
    });

    // 기존 이미지가 있다면 CloudFront 캐시 무효화
    await this.invalidateCloudFrontCache([
      `profiles/${userId}/*`,
    ]);

    return uploadedUrls as unknown as ProfileImageUploadResponseDto;
  }

  /**
   * 채팅 이미지 업로드
   * 
   * @param file 업로드 파일
   * @param userId 사용자 ID
   * @param matchId 매치 ID
   * @returns 이미지 URL들
   */
  async uploadChatImage(
    file: Express.Multer.File,
    userId: string,
    matchId: string,
  ): Promise<ChatImageUploadResponseDto> {
    // 매치 권한 확인
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw new HttpException('매치에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    // 파일 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new HttpException('허용되지 않은 파일 형식입니다.', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException('파일 크기는 10MB를 초과할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const imageBuffer = file.buffer;
    const fileId = generateId();
    const timestamp = Date.now();

    // 이미지 처리
    const [main, thumbnail, preview] = await Promise.all([
      // 메인 이미지 (최대 1200px)
      this.processImage(imageBuffer, {
        width: 1200,
        height: 1200,
        quality: 85,
        progressive: true,
      }),
      // 썸네일 (200x200)
      this.processImage(imageBuffer, {
        width: 200,
        height: 200,
        quality: 80,
      }),
      // 블러 프리뷰 (50x50)
      this.processImage(imageBuffer, {
        width: 50,
        height: 50,
        quality: 60,
        blur: 20,
      }),
    ]);

    // S3 업로드
    const mainKey = `chats/${matchId}/${fileId}_${timestamp}.jpg`;
    const thumbnailKey = `chats/${matchId}/${fileId}_thumb_${timestamp}.jpg`;
    const previewKey = `chats/${matchId}/${fileId}_preview_${timestamp}.jpg`;

    await Promise.all([
      this.uploadToS3(mainKey, main, 'image/jpeg'),
      this.uploadToS3(thumbnailKey, thumbnail, 'image/jpeg'),
      this.uploadToS3(previewKey, preview, 'image/jpeg'),
    ]);

    // 데이터베이스에 저장
    const fileRecord = await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        // fileKey: mainKey,
        url: this.getCloudFrontUrl(mainKey),
        size: file.size,
        mimeType: 'image/jpeg',
        category: 'CHAT',
        metadata: {
          matchId,
          thumbnailUrl: this.getCloudFrontUrl(thumbnailKey),
          previewUrl: this.getCloudFrontUrl(previewKey),
        },
      },
    });

    return {
      url: fileRecord.url,
      thumbnailUrl: this.getCloudFrontUrl(thumbnailKey),
      previewUrl: this.getCloudFrontUrl(previewKey),
    };
  }

  /**
   * 음성 파일 업로드 (채팅용)
   * 
   * @param file 오디오 파일
   * @param userId 사용자 ID
   * @param matchId 매치 ID
   * @returns 오디오 URL
   */
  async uploadChatAudio(
    file: Express.Multer.File,
    userId: string,
    matchId: string,
  ): Promise<{ url: string; duration?: number }> {
    // 매치 권한 확인
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw new HttpException('매치에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    // 파일 검증
    const allowedTypes = ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException('허용되지 않은 오디오 형식입니다.', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new HttpException('오디오 파일은 5MB를 초과할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const fileId = generateId();
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const key = `audio/${matchId}/${fileId}_${timestamp}.${extension}`;

    // S3 업로드
    await this.uploadToS3(key, file.buffer, file.mimetype);

    // 데이터베이스에 저장
    const fileRecord = await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        // fileKey: key,
        url: this.getCloudFrontUrl(key),
        size: file.size,
        mimeType: file.mimetype,
        category: 'AUDIO',
        metadata: { matchId },
      },
    });

    return { url: fileRecord.url };
  }

  /**
   * 그룹 이미지 업로드
   * 
   * @param file 업로드 파일
   * @param userId 사용자 ID
   * @param groupId 그룹 ID
   * @returns 이미지 URL
   */
  async uploadGroupImage(
    file: Express.Multer.File,
    userId: string,
    groupId: string,
  ): Promise<{ url: string }> {
    // 그룹 관리자 권한 확인
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership || (membership.role !== 'CREATOR' && membership.role !== 'ADMIN')) {
      throw new HttpException('그룹 이미지 변경 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    // 파일 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new HttpException('허용되지 않은 파일 형식입니다.', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new HttpException('파일 크기는 5MB를 초과할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const imageBuffer = file.buffer;
    const fileId = generateId();
    const timestamp = Date.now();

    // 이미지 처리 (600x600 정사각형)
    const processed = await this.processImage(imageBuffer, {
      width: 600,
      height: 600,
      quality: 85,
      progressive: true,
    });

    const key = `groups/${groupId}/${fileId}_${timestamp}.jpg`;
    await this.uploadToS3(key, processed, 'image/jpeg', true); // 그룹 이미지는 퍼블릭

    const url = this.getCloudFrontUrl(key);

    // 데이터베이스에 저장
    await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        // fileKey: key,
        url,
        size: file.size,
        mimeType: 'image/jpeg',
        category: 'GROUP',
        metadata: { groupId },
      },
    });

    // 그룹 정보 업데이트
    await this.prisma.group.update({
      where: { id: groupId },
      data: { imageUrl: url },
    });

    // CloudFront 캐시 무효화
    await this.invalidateCloudFrontCache([`groups/${groupId}/*`]);

    return { url };
  }

  /**
   * 인증 문서 업로드
   * 
   * @param file 업로드 파일
   * @param userId 사용자 ID
   * @param type 문서 타입
   * @returns 문서 URL
   */
  async uploadVerificationDocument(
    file: Express.Multer.File,
    userId: string,
    type: string,
  ): Promise<{ url: string; fileId: string }> {
    // 파일 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException('JPG, PNG, PDF 파일만 업로드 가능합니다.', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException('파일 크기는 10MB를 초과할 수 없습니다.', HttpStatus.BAD_REQUEST);
    }

    const fileId = generateId();
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const key = `verifications/${userId}/${type}/${fileId}_${timestamp}.${extension}`;

    // S3 업로드 (프라이빗)
    await this.uploadToS3(key, file.buffer, file.mimetype, false);

    // 데이터베이스에 저장
    const fileRecord = await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        // fileKey: key,
        url: key, // 프라이빗 파일은 key만 저장
        size: file.size,
        mimeType: file.mimetype,
        category: 'VERIFICATION',
        metadata: { type },
      },
    });

    // 서명된 URL 생성 (1시간 유효)
    const signedUrl = await this.getSignedUrl(key, 3600);

    return {
      url: signedUrl,
      fileId: fileRecord.id,
    };
  }

  /**
   * 단일 파일 업로드 (스토리 등)
   * 
   * @param file 업로드할 파일
   * @param userId 사용자 ID
   * @param purpose 파일 용도
   */
  async uploadSingleFile(
    file: Express.Multer.File,
    userId: string,
    purpose: 'STORY' | 'POST' | 'OTHER' = 'OTHER',
  ): Promise<{ url: string; fileId: string }> {
    // 파일 크기 제한 (용도별로 다름)
    const maxSizes = {
      STORY: 50 * 1024 * 1024, // 50MB (동영상 포함)
      POST: 20 * 1024 * 1024,  // 20MB
      OTHER: 10 * 1024 * 1024, // 10MB
    };

    if (file.size > maxSizes[purpose]) {
      throw new HttpException(
        `파일 크기는 ${maxSizes[purpose] / (1024 * 1024)}MB를 초과할 수 없습니다.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const fileId = generateId();
    const timestamp = Date.now();
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    let processedBuffer = file.buffer;
    let finalMimeType = file.mimetype;
    
    // 이미지인 경우 처리
    if (isImage) {
      processedBuffer = await this.processImage(file.buffer, {
        width: 1200,
        height: 1200,
        quality: 85,
        progressive: true,
      });
      finalMimeType = 'image/jpeg';
    }

    // S3 키 생성
    const extension = isImage ? 'jpg' : file.originalname.split('.').pop() || 'bin';
    const key = `${purpose.toLowerCase()}/${userId}/${fileId}_${timestamp}.${extension}`;

    // S3 업로드
    await this.uploadToS3(key, processedBuffer, finalMimeType, true);

    // CloudFront URL 생성
    const url = this.getCloudFrontUrl(key);

    // 데이터베이스에 저장
    const fileRecord = await this.prisma.file.create({
      data: {
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: key,
        url,
        metadata: {
          isVideo,
          isImage,
          uploadType: purpose,
        },
      },
    });

    return {
      url,
      fileId: fileRecord.id,
    };
  }

  /**
   * 파일 삭제
   * 
   * @param fileId 파일 ID
   * @param userId 사용자 ID
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new HttpException('파일을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (file.userId !== userId) {
      throw new HttpException('파일 삭제 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    // S3에서 삭제
    await this.deleteFromS3(file.path || 'unknown');

    // 관련 파일들도 삭제 (썸네일 등)
    if (file.metadata && typeof file.metadata === 'object') {
      const metadata = file.metadata as any;
      if (metadata.thumbnailUrl) {
        const thumbnailKey = this.getKeyFromUrl(metadata.thumbnailUrl);
        await this.deleteFromS3(thumbnailKey);
      }
      if (metadata.previewUrl) {
        const previewKey = this.getKeyFromUrl(metadata.previewUrl);
        await this.deleteFromS3(previewKey);
      }
    }

    // 데이터베이스에서 삭제
    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }

  /**
   * 사용자 파일 사용량 통계
   * 
   * @param userId 사용자 ID
   * @returns 파일 통계
   */
  async getUserFileStats(userId: string): Promise<FileStatsDto> {
    const files = await this.prisma.file.findMany({
      where: { userId },
      select: {
        size: true,
        category: true,
      },
    });

    const stats: FileStatsDto = {
      totalFiles: files.length,
      totalSize: 0,
      categories: {},
    };

    for (const file of files) {
      stats.totalSize += file.size;
      
      const category = file.category || 'OTHER';
      if (!stats.categories[category]) {
        stats.categories[category] = { count: 0, size: 0 };
      }
      
      stats.categories[category].count++;
      stats.categories[category].size += file.size;
    }

    return stats;
  }

  /**
   * 임시 파일 정리
   * 1일 이상 된 임시 파일 삭제
   */
  async cleanupTempFiles(): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const tempFiles = await this.prisma.file.findMany({
      where: {
        category: 'TEMP',
        createdAt: { lt: oneDayAgo },
      },
    });

    for (const file of tempFiles) {
      await this.deleteFromS3(file.path || 'unknown');
    }

    const result = await this.prisma.file.deleteMany({
      where: {
        category: 'TEMP',
        createdAt: { lt: oneDayAgo },
      },
    });

    return result.count;
  }

  /**
   * 이미지 처리
   * 
   * @param buffer 이미지 버퍼
   * @param options 처리 옵션
   * @returns 처리된 이미지 버퍼
   */
  private async processImage(
    buffer: Buffer,
    options: ImageProcessingOptionsDto,
  ): Promise<Buffer> {
    let pipeline = (sharp as any)(buffer);

    // EXIF 데이터 기반 자동 회전
    pipeline = pipeline.rotate();

    // 리사이징
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'cover',
        position: 'center',
      });
    }

    // 블러 처리
    if (options.blur) {
      pipeline = pipeline.blur(options.blur);
    }

    // 포맷 변환 및 품질 설정
    const format = options.format || 'jpeg';
    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({
        quality: options.quality || 85,
        progressive: options.progressive || false,
      });
    } else if (format === 'png') {
      pipeline = pipeline.png({
        quality: options.quality || 90,
        progressive: options.progressive || false,
      });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({
        quality: options.quality || 85,
      });
    }

    // 메타데이터 제거 (프라이버시)
    pipeline = pipeline.withMetadata(false);

    return pipeline.toBuffer();
  }

  /**
   * S3 업로드
   * 
   * @param key S3 키
   * @param buffer 파일 버퍼
   * @param mimeType MIME 타입
   * @param isPublic 퍼블릭 여부
   */
  private async uploadToS3(
    key: string,
    buffer: Buffer,
    mimeType: string,
    isPublic: boolean = false,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: isPublic ? 'public-read' : 'private',
    });

    await this.s3Client.send(command);
  }

  /**
   * S3에서 파일 삭제
   * 
   * @param key S3 키
   */
  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * CloudFront URL 생성
   * 
   * @param key S3 키
   * @returns CloudFront URL
   */
  private getCloudFrontUrl(key: string): string {
    return `https://${this.cloudFrontDomain}/${key}`;
  }

  /**
   * URL에서 S3 키 추출
   * 
   * @param url CloudFront URL
   * @returns S3 키
   */
  private getKeyFromUrl(url: string): string {
    return url.replace(`https://${this.cloudFrontDomain}/`, '');
  }

  /**
   * 서명된 URL 생성
   * 
   * @param key S3 키
   * @param expiresIn 유효 시간 (초)
   * @returns 서명된 URL
   */
  private async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * CloudFront 캐시 무효화
   * 
   * @param paths 무효화할 경로들
   */
  private async invalidateCloudFrontCache(paths: string[]): Promise<void> {
    // CloudFront invalidation disabled until CloudFront client is configured
    console.log('CloudFront invalidation requested for paths:', paths);
    // const command = new CreateInvalidationCommand({
    //   DistributionId: this.cloudFrontDistributionId,
    //   InvalidationBatch: {
    //     CallerReference: Date.now().toString(),
    //     Paths: {
    //       Quantity: paths.length,
    //       Items: paths,
    //     },
    //   },
    // });
    //
    // await this.cloudFrontClient.send(command);
  }
}