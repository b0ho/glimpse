// 간단한 Vercel 함수 테스트
export default async (req: any, res: any) => {
  try {
    res.status(200).json({ 
      message: 'Simple test works!', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ 
      error: 'Simple test failed',
      message: error.message 
    });
  }
};