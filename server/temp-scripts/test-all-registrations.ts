import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Test data for all 12 interest types
const testData = [
  { type: 'BIRTHDATE', value: '1995-03-15', metadata: { year: 1995, ageRange: '25-30' } },
  { type: 'GROUP', value: 'group-123', metadata: { groupName: '서강대학교' } },
  { type: 'LOCATION', value: '강남역', metadata: { city: '서울', lat: 37.498, lng: 127.028 } },
  { type: 'NICKNAME', value: '커피러버', metadata: {} },
  { type: 'COMPANY', value: '삼성전자', metadata: { domain: 'samsung.com', department: '개발팀' } },
  { type: 'SCHOOL', value: '서울대학교', metadata: { major: '컴퓨터공학' } },
  { type: 'PART_TIME_JOB', value: '스타벅스', metadata: { category: '카페', role: '바리스타' } },
  { type: 'PLATFORM', value: 'LinkedIn', metadata: { platform: 'LinkedIn', handle: 'test_user' } },
  { type: 'GAME_ID', value: 'LOL_player', metadata: { gameTitle: 'League of Legends', server: 'KR' } }
];

async function registerAllTypes() {
  console.log('Starting comprehensive interest type registration...');
  
  const userId = 'cmeh8afwr000i1mb7ikv3lq1a'; // Premium user ID from database
  
  // Register remaining ROMANTIC types
  for (const data of testData) {
    try {
      // Generate hash for matching
      const hash = crypto
        .createHash('sha256')
        .update(`${data.type}:${data.value}`)
        .digest('hex');
      
      // Create interest search
      const result = await prisma.interestSearch.create({
        data: {
          userId,
          type: data.type as any,
          value: data.value,
          relationshipIntent: 'ROMANTIC',
          primaryHash: hash,
          displayValue: data.value,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          // Add structured data based on type
          ...(data.type === 'BIRTHDATE' && {
            birthYear: data.metadata.year,
            ageRange: data.metadata.ageRange
          }),
          ...(data.type === 'COMPANY' && {
            companyDomain: data.metadata.domain
          }),
          ...(data.type === 'SCHOOL' && {
            schoolName: data.value
          }),
          ...(data.type === 'PART_TIME_JOB' && {
            partTimeCategory: data.metadata.category
          }),
          ...(data.type === 'PLATFORM' && {
            platformName: data.metadata.platform,
            socialPlatform: data.metadata.platform
          }),
          ...(data.type === 'GAME_ID' && {
            gameTitle: data.metadata.gameTitle
          }),
          ...(data.type === 'LOCATION' && {
            locationCity: data.metadata.city
          })
        }
      });
      
      console.log(`✅ Registered ${data.type}: ${data.value}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  ${data.type} already registered, skipping...`);
      } else {
        console.error(`❌ Failed to register ${data.type}:`, error.message);
      }
    }
  }
  
  // Register all 12 FRIEND types
  const allTypes = [
    { type: 'PHONE', value: '010-1111-2222' },
    { type: 'EMAIL', value: 'friend@example.com' },
    { type: 'SOCIAL_ID', value: 'friend_kakao' },
    ...testData
  ];
  
  for (const data of allTypes) {
    try {
      const hash = crypto
        .createHash('sha256')
        .update(`${data.type}:${data.value}:FRIEND`)
        .digest('hex');
      
      const result = await prisma.interestSearch.create({
        data: {
          userId,
          type: data.type as any,
          value: data.value,
          relationshipIntent: 'FRIEND',
          primaryHash: hash,
          displayValue: data.value,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      
      console.log(`✅ Registered FRIEND ${data.type}: ${data.value}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  FRIEND ${data.type} already registered, skipping...`);
      } else {
        console.error(`❌ Failed to register FRIEND ${data.type}:`, error.message);
      }
    }
  }
  
  console.log('\n📊 Registration Summary:');
  const romanticCount = await prisma.interestSearch.count({
    where: { userId, relationshipIntent: 'ROMANTIC' }
  });
  const friendCount = await prisma.interestSearch.count({
    where: { userId, relationshipIntent: 'FRIEND' }
  });
  
  console.log(`ROMANTIC types registered: ${romanticCount}/12`);
  console.log(`FRIEND types registered: ${friendCount}/12`);
  
  await prisma.$disconnect();
}

registerAllTypes().catch(console.error);