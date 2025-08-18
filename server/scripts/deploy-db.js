const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deployDatabase() {
  console.log('🚀 Starting database deployment...');
  
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('📊 Database URL configured successfully');
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Push database schema
    console.log('📋 Pushing database schema...');
    await execAsync('npx prisma db push --accept-data-loss');
    console.log('✅ Database schema pushed successfully');
    
    console.log('🎉 Database deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Database deployment failed:');
    console.error(error.message);
    
    if (error.stdout) {
      console.error('STDOUT:', error.stdout);
    }
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployDatabase();
}

module.exports = { deployDatabase };