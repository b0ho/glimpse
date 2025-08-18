import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType, PremiumLevel } from '@prisma/client';

const prisma = new PrismaClient();

// 간단한 테스트 데이터
const nicknames = ['커피러버', '산책마니아', '책벌레', '영화광', '음악애호가', '요리사', '여행자', '헬스매니아', '게이머', '사진작가'];
const bios = [
  '안녕하세요! 새로운 만남을 기대하고 있어요 😊',
  '커피와 책을 좋아하는 조용한 성격입니다',
  '운동과 건강한 삶을 추구해요 💪',
  '맛집 탐방과 요리를 좋아합니다 🍳',
  '영화와 드라마 정주행이 취미예요 🎬',
];

const companies = [
  { name: '삼성전자', domain: 'samsung.com' },
  { name: '네이버', domain: 'navercorp.com' },
  { name: '카카오', domain: 'kakaocorp.com' },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 로컬 개발용 간단한 데이터베이스 시드 시작...');

  // 기존 데이터 정리 (순서가 중요함 - 외래키 관계 고려)
  try {
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.story.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.match.deleteMany();
    await prisma.userLike.deleteMany();
    await prisma.groupLike.deleteMany();
    await prisma.communityPost.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  } catch (error) {
    console.log('데이터 정리 중 일부 오류 무시:', error.message);
  }

  console.log('🗑️ 기존 데이터 정리 완료');

  // 1. 회사 생성
  const createdCompanies = [];
  for (const company of companies) {
    const created = await prisma.company.create({
      data: {
        name: company.name,
        domain: company.domain,
        type: CompanyType.COMPANY,
        isVerified: true,
        logo: `https://logo.clearbit.com/${company.domain}`,
      }
    });
    createdCompanies.push(created);
  }

  console.log(`✅ ${createdCompanies.length}개 회사 생성 완료`);

  // 2. 사용자 생성 (50명)
  const createdUsers = [];
  for (let i = 0; i < 50; i++) {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const company = Math.random() > 0.5 ? getRandomElement(createdCompanies) : null;
    
    const user = await prisma.user.create({
      data: {
        anonymousId: `anon_${i + 1}`,
        phoneNumber: `010${Math.floor(Math.random() * 90000000) + 10000000}`,
        nickname: `${getRandomElement(nicknames)}${i + 1}`,
        gender,
        age: 22 + Math.floor(Math.random() * 16), // 22-37세
        bio: getRandomElement(bios),
        profileImage: `https://picsum.photos/400/400?random=${i + 1}`,
        credits: Math.floor(Math.random() * 10) + 1,
        isPremium: Math.random() > 0.8,
        premiumLevel: Math.random() > 0.8 ? PremiumLevel.PREMIUM : PremiumLevel.FREE,
        companyName: company?.name,
      }
    });
    createdUsers.push(user);
  }

  console.log(`✅ ${createdUsers.length}명 사용자 생성 완료`);

  // 3. 그룹 생성
  const createdGroups = [];
  
  // 회사 그룹
  for (const company of createdCompanies) {
    const group = await prisma.group.create({
      data: {
        name: company.name,
        description: `${company.name} 임직원들을 위한 공식 그룹입니다.`,
        type: GroupType.OFFICIAL,
        imageUrl: company.logo,
        maxMembers: 1000,
        isActive: true,
        settings: {},
        creator: {
          connect: { id: getRandomElement(createdUsers).id }
        },
        company: {
          connect: { id: company.id }
        }
      }
    });
    createdGroups.push(group);
  }

  // 일반 그룹
  const hobbyGroups = [
    { name: '독서 모임', description: '책을 사랑하는 사람들의 모임입니다 📚' },
    { name: '러닝 크루', description: '함께 뛰는 즐거움을 나눠요 🏃‍♂️' },
    { name: '카페 탐방', description: '맛있는 커피를 찾아 떠나요 ☕' },
  ];

  for (const hobbyData of hobbyGroups) {
    const group = await prisma.group.create({
      data: {
        name: hobbyData.name,
        description: hobbyData.description,
        type: GroupType.CREATED,
        maxMembers: 100,
        isActive: true,
        settings: {},
        creator: {
          connect: { id: getRandomElement(createdUsers).id }
        }
      }
    });
    createdGroups.push(group);
  }

  console.log(`✅ ${createdGroups.length}개 그룹 생성 완료`);

  // 4. 그룹 멤버 추가
  let memberCount = 0;
  for (const group of createdGroups) {
    const numMembers = Math.floor(Math.random() * 20) + 5; // 5-24명
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numMembers, shuffledUsers.length); i++) {
      try {
        await prisma.groupMember.create({
          data: {
            userId: shuffledUsers[i].id,
            groupId: group.id,
            role: i === 0 ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER,
            status: GroupMemberStatus.ACTIVE,
            joinedAt: new Date(),
          }
        });
        memberCount++;
      } catch (error) {
        // 중복 멤버십 무시
        continue;
      }
    }
  }

  console.log(`✅ ${memberCount}개 그룹 멤버십 생성 완료`);

  // 5. 좋아요 생성 (100개)
  let likeCount = 0;
  for (let i = 0; i < 100; i++) {
    const fromUser = getRandomElement(createdUsers);
    const toUser = getRandomElement(createdUsers.filter(u => u.id !== fromUser.id));
    const group = getRandomElement(createdGroups);
    
    try {
      await prisma.userLike.create({
        data: {
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          groupId: group.id,
          isSuper: Math.random() > 0.9,
        }
      });
      likeCount++;
    } catch (error) {
      // 중복 좋아요 무시
      continue;
    }
  }

  console.log(`✅ ${likeCount}개 좋아요 생성 완료`);

  // 통계 출력
  const stats = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    groups: await prisma.group.count(),
    members: await prisma.groupMember.count(),
    likes: await prisma.userLike.count(),
  };

  console.log('\n🎉 로컬 개발용 데이터베이스 시드 완료!');
  console.log('📊 생성된 데이터 통계:');
  console.log(`   - 사용자: ${stats.users}명`);
  console.log(`   - 회사: ${stats.companies}개`);
  console.log(`   - 그룹: ${stats.groups}개`);
  console.log(`   - 멤버십: ${stats.members}개`);
  console.log(`   - 좋아요: ${stats.likes}개`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });