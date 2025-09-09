import { ConfigService } from '@nestjs/config';

/**
 * 환경 관련 유틸리티 함수
 */
export class EnvironmentUtil {
  /**
   * 프로덕션 환경인지 확인
   */
  static isProduction(configService: ConfigService): boolean {
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const railwayEnv = configService.get<string>('RAILWAY_ENVIRONMENT');
    return nodeEnv === 'production' || railwayEnv === 'production';
  }

  /**
   * 개발 환경인지 확인
   */
  static isDevelopment(configService: ConfigService): boolean {
    return !this.isProduction(configService);
  }

  /**
   * 개발 인증이 허용되는지 확인
   * - 프로덕션 환경에서는 절대 허용하지 않음
   * - 개발 환경에서도 USE_DEV_AUTH가 true일 때만 허용
   */
  static isDevAuthAllowed(configService: ConfigService): boolean {
    const isProduction = this.isProduction(configService);
    const useDevAuthConfig = configService.get<string>('USE_DEV_AUTH') === 'true';
    return !isProduction && useDevAuthConfig;
  }

  /**
   * 현재 환경 정보 반환
   */
  static getEnvironmentInfo(configService: ConfigService): {
    nodeEnv: string;
    railwayEnv: string | undefined;
    isProduction: boolean;
    isDevelopment: boolean;
    devAuthAllowed: boolean;
  } {
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const railwayEnv = configService.get<string>('RAILWAY_ENVIRONMENT');
    const isProduction = this.isProduction(configService);
    
    return {
      nodeEnv,
      railwayEnv,
      isProduction,
      isDevelopment: !isProduction,
      devAuthAllowed: this.isDevAuthAllowed(configService),
    };
  }
}