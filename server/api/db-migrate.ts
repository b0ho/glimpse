import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deployDatabase } from '../scripts/deploy-db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        statusCode: 405,
        message: 'Method not allowed',
        error: 'Only POST requests are allowed',
      });
    }

    // Check if this is a deployment hook or manual trigger
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Bearer token required',
      });
    }

    const token = authHeader.substring(7);
    // In production, you would verify this token against a known deployment secret
    
    console.log('🚀 Starting database migration...');
    
    // Run the database deployment
    await deployDatabase();
    
    console.log('✅ Database migration completed successfully');
    
    return res.status(200).json({
      status: 'success',
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Database migration failed:', error);
    
    return res.status(500).json({
      statusCode: 500,
      message: 'Database migration failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}