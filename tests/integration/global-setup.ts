import { resetTestDatabase } from './config';

async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  // Reset database to clean state
  if (process.env.RESET_DB !== 'false') {
    try {
      await resetTestDatabase();
      console.log('✅ Database reset complete');
    } catch (error) {
      console.log('⚠️  Database reset skipped (API may not be running)');
    }
  }

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  
  console.log('✅ Test environment ready');
}

export default globalSetup;