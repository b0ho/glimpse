// 가장 기본적인 Express 엔드포인트
const express = require('express');

module.exports = (req, res) => {
  console.log('Simple endpoint called:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.end(JSON.stringify({
    status: 'success',
    message: 'Simple Express endpoint working!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasEncryption: !!process.env.ENCRYPTION_KEY,
      platform: 'vercel-serverless'
    }
  }, null, 2));
};