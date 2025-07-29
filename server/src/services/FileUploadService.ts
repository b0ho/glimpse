import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { createError } from '../middleware/errorHandler';
import { prisma } from "../config/database";
import { cloudFrontService } from '../config/cloudfront';
import crypto from 'crypto';



interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  userId: string;
}

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
  blur?: number;
}

export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/mov',
    'video/avi',
    'application/pdf',
    'audio/mp4',
    'audio/m4a',
    'audio/mpeg',
    'audio/webm'
  ];

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'glimpse-uploads';
  }

  getMulterConfig() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Maximum 5 files per request
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('지원하지 않는 파일 형식입니다.'));
        }
      }
    });
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Generate multiple sizes for responsive display
    const sizes = [
      { suffix: 'original', width: 1200, quality: 90 },
      { suffix: 'large', width: 800, quality: 85 },
      { suffix: 'medium', width: 400, quality: 80 },
      { suffix: 'thumbnail', width: 150, quality: 70 }
    ];

    const uploadPromises = sizes.map(async (size) => {
      const processedBuffer = await this.processImage(file.buffer, {
        width: size.width,
        height: size.width, // Square for profile images
        quality: size.quality,
        format: 'jpeg',
        progressive: true
      });

      const filename = `profiles/${userId}/${Date.now()}-${size.suffix}.jpg`;
      return this.uploadToS3(processedBuffer, filename, 'image/jpeg');
    });

    const uploadResults = await Promise.all(uploadPromises);
    const mainResult = uploadResults[1]; // Use 'large' as the main image

    // Convert to CDN URL
    const cdnUrl = cloudFrontService.getCDNUrl(mainResult.url);
    
    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: mainResult.filename,
        url: cdnUrl,
        size: file.size,
        mimeType: 'image/jpeg',
        category: 'PROFILE_IMAGE',
        metadata: {
          variants: uploadResults.map((result, index) => ({
            size: sizes[index].suffix,
            url: cloudFrontService.getCDNUrl(result.url),
            width: sizes[index].width
          }))
        }
      }
    });

    // Update user's profile image
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: cdnUrl }
    });

    // Invalidate CloudFront cache for old profile image if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    });
    
    if (user?.profileImage) {
      const oldKey = this.extractKeyFromUrl(user.profileImage);
      if (oldKey) {
        await cloudFrontService.invalidateCache([`/${oldKey}`]);
      }
    }

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: cdnUrl,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async uploadChatAudio(userId: string, matchId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Verify user is part of the match
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw createError(403, '이 채팅에 음성을 업로드할 권한이 없습니다.');
    }

    const allowedAudioTypes = ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/webm'];
    if (!allowedAudioTypes.includes(file.mimetype)) {
      throw createError(400, '지원하지 않는 오디오 형식입니다.');
    }

    const filename = `chats/${matchId}/audio/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.mimetype.split('/')[1]}`;
    
    const uploadResult = await this.uploadToS3(file.buffer, filename, file.mimetype);
    
    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: file.size,
        mimeType: file.mimetype,
        category: 'CHAT_AUDIO',
        metadata: { matchId }
      }
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: fileRecord.url,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async uploadChatImage(userId: string, matchId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Verify user is part of the match
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      throw createError(403, '이 채팅에 이미지를 업로드할 권한이 없습니다.');
    }

    // Generate optimized versions
    const [mainImage, thumbnail, blurredPreview] = await Promise.all([
      // Main image - optimized for chat viewing
      this.processImage(file.buffer, {
        width: 1200,
        quality: 80,
        format: 'jpeg',
        progressive: true
      }),
      // Thumbnail for chat list preview
      this.processImage(file.buffer, {
        width: 200,
        height: 200,
        quality: 70,
        format: 'jpeg'
      }),
      // Blurred preview for loading state
      this.processImage(file.buffer, {
        width: 50,
        quality: 30,
        format: 'jpeg',
        blur: 20
      })
    ]);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    
    // Upload all versions
    const [mainUpload, thumbUpload, blurUpload] = await Promise.all([
      this.uploadToS3(mainImage, `chats/${matchId}/${timestamp}-${randomId}.jpg`, 'image/jpeg'),
      this.uploadToS3(thumbnail, `chats/${matchId}/${timestamp}-${randomId}-thumb.jpg`, 'image/jpeg'),
      this.uploadToS3(blurredPreview, `chats/${matchId}/${timestamp}-${randomId}-blur.jpg`, 'image/jpeg')
    ]);

    const cdnUrl = cloudFrontService.getCDNUrl(mainUpload.url);
    
    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: mainUpload.filename,
        url: cdnUrl,
        size: mainImage.length,
        mimeType: 'image/jpeg',
        category: 'CHAT_IMAGE',
        metadata: {
          matchId,
          thumbnail: cloudFrontService.getCDNUrl(thumbUpload.url),
          blur: cloudFrontService.getCDNUrl(blurUpload.url),
          dimensions: await this.getImageDimensions(mainImage)
        }
      }
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: cdnUrl,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async uploadGroupImage(userId: string, groupId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Verify user is admin of the group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    if (!groupMember) {
      throw createError(403, '그룹 이미지를 업로드할 권한이 없습니다.');
    }

    // Process group image
    const processedBuffer = await this.processImage(file.buffer, {
      width: 600,
      height: 600,
      quality: 85,
      format: 'jpeg'
    });

    const filename = `groups/${groupId}/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    
    const uploadResult = await this.uploadToS3(processedBuffer, filename, 'image/jpeg');
    
    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: processedBuffer.length,
        mimeType: 'image/jpeg',
        category: 'GROUP_IMAGE',
        metadata: { groupId }
      }
    });

    // Update group image
    await prisma.group.update({
      where: { id: groupId },
      data: { imageUrl: uploadResult.url }
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: fileRecord.url,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async uploadFile(file: Express.Multer.File, userId: string, category: string = 'OTHER'): Promise<UploadedFile> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw createError(400, '지원하지 않는 파일 형식입니다.');
    }

    if (file.size > this.maxFileSize) {
      throw createError(400, '파일 크기가 너무 큽니다. (최대 10MB)');
    }

    const fileExt = path.extname(file.originalname);
    const filename = `${category.toLowerCase()}/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
    
    const uploadResult = await this.uploadToS3(file.buffer, filename, file.mimetype);
    
    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: file.size,
        mimeType: file.mimetype,
        category
      }
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: fileRecord.url,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async uploadVerificationDocument(userId: string, file: Express.Multer.File): Promise<UploadedFile> {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw createError(400, '인증 문서는 JPG, PNG, PDF 형식만 지원합니다.');
    }

    const filename = `verification/${userId}/${Date.now()}-document.${file.mimetype.split('/')[1]}`;
    
    const uploadResult = await this.uploadToS3(file.buffer, filename, file.mimetype);
    
    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: file.size,
        mimeType: file.mimetype,
        category: 'VERIFICATION_DOCUMENT'
      }
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: fileRecord.url,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      userId: fileRecord.userId || userId
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      const filename = urlParts.slice(3).join('/'); // Remove protocol and domain
      
      // Delete from S3
      await this.deleteFromS3(filename);
      
      // Delete from database if exists
      await prisma.file.deleteMany({
        where: { url: fileUrl }
      });

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  async deleteFileById(fileId: string, userId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw createError(404, '파일을 찾을 수 없습니다.');
    }

    if (file.userId !== userId) {
      throw createError(403, '이 파일을 삭제할 권한이 없습니다.');
    }

    try {
      // Delete from S3
      await this.deleteFromS3(file.filename);

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  async getPresignedUploadUrl(userId: string, filename: string, contentType: string): Promise<string> {
    if (!this.allowedMimeTypes.includes(contentType)) {
      throw createError(400, '지원하지 않는 파일 형식입니다.');
    }

    const key = `temp/${userId}/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: this.maxFileSize
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    return signedUrl;
  }

  async getPresignedDownloadUrl(filename: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filename
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    return signedUrl;
  }

  private async processImage(buffer: Buffer, options: ImageProcessingOptions): Promise<Buffer> {
    let image = sharp(buffer);

    // Auto-rotate based on EXIF data
    image = image.rotate();

    // Resize if dimensions specified
    if (options.width || options.height) {
      image = image.resize(options.width, options.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      });
    }

    // Apply blur if requested
    if (options.blur) {
      image = image.blur(options.blur);
    }

    // Set format and quality
    switch (options.format) {
      case 'jpeg':
        image = image.jpeg({ 
          quality: options.quality || 85,
          progressive: options.progressive !== false,
          mozjpeg: true // Use mozjpeg encoder for better compression
        });
        break;
      case 'png':
        image = image.png({ 
          quality: options.quality || 85,
          compressionLevel: 9,
          progressive: options.progressive !== false
        });
        break;
      case 'webp':
        image = image.webp({ 
          quality: options.quality || 85,
          effort: 6 // Higher effort for better compression
        });
        break;
    }

    // Strip metadata for privacy
    image = image.withMetadata({
      orientation: undefined // Keep orientation for proper display
    });

    return await image.toBuffer();
  }

  private async uploadToS3(buffer: Buffer, filename: string, contentType: string): Promise<{ filename: string; url: string }> {
    // Determine ACL based on file type
    const isPublicFile = contentType.startsWith('image/') && 
                        (filename.includes('profile/') || filename.includes('story/'));
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      // Only make profile and story images public
      ...(isPublicFile && { ACL: 'public-read' })
    });

    await this.s3Client.send(command);

    // For private files, we'll generate pre-signed URLs later
    const url = isPublicFile 
      ? `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${filename}`
      : filename; // Store just the key for private files

    return { filename, url };
  }

  private async deleteFromS3(filename: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filename
    });

    await this.s3Client.send(command);
  }

  async generatePresignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filename
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getUserFiles(userId: string, category?: string, page: number = 1, limit: number = 20) {
    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    const files = await prisma.file.findMany({
      where,
      select: {
        id: true,
        originalName: true,
        filename: true,
        url: true,
        size: true,
        mimeType: true,
        category: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalFiles = await prisma.file.count({ where });

    return {
      files,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / limit)
      }
    };
  }

  async getFileUsageStats(userId: string) {
    const [totalFiles, totalSize, categoryStats] = await Promise.all([
      prisma.file.count({ where: { userId } }),
      prisma.file.aggregate({
        where: { userId },
        _sum: { size: true }
      }),
      prisma.file.groupBy({
        by: ['category'],
        where: { userId },
        _count: true,
        _sum: { size: true }
      })
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      categories: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count,
        size: stat._sum.size || 0
      }))
    };
  }

  async cleanupTempFiles(): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find temp files older than 1 day
    const tempFiles = await prisma.file.findMany({
      where: {
        filename: { startsWith: 'temp/' },
        createdAt: { lt: oneDayAgo }
      }
    });

    let cleanedCount = 0;

    for (const file of tempFiles) {
      try {
        await this.deleteFromS3(file.filename);
        await prisma.file.delete({ where: { id: file.id } });
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup temp file ${file.filename}:`, error);
      }
    }

    console.log(`Cleaned up ${cleanedCount} temporary files`);
    return cleanedCount;
  }

  async validateFileOwnership(fileId: string, userId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { userId: true }
    });

    return file?.userId === userId;
  }

  generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(150, 150, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  private extractKeyFromUrl(url: string): string | null {
    // Extract S3 key from URL
    const s3Pattern = /https?:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+)/;
    const cfPattern = /https?:\/\/([^\/]+)\/(.+)/;
    
    let match = url.match(s3Pattern);
    if (match && match[2]) {
      return match[2];
    }
    
    match = url.match(cfPattern);
    if (match && match[2]) {
      return match[2];
    }
    
    return null;
  }

  async optimizeExistingImages(category: string, limit: number = 100): Promise<number> {
    // Batch optimize existing images
    const files = await prisma.file.findMany({
      where: {
        category,
        mimeType: { startsWith: 'image/' }
      },
      take: limit
    });

    let optimizedCount = 0;

    for (const file of files) {
      try {
        // Download original image
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: file.filename
        });
        
        const response = await this.s3Client.send(command);
        const buffer = await streamToBuffer(response.Body);
        
        // Reprocess with optimization
        const optimized = await this.processImage(buffer, {
          quality: 85,
          format: 'jpeg',
          progressive: true
        });
        
        // Upload optimized version
        await this.uploadToS3(optimized, file.filename, 'image/jpeg');
        
        // Invalidate CDN cache
        await cloudFrontService.invalidateCache([`/${file.filename}`]);
        
        optimizedCount++;
      } catch (error) {
        console.error(`Failed to optimize image ${file.id}:`, error);
      }
    }

    return optimizedCount;
  }

  async generateWebPVariants(fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file || !file.mimeType.startsWith('image/')) {
      throw createError(400, 'Invalid image file');
    }

    // Download original
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.filename
    });
    
    const response = await this.s3Client.send(command);
    const buffer = await streamToBuffer(response.Body);
    
    // Generate WebP version
    const webpBuffer = await this.processImage(buffer, {
      format: 'webp',
      quality: 85
    });
    
    // Upload WebP version
    const webpFilename = file.filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    await this.uploadToS3(webpBuffer, webpFilename, 'image/webp');
    
    // Update file metadata
    await prisma.file.update({
      where: { id: fileId },
      data: {
        metadata: {
          ...(file.metadata as any || {}),
          webpUrl: cloudFrontService.getCDNUrl(`https://${this.bucketName}.s3.amazonaws.com/${webpFilename}`)
        }
      }
    });
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export const fileUploadService = new FileUploadService();
