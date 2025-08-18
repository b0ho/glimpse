import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        statusCode: 405,
        message: 'Method not allowed',
        error: 'Only GET requests are allowed',
      });
    }

    // Check environment variables
    const envStatus = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_provider: process.env.DATABASE_URL?.includes('railway.app') ? 'Railway PostgreSQL' :
                             process.env.DATABASE_URL?.includes('rlwy.net') ? 'Railway PostgreSQL' : 
                             process.env.DATABASE_URL?.includes('localhost') ? 'Local PostgreSQL' : 
                             process.env.DATABASE_URL?.includes('supabase') ? 'Supabase (Legacy)' :
                             'Other PostgreSQL',
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    // Try to connect to database
    let dbStatus = 'Not tested';
    let prismaStatus = 'Not available';
    
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        log: ['error'],
      });
      
      // Simple connection test
      await prisma.$connect();
      dbStatus = 'Connected';
      
      // Try a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      prismaStatus = Array.isArray(result) && result.length > 0 ? 'Working' : 'No response';
      
      await prisma.$disconnect();
    } catch (error) {
      dbStatus = `Failed: ${error.message}`;
      prismaStatus = 'Error';
    }

    return res.status(200).json({
      status: 'Database status check',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      database: {
        connection: dbStatus,
        prisma: prismaStatus,
      },
      prismaStudio: {
        info: 'Prisma Studio is not available in Vercel serverless environment',
        alternative: 'Use Railway Dashboard: https://railway.app/dashboard',
        localAccess: 'Run "npx prisma studio" in local development',
      },
      migration: {
        endpoint: '/api/db-migrate',
        method: 'POST',
        auth: 'Bearer token required',
      },
    });

  } catch (error) {
    console.error('❌ Database status check failed:', error);
    
    return res.status(500).json({
      statusCode: 500,
      message: 'Database status check failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}