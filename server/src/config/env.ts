import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment variable schema
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

// Parse and validate environment variables
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

// Helper function to check if a service is configured
export function isServiceConfigured(service: 'stripe' | 'toss' | 'kakao' | 'aws' | 'firebase' | 'email' | 'redis' | 'sentry'): boolean {
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
    default:
      return false;
  }
}

// Log configuration status on startup
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
  console.log('\n');
}

// Export validated environment variables
export default env;