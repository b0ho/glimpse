/**
 * @module CloudFront
 * @description AWS CloudFront CDN 서비스 설정 및 관리
 * 
 * CloudFront는 Amazon의 전 세계 콘텐츠 전송 네트워크(CDN) 서비스로,
 * Glimpse 앱에서 이미지 및 미디어 파일의 빠른 배포와 캐싱을 담당합니다.
 * 
 * 주요 기능:
 * - S3 URL을 CloudFront URL로 변환
 * - 캐시 무효화 관리
 * - 이미지 최적화 URL 생성
 * - 반응형 이미지 URL 생성
 */

import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

/**
 * CloudFront 서비스 설정 인터페이스
 * @interface CloudFrontConfig
 */
interface CloudFrontConfig {
  /** CloudFront 배포 ID */
  distributionId: string;
  /** CloudFront 도메인 이름 */
  domainName: string;
  /** AWS 리전 */
  region: string;
}

/**
 * CloudFront CDN 서비스 관리 클래스
 * 
 * AWS CloudFront를 통한 콘텐츠 배포 및 캐싱 관리를 담당합니다.
 * 이미지 최적화, URL 변환, 캐시 무효화 등의 기능을 제공합니다.
 * 
 * @class CloudFrontService
 */
export class CloudFrontService {
  /** CloudFront 클라이언트 인스턴스 */
  private client: CloudFrontClient;
  /** CloudFront 설정 정보 */
  private config: CloudFrontConfig;

  /**
   * CloudFrontService 생성자
   * 환경변수에서 AWS 설정을 읽어와 CloudFront 클라이언트를 초기화합니다.
   * 
   * 필요한 환경변수:
   * - CLOUDFRONT_DISTRIBUTION_ID: CloudFront 배포 ID
   * - CLOUDFRONT_DOMAIN_NAME: CloudFront 도메인
   * - AWS_REGION: AWS 리전 (기본값: ap-northeast-2)
   * - AWS_ACCESS_KEY_ID: AWS 액세스 키
   * - AWS_SECRET_ACCESS_KEY: AWS 시크릿 키
   */
  constructor() {
    this.config = {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
      domainName: process.env.CLOUDFRONT_DOMAIN_NAME || '',
      region: process.env.AWS_REGION || 'ap-northeast-2'
    };

    this.client = new CloudFrontClient({
      region: this.config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * S3 URL을 CloudFront URL로 변환
   * 
   * S3의 직접 URL을 CloudFront CDN URL로 변환하여 빠른 콘텐츠 배포를 지원합니다.
   * CloudFront가 설정되지 않은 경우 원본 S3 URL을 반환합니다.
   * 
   * @param s3Url - 변환할 S3 URL
   * @returns CloudFront URL 또는 원본 S3 URL
   */
  getCDNUrl(s3Url: string): string {
    if (!this.config.domainName) {
      return s3Url; // Fallback to S3 URL if CloudFront not configured
    }

    // Extract the key from S3 URL
    const s3Pattern = /https?:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+)/;
    const match = s3Url.match(s3Pattern);
    
    if (match && match[2]) {
      const key = match[2];
      return `https://${this.config.domainName}/${key}`;
    }

    // If already a CloudFront URL or doesn't match pattern, return as is
    return s3Url;
  }

  /**
   * 특정 경로의 CloudFront 캐시 무효화
   * 
   * 콘텐츠가 업데이트되었을 때 CDN 캐시를 강제로 새로고침합니다.
   * 사용자가 즉시 최신 콘텐츠를 볼 수 있도록 보장합니다.
   * 
   * @param paths - 무효화할 경로 배열 (예: ['/images/*', '/videos/video.mp4'])
   * @throws {Error} 캐시 무효화 실패 시
   */
  async invalidateCache(paths: string[]): Promise<void> {
    if (!this.config.distributionId) {
      console.warn('CloudFront distribution ID not configured');
      return;
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.config.distributionId,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      });

      await this.client.send(command);
      console.log(`CloudFront cache invalidated for ${paths.length} paths`);
    } catch (error) {
      console.error('Failed to invalidate CloudFront cache:', error);
      throw error;
    }
  }

  /**
   * 최적화된 이미지 URL 생성
   * 
   * CloudFront와 Lambda@Edge를 활용하여 이미지 크기, 품질, 포맷을 최적화한 URL을 생성합니다.
   * 모바일 환경에서 빠른 로딩과 데이터 절약을 위해 사용됩니다.
   * 
   * @param originalUrl - 원본 이미지 URL
   * @param options - 최적화 옵션
   * @param options.width - 이미지 너비 (픽셀)
   * @param options.height - 이미지 높이 (픽셀)
   * @param options.quality - 이미지 품질 (1-100)
   * @param options.format - 이미지 포맷 ('webp' | 'jpeg' | 'png')
   * @returns 최적화된 이미지 URL
   */
  getOptimizedImageUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    const cdnUrl = this.getCDNUrl(originalUrl);
    
    // If using CloudFront with Lambda@Edge for image optimization
    if (this.config.domainName && process.env.ENABLE_IMAGE_OPTIMIZATION === 'true') {
      const params = new URLSearchParams();
      
      if (options.width) params.append('w', options.width.toString());
      if (options.height) params.append('h', options.height.toString());
      if (options.quality) params.append('q', options.quality.toString());
      if (options.format) params.append('f', options.format);
      
      const queryString = params.toString();
      return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
    }
    
    return cdnUrl;
  }

  /**
   * 반응형 이미지 URL 생성
   * 
   * 다양한 화면 크기에 최적화된 이미지 URL들을 생성합니다.
   * 모바일, 태블릿, 데스크톱 환경에서 적절한 크기의 이미지를 제공합니다.
   * 
   * @param originalUrl - 원본 이미지 URL
   * @returns 화면 크기별 최적화된 이미지 URL 객체
   * @returns returns.small - 소형 화면용 (400px, 80% 품질)
   * @returns returns.medium - 중형 화면용 (800px, 85% 품질)
   * @returns returns.large - 대형 화면용 (1200px, 90% 품질)
   * @returns returns.original - 원본 크기 CDN URL
   */
  getResponsiveImageUrls(originalUrl: string): {
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      small: this.getOptimizedImageUrl(originalUrl, { width: 400, quality: 80 }),
      medium: this.getOptimizedImageUrl(originalUrl, { width: 800, quality: 85 }),
      large: this.getOptimizedImageUrl(originalUrl, { width: 1200, quality: 90 }),
      original: this.getCDNUrl(originalUrl)
    };
  }

  /**
   * 썸네일 URL 생성
   * 
   * 프로필 이미지나 미리보기용 작은 크기의 썸네일 URL을 생성합니다.
   * WebP 포맷을 사용하여 최적의 압축과 품질을 제공합니다.
   * 
   * @param originalUrl - 원본 이미지 URL
   * @returns 썸네일 URL (150x150px, 70% 품질, WebP 포맷)
   */
  getThumbnailUrl(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl, {
      width: 150,
      height: 150,
      quality: 70,
      format: 'webp'
    });
  }

  /**
   * 다중 S3 URL을 CloudFront URL로 일괄 변환
   * 
   * 여러 개의 S3 URL을 한 번에 CloudFront URL로 변환합니다.
   * 이미지 갤러리나 목록 페이지에서 대량의 URL 변환에 사용됩니다.
   * 
   * @param urls - 변환할 S3 URL 배열
   * @returns CloudFront URL 배열
   */
  batchConvertToCDN(urls: string[]): string[] {
    return urls.map(url => this.getCDNUrl(url));
  }

  /**
   * CloudFront 설정 상태 확인
   * 
   * CloudFront가 올바르게 설정되어 있는지 확인합니다.
   * 배포 ID와 도메인 이름이 모두 설정되어 있어야 true를 반환합니다.
   * 
   * @returns CloudFront 설정 여부
   */
  isConfigured(): boolean {
    return !!(this.config.distributionId && this.config.domainName);
  }
}

/**
 * CloudFront 서비스 싱글톤 인스턴스
 * 
 * 애플리케이션 전체에서 사용할 수 있는 CloudFront 서비스 인스턴스입니다.
 * CDN URL 변환, 이미지 최적화, 캐시 관리 등의 기능을 제공합니다.
 * 
 * @constant {CloudFrontService}
 */
export const cloudFrontService = new CloudFrontService();