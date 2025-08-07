const jwt = require('jsonwebtoken');

// 개발용 JWT 생성
const payload = {
  sub: 'user_1',  // AuthGuard가 sub를 확인함
  userId: 'user_1',
  email: 'user1@example.com',
  role: 'user',
  phoneNumber: '+821012345678',
  isVerified: true,
  nickname: '커피러버',
  name: '커피러버'
};

const secret = 'development_jwt_secret_key_12345';
const token = jwt.sign(payload, secret, { expiresIn: '30d' });

console.log('Development JWT Token:');
console.log(token);
console.log('\nPayload:', payload);
console.log('\n모바일 앱 .env에 추가:');
console.log(`DEV_AUTH_TOKEN=${token}`);