/**
 * @module Multer
 * @description 파일 업로드 설정 및 관리
 * 
 * Multer를 사용하여 다양한 파일 타입의 업로드를 처리합니다.
 * 메모리 스토리지를 사용하여 업로드된 파일을 임시로 저장하고,
 * MIME 타입과 파일 크기를 검증하여 보안을 강화합니다.
 * 
 * 지원하는 파일 타입:
 * - 이미지: JPEG, PNG, GIF, WebP (최대 10MB)
 * - 비디오: MP4, QuickTime, AVI, MKV (최대 100MB)
 * - 오디오: MP3, WAV, OGG, M4A (최대 20MB)
 * - 문서: PDF, JPEG, PNG (최대 10MB)
 * 
 * 보안 고려사항:
 * - 허용된 MIME 타입만 업로드 가능
 * - 파일 크기 제한으로 서버 리소스 보호
 * - 메모리 스토리지로 임시 파일 시스템 접근 방지
 */

import multer from 'multer';
import type { Express } from 'express';

/**
 * 메모리 스토리지 설정
 * 
 * 업로드된 파일을 메모리에 임시 저장합니다.
 * 파일은 Buffer 형태로 저장되어 S3 업로드 등의 후처리에 바로 사용할 수 있습니다.
 * 
 * @constant {multer.StorageEngine}
 */
const storage = multer.memoryStorage();

/**
 * 파일 타입별 필터 생성 함수
 * 
 * 허용된 MIME 타입 목록을 받아 파일 필터 함수를 생성합니다.
 * 업로드되는 파일의 MIME 타입을 검증하여 보안을 강화합니다.
 * 
 * @param allowedMimeTypes - 허용할 MIME 타입 배열
 * @returns Multer 파일 필터 함수
 */
const createFileFilter = (allowedMimeTypes: string[]) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  };
};

/**
 * 이미지 파일 필터
 * 
 * 프로필 사진, 채팅 이미지 등에 사용되는 이미지 파일만 허용합니다.
 * 지원 포맷: JPEG, PNG, GIF, WebP
 * 
 * @constant {Function}
 */
const imageFileFilter = createFileFilter([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]);

/**
 * 비디오 파일 필터
 * 
 * 스토리나 미디어 메시지용 비디오 파일만 허용합니다.
 * 지원 포맷: MP4, QuickTime, AVI, MKV
 * 
 * @constant {Function}
 */
const videoFileFilter = createFileFilter([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska'
]);

/**
 * 오디오 파일 필터
 * 
 * 음성 메시지나 오디오 콘텐츠용 오디오 파일만 허용합니다.
 * 지원 포맷: MP3, WAV, OGG, M4A
 * 
 * @constant {Function}
 */
const audioFileFilter = createFileFilter([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a'
]);

/**
 * 미디어 파일 통합 필터
 * 
 * 스토리 기능에서 이미지와 비디오를 모두 업로드할 수 있도록 합니다.
 * 이미지와 비디오 파일을 동시에 지원합니다.
 * 
 * @constant {Function}
 */
const mediaFileFilter = createFileFilter([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime'
]);

/**
 * 문서 파일 필터
 * 
 * 회사 인증이나 신분증 확인용 문서 파일만 허용합니다.
 * 지원 포맷: PDF, JPEG, PNG
 * 
 * @constant {Function}
 */
const documentFileFilter = createFileFilter([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]);

/**
 * 이미지 업로드 설정
 * 
 * 프로필 사진, 채팅 이미지 등 일반적인 이미지 파일 업로드에 사용됩니다.
 * 최대 파일 크기: 10MB
 * 
 * @constant {multer.Multer}
 */
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 비디오 업로드 설정
 * 
 * 스토리나 미디어 메시지용 비디오 파일 업로드에 사용됩니다.
 * 최대 파일 크기: 100MB
 * 
 * @constant {multer.Multer}
 */
export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * 오디오 업로드 설정
 * 
 * 음성 메시지나 오디오 콘텐츠 업로드에 사용됩니다.
 * 최대 파일 크기: 20MB
 * 
 * @constant {multer.Multer}
 */
export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

/**
 * 미디어 업로드 설정 (통합)
 * 
 * 이미지와 비디오를 모두 지원하는 통합 업로드 설정입니다.
 * 스토리 기능에서 다양한 미디어 타입을 업로드할 때 사용됩니다.
 * 최대 파일 크기: 100MB
 * 
 * @constant {multer.Multer}
 */
export const uploadMedia = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * 문서 업로드 설정
 * 
 * 회사 인증서, 신분증 등 문서 파일 업로드에 사용됩니다.
 * 최대 파일 크기: 10MB
 * 
 * @constant {multer.Multer}
 */
export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 기본 업로드 설정
 * 
 * 하위 호환성을 위한 기본 업로드 설정입니다.
 * uploadMedia와 동일한 설정을 사용합니다.
 * 
 * @constant {multer.Multer}
 */
export const upload = uploadMedia;