const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dev_secret_key_for_testing_only';

// Admin user data
const adminUser = {
  userId: 'cmektu1y80000xtcgr1a1whj3',
  sub: 'cmektu1y80000xtcgr1a1whj3',
  phoneNumber: '+820100000000',
  isVerified: true,
};

// Generate token that expires in 30 days
const token = jwt.sign(adminUser, JWT_SECRET, {
  expiresIn: '30d'
});

console.log('Development Token:');
console.log(token);
console.log('\nPayload:', adminUser);