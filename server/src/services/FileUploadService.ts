import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { createError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    'application/pdf'
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
    // Process and optimize image
    const processedBuffer = await this.processImage(file.buffer, {
      width: 800,
      height: 800,
      quality: 85,
      format: 'jpeg'
    });

    const filename = `profiles/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    
    const uploadResult = await this.uploadToS3(processedBuffer, filename, 'image/jpeg');
    
    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: processedBuffer.length,
        mimeType: 'image/jpeg',
        category: 'PROFILE_IMAGE'
      }
    });

    // Update user's profile image
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: uploadResult.url }
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

    // Process image for chat (smaller, optimized)
    const processedBuffer = await this.processImage(file.buffer, {
      width: 1200,
      quality: 80,
      format: 'jpeg'
    });

    const filename = `chats/${matchId}/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    
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
        category: 'CHAT_IMAGE',
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

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
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

    // Resize if dimensions specified
    if (options.width || options.height) {
      image = image.resize(options.width, options.height, {
        fit: 'cover',
        position: 'center'
      });
    }

    // Set format and quality
    switch (options.format) {
      case 'jpeg':
        image = image.jpeg({ quality: options.quality || 85 });
        break;
      case 'png':
        image = image.png({ quality: options.quality || 85 });
        break;
      case 'webp':
        image = image.webp({ quality: options.quality || 85 });
        break;
    }

    return await image.toBuffer();
  }

  private async uploadToS3(buffer: Buffer, filename: string, contentType: string): Promise<{ filename: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await this.s3Client.send(command);

    const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${filename}`;

    return { filename, url };
  }

  private async deleteFromS3(filename: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filename
    });

    await this.s3Client.send(command);
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
}