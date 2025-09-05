import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestGroup() {
  try {
    // Create a test user if not exists
    let testUser = await prisma.user.findFirst({
      where: { nickname: 'TestUser' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          nickname: 'TestUser',
          phoneNumber: '+821012345678',
          gender: 'MALE',
          age: 25,
        }
      });
    }

    // Check if test group already exists
    const existingGroup = await prisma.group.findFirst({
      where: { name: '서강대학교 IT학과' }
    });

    if (existingGroup) {
      console.log('Test group already exists:', existingGroup.id);
      return existingGroup;
    }

    // Create test group
    const testGroup = await prisma.group.create({
      data: {
        id: 'test-group-1', // Use a predictable ID
        name: '서강대학교 IT학과',
        description: '서강대학교 IT학과 학생들의 모임입니다. 코딩, 공모전, 취업 정보를 공유합니다.',
        type: 'OFFICIAL',
        maxMembers: 100,
        settings: {},
        location: {
          city: '서울',
          district: '마포구',
          address: '서울 마포구 서강대로',
          coordinates: {
            latitude: 37.5494,
            longitude: 126.9410
          }
        },
        imageUrl: 'https://source.unsplash.com/400x200/?university,technology',
        creatorId: testUser.id,
      }
    });

    // Add creator as a member
    await prisma.groupMember.create({
      data: {
        userId: testUser.id,
        groupId: testGroup.id,
        role: 'CREATOR',
        status: 'ACTIVE',
      }
    });

    // Create additional test members
    for (let i = 1; i <= 10; i++) {
      const memberUser = await prisma.user.create({
        data: {
          nickname: `Member${i}`,
          phoneNumber: `+8210123456${i.toString().padStart(2, '0')}`,
          gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
          age: 20 + i,
        }
      });

      await prisma.groupMember.create({
        data: {
          userId: memberUser.id,
          groupId: testGroup.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      });
    }

    console.log('Test group created successfully:', testGroup.id);
    return testGroup;
  } catch (error) {
    console.error('Error seeding test group:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestGroup()
  .then(() => console.log('Seeding completed'))
  .catch((error) => console.error('Seeding failed:', error));