import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // 테스트 사용자 생성 또는 업데이트
  let testUser = await prisma.user.findUnique({
    where: { id: 'test-user-id' },
  });

  if (!testUser) {
    // 고유한 전화번호 생성
    const uniquePhone = `+8210${Date.now().toString().slice(-8)}`;
    testUser = await prisma.user.create({
      data: {
        id: 'test-user-id',
        phoneNumber: uniquePhone,
        nickname: 'Test User',
        anonymousId: 'test-anonymous-id',
        isPremium: false,
        credits: 10,
        age: 25,
        gender: 'MALE',
        location: {
          lat: 37.5665,
          lng: 126.9780,
        },
      },
    });
  }

  console.log('Created test user:', testUser);

  // 테스트 그룹 생성
  const testGroup = await prisma.group.upsert({
    where: { id: 'test-group-id' },
    update: {},
    create: {
      id: 'test-group-id',
      name: 'Test Group',
      description: 'Test group for E2E testing',
      type: 'CREATED',
      isActive: true,
      creatorId: testUser.id,
      settings: {
        isPrivate: false,
        maxMembers: 100,
        allowInvites: true,
        requiresApproval: false,
      },
    },
  });

  console.log('Created test group:', testGroup);

  // 테스트 사용자를 그룹에 추가
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: testUser.id,
        groupId: testGroup.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      groupId: testGroup.id,
      role: 'CREATOR',
      status: 'ACTIVE',
    },
  });

  console.log('Test data seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });