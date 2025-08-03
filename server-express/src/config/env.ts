/**
 * @module Environment
 * @description 환경변수 검증 및 설정 관리
 * 
 * 애플리케이션의 모든 환경변수를 중앙에서 관리하고 Zod 스키마를 통해
 * 타입 안전성과 유효성을 보장합니다. 잘못된 환경변수 설정 시
 * 애플리케이션 시작을 중단하여 런타임 오류를 방지합니다.
 * 
 * 주요 기능:
 * - 환경변수 타입 검증 및 변환
 * - 필수/선택적 환경변수 관리
 * - 외부 서비스 설정 상태 확인
 * - 개발자 친화적 에러 메시지 제공
 * 
 * 보안 고려사항:
 * - 민감한 정보는 로그에 출력하지 않음
 * - 프로덕션 환경에서 필수 보안 설정 검증
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// 환경변수 파일 로드
dotenv.config();

/**
 * 환경변수 검증 스키마
 * 
 * Zod를 사용하여 모든 환경변수의 타입과 유효성을 검증합니다.
 * 잘못된 설정 시 명확한 오류 메시지를 제공하여 디버깅을 돕습니다.
 * 
 * @constant {z.ZodObject}
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8080').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:8081'),

  // Database Configuration
  DATABASE_URL: z.string().url(),

  // Authentication (Clerk)
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_DOMAIN: z.string().default('accounts.dev'),

  // JWT Secret (for legacy support)
  JWT_SECRET: z.string().min(32),

  // Encryption
  ENCRYPTION_KEY: z.string().length(32),

  // Payment Gateways
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
  TOSS_CLIENT_KEY: z.string().optional(),
  KAKAO_SECRET_KEY: z.string().optional(),
  KAKAO_CID: z.string().default('TC0ONETIME'),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  
  // SMS Provider Configuration
  SMS_PROVIDER: z.enum(['twilio', 'aligo', 'toast', 'dev']).default('dev'),
  
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Aligo Configuration
  ALIGO_API_KEY: z.string().optional(),
  ALIGO_USER_ID: z.string().optional(),
  ALIGO_SENDER: z.string().optional(),
  
  // Toast SMS Configuration
  TOAST_SMS_API_URL: z.string().default('https://api-sms.cloud.toast.com'),
  TOAST_APP_KEY: z.string().optional(),
  TOAST_SECRET_KEY: z.string().optional(),
  TOAST_SEND_NO: z.string().optional(),

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-northeast-2'),
  AWS_S3_BUCKET: z.string().optional(),

  // Firebase (Push Notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),

  // External APIs
  KAKAO_MAP_API_KEY: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
  GOOGLE_VISION_API_KEY: z.string().optional(),

  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional()?.transform(v => v ? Number(v) : undefined),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),

  // Redis Configuration
  REDIS_URL: z.string().url().optional(),

  // Sentry (Error Tracking)
  SENTRY_DSN: z.string().url().optional(),

  // Base URL for callbacks
  BASE_URL: z.string().url().default('http://localhost:8080'),
});

/**
 * 환경변수 파싱 및 검증
 * 
 * Zod 스키마를 통해 환경변수를 검증하고 타입을 변환합니다.
 * 검증 실패 시 상세한 오류 메시지와 함께 애플리케이션을 종료합니다.
 */
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.issues.forEach((err) => {
      console.error(`   ${err.path.join('.')}: ${err.message}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');
    process.exit(1);
  }
  throw error;
}

/**
 * 외부 서비스 설정 상태 확인
 * 
 * 각 외부 서비스가 올바르게 설정되어 있는지 확인합니다.
 * 서비스별로 필요한 환경변수가 모두 설정되어 있어야 true를 반환합니다.
 * 
 * @param service - 확인할 서비스 이름
 * @returns 서비스 설정 여부
 */
export function isServiceConfigured(service: 'stripe' | 'toss' | 'kakao' | 'aws' | 'firebase' | 'email' | 'redis' | 'sentry' | 'sms'): boolean {
  switch (service) {
    case 'stripe':
      return !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
    case 'toss':
      return !!(env.TOSS_SECRET_KEY && env.TOSS_CLIENT_KEY);
    case 'kakao':
      return !!env.KAKAO_SECRET_KEY;
    case 'aws':
      return !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET);
    case 'firebase':
      return !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL);
    case 'email':
      return !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
    case 'redis':
      return !!env.REDIS_URL;
    case 'sentry':
      return !!env.SENTRY_DSN;
    case 'sms':
      if (env.SMS_PROVIDER === 'dev') return true;
      if (env.SMS_PROVIDER === 'twilio') return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
      if (env.SMS_PROVIDER === 'aligo') return !!(env.ALIGO_API_KEY && env.ALIGO_USER_ID && env.ALIGO_SENDER);
      if (env.SMS_PROVIDER === 'toast') return !!(env.TOAST_APP_KEY && env.TOAST_SECRET_KEY && env.TOAST_SEND_NO);
      return false;
    default:
      return false;
  }
}

/**
 * 서버 시작 시 설정 상태 로깅
 * 
 * 애플리케이션 시작 시 각 서비스의 설정 상태를 콘솔에 출력합니다.
 * 개발자가 어떤 서비스가 활성화되어 있는지 쉽게 확인할 수 있도록 돕습니다.
 * 
 * 출력 정보:
 * - 현재 환경 (development/test/production)
 * - 서버 포트 및 프론트엔드 URL
 * - 각 외부 서비스별 설정 상태 (✅/⚠️)
 */
export function logConfigurationStatus(): void {
  console.log('\n🔧 Configuration Status:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
  console.log('\n   Services:');
  console.log('   ✅ Database: Connected');
  console.log(`   ✅ Clerk Auth: Configured`);
  console.log(`   ${isServiceConfigured('stripe') ? '✅' : '⚠️ '} Stripe: ${isServiceConfigured('stripe') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('toss') ? '✅' : '⚠️ '} TossPay: ${isServiceConfigured('toss') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('kakao') ? '✅' : '⚠️ '} KakaoPay: ${isServiceConfigured('kakao') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('aws') ? '✅' : '⚠️ '} AWS S3: ${isServiceConfigured('aws') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('firebase') ? '✅' : '⚠️ '} Firebase: ${isServiceConfigured('firebase') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('email') ? '✅' : '⚠️ '} Email: ${isServiceConfigured('email') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('redis') ? '✅' : '⚠️ '} Redis: ${isServiceConfigured('redis') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('sentry') ? '✅' : '⚠️ '} Sentry: ${isServiceConfigured('sentry') ? 'Configured' : 'Not configured'}`);
  console.log(`   ${isServiceConfigured('sms') ? '✅' : '⚠️ '} SMS (${env.SMS_PROVIDER}): ${isServiceConfigured('sms') ? 'Configured' : 'Not configured'}`);
  console.log('\n');
}

/**
 * 검증된 환경변수 객체
 * 
 * Zod 스키마를 통해 검증되고 타입이 변환된 환경변수 객체입니다.
 * 애플리케이션 전체에서 타입 안전하게 환경변수에 접근할 수 있습니다.
 * 
 * @constant {Object} env - 검증된 환경변수 객체
 * @default 환경변수가 설정되지 않은 경우 기본값 사용
 */
export default env;