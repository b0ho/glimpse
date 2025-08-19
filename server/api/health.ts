// 독립적인 헬스체크 엔드포인트
export default async (req: any, res: any) => {
  try {
    // 매우 기본적인 응답
    res.status(200).json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasEncryption: !!process.env.ENCRYPTION_KEY,
        hasJWT: !!process.env.JWT_SECRET,
        databasePrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined'
      },
      message: 'Independent health check working!'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};