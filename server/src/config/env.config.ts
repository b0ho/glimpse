import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Environment Configuration Loader
 *
 * Loads environment variables from multiple sources:
 * 1. .env - General configuration (committed to git)
 * 2. .env.secrets - Sensitive credentials (never committed)
 * 3. Process environment variables (highest priority)
 */
export class EnvConfig {
  private static instance: EnvConfig;
  private loaded = false;

  private constructor() {}

  static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  /**
   * Load environment variables from multiple sources
   */
  load(): void {
    if (this.loaded) {
      return;
    }

    const nodeEnv = process.env.NODE_ENV || 'development';

    // Skip file loading in Railway/production environment
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
      console.log('🚂 Running on Railway - using environment variables');
      this.validateRequiredVars();
      this.loaded = true;
      return;
    }

    const rootDir = path.resolve(process.cwd());

    // 1. Load base .env file (non-sensitive config)
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`✅ Loaded configuration from .env`);
    }

    // 2. Load environment-specific .env file
    let envSpecificFile: string;
    if (nodeEnv === 'production') {
      envSpecificFile = '.env.production';
    } else if (nodeEnv === 'development' || nodeEnv === 'local') {
      envSpecificFile = '.env.local';
    } else if (nodeEnv === 'test') {
      envSpecificFile = '.env.test';
    } else {
      envSpecificFile = `.env.${nodeEnv}`;
    }

    const envSpecificPath = path.join(rootDir, envSpecificFile);
    if (fs.existsSync(envSpecificPath)) {
      dotenv.config({ path: envSpecificPath });
      console.log(`✅ Loaded configuration from ${envSpecificFile}`);
    } else {
      console.warn(`⚠️  ${envSpecificFile} not found`);
    }

    // 3. Environment-specific files now contain all configuration including secrets
    // No separate .env.secrets file needed

    // 4. Validate required environment variables
    this.validateRequiredVars();

    this.loaded = true;
  }

  /**
   * Validate that required environment variables are set
   */
  private validateRequiredVars(): void {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables:`);
      missing.forEach((key) => console.error(`   - ${key}`));

      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}`,
        );
      } else {
        console.warn(
          `⚠️  Continuing in development mode with missing variables`,
        );
      }
    }
  }

  /**
   * Get environment variable with optional default
   */
  static get<T = string>(key: string, defaultValue?: T): T {
    const instance = EnvConfig.getInstance();
    if (!instance.loaded) {
      instance.load();
    }

    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      return undefined as unknown as T;
    }

    // Type conversion
    if (typeof defaultValue === 'boolean') {
      return (value === 'true' || value === '1') as unknown as T;
    }

    if (typeof defaultValue === 'number') {
      return Number(value) as unknown as T;
    }

    return value as unknown as T;
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Get all non-sensitive environment variables for debugging
   */
  static getPublicConfig(): Record<string, any> {
    const sensitive = [
      'DATABASE_URL',
      'DIRECT_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'CLERK_SECRET_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'STRIPE_SECRET_KEY',
      'TWILIO_AUTH_TOKEN',
      'SENDGRID_API_KEY',
      'ADMIN_PASSWORD',
      'REDIS_PASSWORD',
      'FIREBASE_PRIVATE_KEY',
    ];

    const config: Record<string, any> = {};

    Object.keys(process.env).forEach((key) => {
      if (!sensitive.some((s) => key.includes(s))) {
        config[key] = process.env[key];
      }
    });

    return config;
  }
}

// Initialize on module load
const envConfig = EnvConfig.getInstance();
envConfig.load();

// Export convenience functions
export const getEnv = EnvConfig.get;
export const isProduction = EnvConfig.isProduction;
export const isDevelopment = EnvConfig.isDevelopment;
export const getPublicConfig = EnvConfig.getPublicConfig;
