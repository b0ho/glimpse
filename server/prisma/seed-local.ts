import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType, PremiumLevel, VerificationStatus, MatchStatus, MessageType, PaymentType, PaymentStatus, PaymentMethod, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 한국 이름 및 닉네임 데이터 (mockData.ts에서 가져온 데이터 포함)
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
const firstNamesMale = ['민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '지후', '준서', '준우', '건우', '도현', '현우', '지훈'];
const firstNamesFemale = ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '지유', '지민', '채원', '수빈', '지아', '수아', '다은', '예은'];
const nicknames = [
  '커피러버', '산책마니아', '책벌레', '영화광', '음악애호가', '요리사', '여행자', '헬스매니아', '게이머', '사진작가', 
  '댄서', '러너', '골퍼', '스키어', '서퍼', '카페마니아', '독서광', '맛집탐방가', '드라마러버', '운동러버',
  '등산러', '북벌레', '라이더', '캠퍼', '플레이어', '아티스트', '뮤지션', '워커', '테크니션', '크리에이터'
];

const bios = [
  '안녕하세요! 새로운 만남을 기대하고 있어요 😊',
  '커피와 책을 좋아하는 조용한 성격입니다',
  '운동과 건강한 삶을 추구해요 💪',
  '맛집 탐방과 요리를 좋아합니다 🍳',
  '영화와 드라마 정주행이 취미예요 🎬',
  '주말엔 등산, 캠핑을 즐겨요 ⛰️',
  '음악 감상과 공연 보는 걸 좋아해요 🎵',
  '새로운 사람들과 대화하는 걸 좋아합니다',
  '여행과 사진 찍기를 좋아해요 📸',
  '카페에서 책 읽는 걸 좋아합니다 ☕️📚',
  '건강한 라이프스타일을 추구합니다',
  '새로운 도전을 좋아해요 🚀',
  '오늘 날씨가 정말 좋네요! 산책하기 딱 좋은 날씨에요 ☀️',
  '점심으로 새로운 카페에 갔는데 커피가 정말 맛있었어요 ☕',
  '주말에 영화 보러 갈 예정인데 추천해주실 만한 영화 있나요?',
  '운동 시작한지 일주일 됐는데 벌써 효과가 보이는 것 같아요 💪',
];

const contentTexts = [
  '오늘 날씨가 너무 좋네요! 다들 좋은 하루 되세요 ☀️',
  '새로 오픈한 카페에서 맛있는 커피 한잔 했어요 ☕️',
  '주말 영화 추천 받습니다! 로맨스 말고 액션으로요 🎬',
  '운동 시작한지 한 달, 확실히 체력이 늘었네요 💪',
  '독서모임에서 읽은 책이 너무 좋았어요 📚',
  '집에서 파스타 만들어 봤는데 생각보다 맛있게 나왔어요! 🍝',
  '퇴근길 일몰이 정말 예뻤어요 🌅',
  '새로운 취미를 시작해보려고 하는데 추천해주세요!',
  '맛집 발견했어요! 다음에 함께 가실 분 있나요? 🍽️',
  '주말 한강 산책 어떠세요? 날씨 좋을 것 같아요 🚶‍♀️',
  '새 앨범 듣고 있는데 정말 좋네요 🎵',
  '오늘 요가 수업 다녀왔는데 몸이 한결 가벼워진 느낌이에요 🧘‍♀️',
  '드라마 정주행하느라 밤을 샜네요... 😅',
  '새로 산 향수 냄새가 너무 좋아요 ✨',
  '친구와 맛있는 브런치 먹고 왔어요 🥐',
];

// 회사 및 대학교 데이터
const companies = [
  { name: '삼성전자', domain: 'samsung.com', nameKr: '삼성전자' },
  { name: 'LG전자', domain: 'lge.com', nameKr: 'LG전자' },
  { name: '현대자동차', domain: 'hyundai.com', nameKr: '현대자동차' },
  { name: 'SK텔레콤', domain: 'sktelecom.com', nameKr: 'SK텔레콤' },
  { name: '네이버', domain: 'navercorp.com', nameKr: '네이버' },
  { name: '카카오', domain: 'kakaocorp.com', nameKr: '카카오' },
  { name: '쿠팡', domain: 'coupang.com', nameKr: '쿠팡' },
  { name: '배달의민족', domain: 'woowahan.com', nameKr: '배달의민족' },
  { name: '토스', domain: 'toss.im', nameKr: '토스' },
  { name: '당근마켓', domain: 'daangn.com', nameKr: '당근마켓' },
  { name: '라인플러스', domain: 'linecorp.com', nameKr: '라인플러스' },
  { name: '우아한형제들', domain: 'woowahan.com', nameKr: '우아한형제들' },
];

const universities = [
  { name: '서울대학교', domain: 'snu.ac.kr', nameKr: '서울대학교' },
  { name: '연세대학교', domain: 'yonsei.ac.kr', nameKr: '연세대학교' },
  { name: '고려대학교', domain: 'korea.ac.kr', nameKr: '고려대학교' },
  { name: '서강대학교', domain: 'sogang.ac.kr', nameKr: '서강대학교' },
  { name: '성균관대학교', domain: 'skku.edu', nameKr: '성균관대학교' },
  { name: '한양대학교', domain: 'hanyang.ac.kr', nameKr: '한양대학교' },
  { name: '이화여자대학교', domain: 'ewha.ac.kr', nameKr: '이화여자대학교' },
  { name: '중앙대학교', domain: 'cau.ac.kr', nameKr: '중앙대학교' },
  { name: '경희대학교', domain: 'khu.ac.kr', nameKr: '경희대학교' },
  { name: '건국대학교', domain: 'konkuk.ac.kr', nameKr: '건국대학교' },
];

// 생성된 그룹 데이터 (mockData.ts에서 영감받음)
const createdGroups = [
  {
    name: '홍대 독서모임',
    description: '매주 토요일 홍대에서 만나는 20-30대 독서모임입니다 📚',
    type: GroupType.CREATED,
  },
  {
    name: '강남 러닝크루',
    description: '매주 화/목 저녁 한강에서 함께 뛰는 모임 🏃‍♂️',
    type: GroupType.CREATED,
  },
  {
    name: '요리 마스터즈',
    description: '요리를 배우고 나누는 모임, 초보자도 환영해요! 👨‍🍳',
    type: GroupType.CREATED,
  },
  {
    name: '영화 토론 클럽',
    description: '매주 새로운 영화를 보고 토론하는 모임 🎬',
    type: GroupType.CREATED,
  },
  {
    name: '등산 동호회',
    description: '주말마다 서울 근교 산을 정복하는 모임 ⛰️',
    type: GroupType.CREATED,
  },
  {
    name: '카페 탐방단',
    description: '서울의 숨겨진 카페들을 찾아다니는 모임 ☕',
    type: GroupType.CREATED,
  },
  {
    name: '보드게임 클럽',
    description: '다양한 보드게임을 즐기는 모임, 신규 회원 모집! 🎲',
    type: GroupType.CREATED,
  },
  {
    name: '사진 동호회',
    description: '사진 촬영과 편집 기술을 공유하는 모임 📸',
    type: GroupType.CREATED,
  },
];

// 위치 기반 그룹 데이터
const locationGroups = [
  {
    name: '스타벅스 강남역점',
    description: '스타벅스 강남역점에 있는 사람들의 그룹',
    address: '서울 강남구 강남대로 390',
    latitude: 37.4979,
    longitude: 127.0276,
  },
  {
    name: '홍대입구역 근처',
    description: '홍대입구역 주변에 있는 사람들의 모임',
    address: '서울 마포구 양화로 160',
    latitude: 37.5564,
    longitude: 126.9236,
  },
  {
    name: '건대입구 CGV',
    description: '건대 CGV에서 영화 보는 사람들',
    address: '서울 광진구 능동로 120',
    latitude: 37.5403,
    longitude: 127.0698,
  },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomName(gender: Gender): { firstName: string; lastName: string; fullName: string } {
  const lastName = getRandomElement(lastNames);
  const firstName = gender === Gender.MALE ? getRandomElement(firstNamesMale) : getRandomElement(firstNamesFemale);
  return {
    firstName,
    lastName,
    fullName: `${lastName}${firstName}`
  };
}

function generateRandomDate(daysAgo: number = 30): Date {
  return new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('🌱 로컬 개발용 데이터베이스 시드 시작...');

  // 기존 데이터 정리
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.content.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('🗑️ 기존 데이터 정리 완료');

  // 1. 회사/대학교 생성
  const createdCompanies = [];
  for (const company of companies) {
    const created = await prisma.company.create({
      data: {
        name: company.name,
        nameKr: company.nameKr,
        domain: company.domain,
        type: CompanyType.COMPANY,
        emailDomains: [company.domain],
        isVerified: true,
        logoUrl: `https://logo.clearbit.com/${company.domain}`,
      }
    });
    createdCompanies.push(created);
  }

  for (const university of universities) {
    const created = await prisma.company.create({
      data: {
        name: university.name,
        nameKr: university.nameKr,
        domain: university.domain,
        type: CompanyType.UNIVERSITY,
        emailDomains: [university.domain],
        isVerified: true,
        logoUrl: `https://logo.clearbit.com/${university.domain}`,
      }
    });
    createdCompanies.push(created);
  }

  console.log(`✅ ${createdCompanies.length}개 회사/대학교 생성 완료`);

  // 2. 사용자 생성 (200명)
  const createdUsers = [];
  for (let i = 0; i < 200; i++) {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const nameData = generateRandomName(gender);
    const company = Math.random() > 0.3 ? getRandomElement(createdCompanies) : null;
    
    const user = await prisma.user.create({
      data: {
        clerkId: `local_user_${i + 1}`,
        email: `user${i + 1}@${company?.domain || 'example.com'}`,
        firstName: nameData.firstName,
        lastName: nameData.lastName,
        nickname: `${getRandomElement(nicknames)}${i + 1}`,
        gender,
        age: 22 + Math.floor(Math.random() * 16), // 22-37세
        bio: getRandomElement(bios),
        profileImageUrl: `https://picsum.photos/400/400?random=${i + 1}`,
        isActive: true,
        premiumLevel: Math.random() > 0.8 ? PremiumLevel.PREMIUM : PremiumLevel.FREE,
        premiumExpiresAt: Math.random() > 0.8 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        companyId: company?.id,
        verificationStatus: company ? VerificationStatus.VERIFIED : VerificationStatus.PENDING,
        createdAt: generateRandomDate(60),
      }
    });
    createdUsers.push(user);
  }

  console.log(`✅ ${createdUsers.length}명 사용자 생성 완료`);

  // 3. 공식 그룹 생성 (회사/대학교 기반)
  const createdGroups_official = [];
  for (const company of createdCompanies) {
    const group = await prisma.group.create({
      data: {
        name: company.nameKr,
        description: `${company.nameKr} 임직원들을 위한 공식 그룹입니다.`,
        type: GroupType.OFFICIAL,
        imageUrl: company.logoUrl,
        isActive: true,
        maxMembers: company.type === CompanyType.UNIVERSITY ? 5000 : 10000,
        creatorId: getRandomElement(createdUsers.filter(u => u.companyId === company.id))?.id || createdUsers[0].id,
        companyId: company.id,
        createdAt: generateRandomDate(90),
      }
    });
    createdGroups_official.push(group);

    // 해당 회사/대학교 사용자들을 그룹에 추가
    const companyUsers = createdUsers.filter(u => u.companyId === company.id);
    const memberCount = Math.min(companyUsers.length, Math.floor(Math.random() * 80) + 20);
    
    for (let i = 0; i < memberCount && i < companyUsers.length; i++) {
      await prisma.groupMember.create({
        data: {
          userId: companyUsers[i].id,
          groupId: group.id,
          role: i === 0 ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER,
          status: GroupMemberStatus.ACTIVE,
          joinedAt: generateRandomDate(60),
        }
      });
    }
  }

  console.log(`✅ ${createdGroups_official.length}개 공식 그룹 생성 완료`);

  // 4. 생성 그룹 (취미/관심사 기반)
  const createdGroups_hobby = [];
  for (const groupData of createdGroups) {
    const creator = getRandomElement(createdUsers);
    const group = await prisma.group.create({
      data: {
        name: groupData.name,
        description: groupData.description,
        type: groupData.type,
        isActive: true,
        maxMembers: 100,
        creatorId: creator.id,
        createdAt: generateRandomDate(30),
        settings: {
          requiresApproval: Math.random() > 0.7,
          allowInvites: true,
          isPrivate: Math.random() > 0.8,
        },
      }
    });
    createdGroups_hobby.push(group);

    // 랜덤 멤버 추가 (5-30명)
    const memberCount = Math.floor(Math.random() * 25) + 5;
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < memberCount; i++) {
      await prisma.groupMember.create({
        data: {
          userId: shuffledUsers[i].id,
          groupId: group.id,
          role: shuffledUsers[i].id === creator.id ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER,
          status: GroupMemberStatus.ACTIVE,
          joinedAt: generateRandomDate(20),
        }
      });
    }
  }

  console.log(`✅ ${createdGroups_hobby.length}개 취미 그룹 생성 완료`);

  // 5. 위치 그룹 생성
  const createdGroups_location = [];
  for (const locationData of locationGroups) {
    const creator = getRandomElement(createdUsers);
    const group = await prisma.group.create({
      data: {
        name: locationData.name,
        description: locationData.description,
        type: GroupType.LOCATION,
        isActive: true,
        maxMembers: 50,
        creatorId: creator.id,
        location: {
          address: locationData.address,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
        createdAt: generateRandomDate(7),
      }
    });
    createdGroups_location.push(group);

    // 랜덤 멤버 추가 (10-30명)
    const memberCount = Math.floor(Math.random() * 20) + 10;
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < memberCount; i++) {
      await prisma.groupMember.create({
        data: {
          userId: shuffledUsers[i].id,
          groupId: group.id,
          role: shuffledUsers[i].id === creator.id ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER,
          status: GroupMemberStatus.ACTIVE,
          joinedAt: generateRandomDate(5),
        }
      });
    }
  }

  console.log(`✅ ${createdGroups_location.length}개 위치 그룹 생성 완료`);

  // 6. 콘텐츠 생성 (400개)
  const allGroups = [...createdGroups_official, ...createdGroups_hobby, ...createdGroups_location];
  const createdContents = [];
  
  for (let i = 0; i < 400; i++) {
    const author = getRandomElement(createdUsers);
    const group = getRandomElement(allGroups);
    const isImage = Math.random() > 0.7;
    
    const content = await prisma.content.create({
      data: {
        authorId: author.id,
        groupId: group.id,
        type: isImage ? 'image' : 'text',
        text: getRandomElement(contentTexts),
        imageUrls: isImage ? [`https://picsum.photos/600/400?random=${i + 1}`] : [],
        isPublic: true,
        views: Math.floor(Math.random() * 100),
        createdAt: generateRandomDate(14),
      }
    });
    createdContents.push(content);
  }

  console.log(`✅ ${createdContents.length}개 콘텐츠 생성 완료`);

  // 7. 좋아요 생성 (800개)
  for (let i = 0; i < 800; i++) {
    const fromUser = getRandomElement(createdUsers);
    const toUser = getRandomElement(createdUsers.filter(u => u.id !== fromUser.id));
    const group = getRandomElement(allGroups);
    
    try {
      await prisma.like.create({
        data: {
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          groupId: group.id,
          isSuper: Math.random() > 0.9,
          createdAt: generateRandomDate(7),
        }
      });
    } catch (error) {
      // 중복 좋아요 무시
      continue;
    }
  }

  console.log(`✅ 좋아요 데이터 생성 완료`);

  // 8. 매칭 생성 (100개)
  const matches = [];
  for (let i = 0; i < 100; i++) {
    const user1 = getRandomElement(createdUsers);
    const user2 = getRandomElement(createdUsers.filter(u => u.id !== user1.id));
    const group = getRandomElement(allGroups);
    
    try {
      const match = await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
          groupId: group.id,
          status: Math.random() > 0.2 ? MatchStatus.ACTIVE : MatchStatus.ENDED,
          createdAt: generateRandomDate(14),
        }
      });
      matches.push(match);
    } catch (error) {
      continue;
    }
  }

  console.log(`✅ ${matches.length}개 매칭 생성 완료`);

  // 9. 채팅 및 메시지 생성
  let messageCount = 0;
  for (const match of matches.slice(0, 50)) { // 처음 50개 매칭에만 채팅 생성
    const chat = await prisma.chat.create({
      data: {
        matchId: match.id,
        createdAt: match.createdAt,
      }
    });

    // 각 채팅당 5-20개 메시지
    const msgCount = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < msgCount; i++) {
      const sender = Math.random() > 0.5 ? match.user1Id : match.user2Id;
      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: sender,
          type: MessageType.TEXT,
          content: getRandomElement([
            '안녕하세요! 반가워요 😊',
            '프로필 보고 연락드렸어요',
            '취미가 비슷하네요!',
            '시간 되시면 커피 한잔 어떠세요?',
            '좋은 하루 되세요!',
            '네, 좋아요!',
            '언제 시간 괜찮으세요?',
            '주말에 만날까요?',
            '맛있는 카페 알고 있어요',
            '영화 같이 보실래요?',
          ]),
          createdAt: new Date(match.createdAt.getTime() + i * 60 * 60 * 1000), // 1시간씩 간격
        }
      });
      messageCount++;
    }
  }

  console.log(`✅ ${messageCount}개 메시지 생성 완료`);

  // 통계 출력
  const stats = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    groups: await prisma.group.count(),
    contents: await prisma.content.count(),
    likes: await prisma.like.count(),
    matches: await prisma.match.count(),
    messages: await prisma.message.count(),
  };

  console.log('\n🎉 로컬 개발용 데이터베이스 시드 완료!');
  console.log('📊 생성된 데이터 통계:');
  console.log(`   - 사용자: ${stats.users}명`);
  console.log(`   - 회사/대학교: ${stats.companies}개`);
  console.log(`   - 그룹: ${stats.groups}개`);
  console.log(`   - 콘텐츠: ${stats.contents}개`);
  console.log(`   - 좋아요: ${stats.likes}개`);
  console.log(`   - 매칭: ${stats.matches}개`);
  console.log(`   - 메시지: ${stats.messages}개`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });