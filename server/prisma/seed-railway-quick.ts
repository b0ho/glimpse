import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType, PremiumLevel } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 간소화된 데이터
const lastNames = ['김', '이', '박', '최', '정'];
const firstNamesMale = ['민준', '서준', '도윤', '예준', '시우'];
const firstNamesFemale = ['서연', '서윤', '지우', '서현', '민서'];
const nicknames = ['커피러버', '헬스매니아', '음악감상가', '요리왕', '영화광'];

const bios = [
  '안녕하세요! 새로운 만남을 기대하고 있어요 😊',
  '커피와 책을 좋아하는 조용한 성격입니다',
  '운동과 건강한 삶을 추구해요 💪',
  '맛집 탐방과 요리를 좋아합니다 🍳',
  '영화와 드라마 정주행이 취미예요 🎬',
];

const companies = [
  { name: '삼성전자', domain: 'samsung.com' },
  { name: '네이버', domain: 'naver.com' },
  { name: '카카오', domain: 'kakao.com' },
];

const hobbyGroups = [
  { name: '독서 모임', description: '매월 한 권의 책을 함께 읽고 토론하는 모임입니다 📚' },
  { name: '러닝 크루', description: '매주 한강에서 함께 달려요! 🏃‍♂️' },
  { name: '요리 클럽', description: '맛있는 요리를 함께 만들고 나누는 모임 👨‍🍳' },
];

const locations = [
  { name: '강남역 스타벅스', lat: 37.498095, lng: 127.027610, address: '서울 강남구 강남대로 390' },
  { name: '홍대 걷고싶은거리', lat: 37.556785, lng: 126.923516, address: '서울 마포구 와우산로' },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  return `010${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
}

async function main() {
  console.log('🚄 Railway 빠른 테스트 데이터 생성 시작...');

  try {
    // 회사 도메인 생성
    console.log('🏢 회사 도메인 생성 중...');
    const companyDomains = await Promise.all(
      companies.map(company =>
        prisma.companyDomain.upsert({
          where: { domain: company.domain },
          update: {},
          create: {
            domain: company.domain,
            companyName: company.name,
            companyNameKr: company.name,
            isVerified: true,
            industry: 'Technology',
          },
        })
      )
    );
    console.log(`✅ ${companyDomains.length}개 회사 도메인 완료`);

    // 회사 생성
    console.log('🏪 회사 생성 중...');
    const companiesData = await Promise.all(
      companies.map(company =>
        prisma.company.upsert({
          where: { domain: company.domain },
          update: {},
          create: {
            name: company.name,
            domain: company.domain,
            isVerified: true,
            type: CompanyType.COMPANY,
            description: `${company.name} 공식 그룹입니다.`,
          },
        })
      )
    );
    console.log(`✅ ${companiesData.length}개 회사 완료`);

    // 30명의 사용자 생성
    console.log('👥 사용자 생성 중...');
    const users = [];
    for (let i = 0; i < 30; i++) {
      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const lastName = getRandomElement(lastNames);
      const firstName = gender === Gender.MALE 
        ? getRandomElement(firstNamesMale)
        : getRandomElement(firstNamesFemale);
      const nickname = getRandomElement(nicknames) + (i + 1);
      const bio = getRandomElement(bios);
      const age = 20 + Math.floor(Math.random() * 20);
      const phoneNumber = generatePhoneNumber();
      const isPremium = Math.random() > 0.8;
      
      const user = await prisma.user.create({
        data: {
          clerkId: `user_${uuidv4()}`,
          anonymousId: `anon_${uuidv4()}`,
          phoneNumber,
          nickname,
          age,
          gender,
          bio,
          isVerified: Math.random() > 0.3,
          credits: Math.floor(Math.random() * 20),
          isPremium,
          premiumLevel: isPremium ? PremiumLevel.BASIC : PremiumLevel.FREE,
          premiumUntil: isPremium ? new Date('2025-12-31') : null,
          companyName: Math.random() > 0.7 ? getRandomElement(companies).name : null,
          interests: [getRandomElement(['음악감상', '영화관람', '독서', '요리', '운동'])],
          height: 160 + Math.floor(Math.random() * 30),
          mbti: getRandomElement(['ENFP', 'INFP', 'ENFJ', 'INFJ']),
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      users.push(user);
    }
    console.log(`✅ ${users.length}명 사용자 완료`);

    // 회사 그룹 생성
    console.log('🏢 공식 그룹 생성 중...');
    const officialGroups = [];
    for (const company of companiesData) {
      const group = await prisma.group.create({
        data: {
          name: company.name,
          description: `${company.name} 임직원들을 위한 공식 그룹입니다.`,
          type: GroupType.OFFICIAL,
          isActive: true,
          maxMembers: 1000,
          companyId: company.id,
          settings: {},
          creatorId: getRandomElement(users).id,
        },
      });
      officialGroups.push(group);
    }
    console.log(`✅ ${officialGroups.length}개 공식 그룹 완료`);

    // 취미 그룹 생성
    console.log('🎯 취미 그룹 생성 중...');
    const createdGroups = [];
    for (const hobby of hobbyGroups) {
      const group = await prisma.group.create({
        data: {
          name: hobby.name,
          description: hobby.description,
          type: GroupType.CREATED,
          isActive: true,
          maxMembers: 50,
          settings: {},
          creatorId: getRandomElement(users).id,
        },
      });
      createdGroups.push(group);
    }
    console.log(`✅ ${createdGroups.length}개 취미 그룹 완료`);

    // 위치 그룹 생성
    console.log('📍 위치 그룹 생성 중...');
    const locationGroups = [];
    for (const loc of locations) {
      const group = await prisma.group.create({
        data: {
          name: loc.name,
          description: `${loc.name}에서 만나는 사람들`,
          type: GroupType.LOCATION,
          isActive: true,
          maxMembers: 30,
          settings: {},
          location: {
            latitude: loc.lat,
            longitude: loc.lng,
            address: loc.address,
            radius: 1.0,
          },
          creatorId: getRandomElement(users).id,
        },
      });
      locationGroups.push(group);
    }
    console.log(`✅ ${locationGroups.length}개 위치 그룹 완료`);

    // 그룹 멤버십 생성
    console.log('🤝 그룹 멤버십 생성 중...');
    const allGroups = [...officialGroups, ...createdGroups, ...locationGroups];
    let membershipCount = 0;

    for (const group of allGroups) {
      const memberCount = 5 + Math.floor(Math.random() * 10); // 5-15명
      const selectedUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, memberCount);
      
      for (const [index, user] of selectedUsers.entries()) {
        let role = GroupMemberRole.MEMBER;
        if (user.id === group.creatorId) {
          role = GroupMemberRole.CREATOR;
        } else if (index === 0) {
          role = GroupMemberRole.ADMIN;
        }

        await prisma.groupMember.create({
          data: {
            userId: user.id,
            groupId: group.id,
            role,
            status: GroupMemberStatus.ACTIVE,
            joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        membershipCount++;
      }
    }
    console.log(`✅ ${membershipCount}개 멤버십 완료`);

    // 좋아요 생성
    console.log('💖 좋아요 생성 중...');
    let likeCount = 0;
    for (let i = 0; i < 50; i++) { // 50개의 좋아요
      const fromUser = getRandomElement(users);
      const toUser = getRandomElement(users.filter(u => u.id !== fromUser.id));
      const group = getRandomElement(allGroups);

      try {
        await prisma.userLike.create({
          data: {
            fromUserId: fromUser.id,
            toUserId: toUser.id,
            groupId: group.id,
            isSuper: Math.random() > 0.9,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
        likeCount++;
      } catch (error) {
        // 중복 좋아요 무시
      }
    }
    console.log(`✅ ${likeCount}개 좋아요 완료`);

    console.log('🎉 Railway 빠른 테스트 데이터 생성 완료!');
    
    // 최종 통계
    const stats = {
      users: await prisma.user.count(),
      companies: await prisma.company.count(),
      groups: await prisma.group.count(),
      memberships: await prisma.groupMember.count(),
      likes: await prisma.userLike.count(),
    };

    console.log('\n📊 생성된 데이터:');
    console.log(`👥 사용자: ${stats.users}명`);
    console.log(`🏢 회사: ${stats.companies}개`);
    console.log(`👥 그룹: ${stats.groups}개`);
    console.log(`🤝 멤버십: ${stats.memberships}개`);
    console.log(`💖 좋아요: ${stats.likes}개`);

    console.log('\n🚄 Railway 테스트 데이터 준비 완료!');

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 중 오류:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });