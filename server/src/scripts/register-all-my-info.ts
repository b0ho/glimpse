import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption function using Base64 (simplified for testing)
function encryptData(data: string): { encrypted: string, iv: string, tag: string } {
  // For testing, we'll use simple Base64 encoding
  const encrypted = Buffer.from(data).toString('base64');
  const iv = crypto.randomBytes(16).toString('hex');
  const tag = crypto.randomBytes(16).toString('hex');
  
  return { encrypted, iv, tag };
}

// Test data for all 12 interest types (MY_INFO registration)
const myInfoData = [
  { type: 'PHONE', value: '010-1234-5678', metadata: { name: '김철수' } },
  { type: 'EMAIL', value: 'myinfo@example.com', metadata: { name: '김철수' } },
  { type: 'SOCIAL_ID', value: '@my_instagram', metadata: { platform: 'Instagram' } },
  { type: 'BIRTHDATE', value: '1995-03-15', metadata: { year: 1995, ageRange: '25-30' } },
  { type: 'GROUP', value: 'group-456', metadata: { groupName: '서울대학교' } },
  { type: 'LOCATION', value: '강남역 스타벅스', metadata: { city: '서울', lat: 37.498, lng: 127.028 } },
  { type: 'NICKNAME', value: '북극곰', metadata: {} },
  { type: 'COMPANY', value: '삼성전자', metadata: { domain: 'samsung.com', department: '개발팀' } },
  { type: 'SCHOOL', value: '서울대학교', metadata: { major: '컴퓨터공학' } },
  { type: 'PART_TIME_JOB', value: '이디야커피', metadata: { category: '카페', role: '바리스타' } },
  { type: 'PLATFORM', value: 'GitHub', metadata: { platform: 'GitHub', handle: 'developer123' } },
  { type: 'GAME_ID', value: 'Overwatch_Hero', metadata: { gameTitle: 'Overwatch', server: 'Asia' } }
];

async function registerAllMyInfo() {
  console.log('🚀 Starting MY_INFO registration for all 12 types...');
  
  const userId = 'cmeh8afwr000i1mb7ikv3lq1a'; // 북벌레1 user ID
  
  // Clear existing registrations to start fresh
  await prisma.interestSearch.deleteMany({
    where: { userId }
  });
  console.log('✅ Cleared existing registrations');
  
  // Register all 12 MY_INFO types
  for (const data of myInfoData) {
    try {
      // Generate hash for matching
      const hash = crypto
        .createHash('sha256')
        .update(`${data.type}:${data.value}`)
        .digest('hex');
      
      // Encrypt the actual data
      const { encrypted, iv, tag } = encryptData(JSON.stringify({
        value: data.value,
        metadata: data.metadata
      }));
      
      // Create interest search with MY_INFO registration
      const result = await prisma.interestSearch.create({
        data: {
          userId,
          type: data.type as any,
          value: data.value,
          registrationType: 'MY_INFO', // Register as MY_INFO
          relationshipIntent: 'ROMANTIC',
          primaryHash: hash,
          encryptedData: encrypted,
          encryptedIV: iv,
          encryptedTag: tag,
          displayValue: data.value,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          // Add structured data based on type
          ...(data.type === 'BIRTHDATE' && {
            birthYear: data.metadata.year,
            ageRange: data.metadata.ageRange
          }),
          ...(data.type === 'COMPANY' && {
            companyDomain: data.metadata.domain,
            companyDepartment: data.metadata.department
          }),
          ...(data.type === 'SCHOOL' && {
            schoolName: data.value,
            schoolMajor: data.metadata.major
          }),
          ...(data.type === 'PART_TIME_JOB' && {
            partTimeCategory: data.metadata.category,
            partTimeRole: data.metadata.role
          }),
          ...(data.type === 'PLATFORM' && {
            platformName: data.metadata.platform,
            socialPlatform: data.metadata.platform,
            platformHandle: data.metadata.handle
          }),
          ...(data.type === 'GAME_ID' && {
            gameTitle: data.metadata.gameTitle,
            gameServer: data.metadata.server
          }),
          ...(data.type === 'LOCATION' && {
            locationCity: data.metadata.city,
            locationLatitude: data.metadata.lat,
            locationLongitude: data.metadata.lng
          })
        }
      });
      
      console.log(`✅ Registered MY_INFO ${data.type}: ${data.value} (Encrypted: ${encrypted.substring(0, 20)}...)`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  MY_INFO ${data.type} already registered, skipping...`);
      } else {
        console.error(`❌ Failed to register MY_INFO ${data.type}:`, error.message);
      }
    }
  }
  
  // Register matching LOOKING_FOR entries to test bidirectional matching
  console.log('\n📊 Registering LOOKING_FOR entries for testing bidirectional matching...');
  
  const lookingForData = [
    { type: 'PHONE', value: '010-1234-5678' }, // Same as MY_INFO - should match!
    { type: 'EMAIL', value: 'myinfo@example.com' }, // Same as MY_INFO - should match!
    { type: 'NICKNAME', value: '북극곰' } // Same as MY_INFO - should match!
  ];
  
  for (const data of lookingForData) {
    try {
      const hash = crypto
        .createHash('sha256')
        .update(`${data.type}:${data.value}`)
        .digest('hex');
      
      const { encrypted, iv, tag } = encryptData(JSON.stringify({
        value: data.value,
        metadata: {}
      }));
      
      await prisma.interestSearch.create({
        data: {
          userId,
          type: data.type as any,
          value: data.value,
          registrationType: 'LOOKING_FOR', // Register as LOOKING_FOR
          relationshipIntent: 'ROMANTIC',
          primaryHash: hash,
          encryptedData: encrypted,
          encryptedIV: iv,
          encryptedTag: tag,
          displayValue: data.value,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      console.log(`✅ Registered LOOKING_FOR ${data.type}: ${data.value}`);
    } catch (error: any) {
      console.error(`❌ Failed to register LOOKING_FOR ${data.type}:`, error.message);
    }
  }
  
  console.log('\n📊 Registration Summary:');
  const myInfoCount = await prisma.interestSearch.count({
    where: { userId, registrationType: 'MY_INFO' }
  });
  const lookingForCount = await prisma.interestSearch.count({
    where: { userId, registrationType: 'LOOKING_FOR' }
  });
  const totalCount = await prisma.interestSearch.count({
    where: { userId }
  });
  
  console.log(`MY_INFO types registered: ${myInfoCount}/12`);
  console.log(`LOOKING_FOR types registered: ${lookingForCount}`);
  console.log(`Total registrations: ${totalCount}`);
  
  // Check if encryption is working
  const encryptedRecords = await prisma.interestSearch.findMany({
    where: { 
      userId,
      encryptedData: { not: null }
    },
    select: {
      type: true,
      encryptedData: true,
      encryptedIV: true,
      encryptedTag: true
    }
  });
  
  console.log(`\n🔐 Encrypted records: ${encryptedRecords.length}`);
  encryptedRecords.forEach(record => {
    console.log(`  - ${record.type}: Data=${record.encryptedData?.substring(0, 20)}... IV=${record.encryptedIV?.substring(0, 10)}... Tag=${record.encryptedTag?.substring(0, 10)}...`);
  });
  
  await prisma.$disconnect();
}

registerAllMyInfo().catch(console.error);