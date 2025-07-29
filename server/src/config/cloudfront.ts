import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

interface CloudFrontConfig {
  distributionId: string;
  domainName: string;
  region: string;
}

export class CloudFrontService {
  private client: CloudFrontClient;
  private config: CloudFrontConfig;

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
   * Convert S3 URL to CloudFront URL
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
   * Invalidate CloudFront cache for specific paths
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
   * Get optimized image URL with CloudFront parameters
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
   * Generate responsive image URLs for different screen sizes
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
   * Get thumbnail URL
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
   * Batch convert S3 URLs to CloudFront URLs
   */
  batchConvertToCDN(urls: string[]): string[] {
    return urls.map(url => this.getCDNUrl(url));
  }

  /**
   * Check if CloudFront is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.distributionId && this.config.domainName);
  }
}

export const cloudFrontService = new CloudFrontService();