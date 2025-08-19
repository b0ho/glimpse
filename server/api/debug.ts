// 디버그용 - NestJS 없이 Express만 사용
import express from 'express';

const app = express();

// 매우 기본적인 라우트들
app.get('/', (req, res) => {
  res.json({
    message: 'Debug endpoint working!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasEncryption: !!process.env.ENCRYPTION_KEY,
      hasJWT: !!process.env.JWT_SECRET,
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : undefined
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'glimpse-server-debug',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint OK',
    method: req.method,
    url: req.url,
    headers: req.headers
  });
});

export default app;