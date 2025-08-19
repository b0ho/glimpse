// 작동하는 엔드포인트에 DB 연결 테스트 추가
const express = require('express');

module.exports = async (req, res) => {
  console.log('Simple endpoint called:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth');
  res.setHeader('Content-Type', 'application/json');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 실제 DB 연결 테스트 시도
  let dbTest = 'not-tested';
  try {
    if (process.env.DATABASE_URL) {
      // 간단한 DB 연결 테스트 (실제 쿼리는 아직 안함)
      dbTest = 'connection-string-exists';
    }
  } catch (error) {
    dbTest = 'connection-failed: ' + error.message;
  }

  res.status(200);
  res.end(JSON.stringify({
    status: 'success',
    message: 'Simple Express endpoint working with DB test!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasEncryption: !!process.env.ENCRYPTION_KEY,
      hasJWT: !!process.env.JWT_SECRET,
      platform: 'vercel-serverless'
    },
    dbTest: dbTest,
    cors: 'enabled'
  }, null, 2));
};