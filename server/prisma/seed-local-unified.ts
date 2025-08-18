import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType, PremiumLevel, VerificationStatus, MatchStatus, MessageType, PaymentType, PaymentStatus, PaymentMethod, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

// 한국 이름 및 닉네임 데이터 (Railway와 동일하게 풍부하게)
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
const firstNamesMale = ['민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '지후', '준서', '준우', '건우', '도현', '현우', '지훈'];
const firstNamesFemale = ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '지유', '지민', '채원', '수빈', '지아', '수아', '다은', '예은'];
const nicknames = [
  '커피러버', '헬스매니아', '음악감상가', '요리왕', '영화광', '등산러', '북벌레', '게이머', '여행가', '사진작가', 
  '댄서', '러너', '골퍼', '스키어', '서퍼', '카페마니아', '독서광', '맛집탐방가', '드라마러버', '운동러버',
  '아티스트', '뮤지션', '워커', '테크니션', '크리에이터', '플레이어', '캠퍼', '라이더', '스케이터', '클라이머'
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
  '반려동물과 함께하는 일상이 행복해요 🐕',
  '요가와 명상으로 마음의 평화를 찾아요 🧘‍♀️',
  '맛있는 음식 만들기가 취미입니다 👨‍🍳',
  '새벽 런닝으로 하루를 시작해요 🏃‍♂️'
];

// 회사 및 대학교 데이터 (Railway와 동일)
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
];

// 취미 그룹 데이터 (Railway와 동일)
const hobbyGroups = [
  { name: '독서 모임 - 책갈피', description: '매월 한 권의 책을 함께 읽고 토론하는 모임입니다 📚' },
  { name: '러닝 크루 - 한강러너스', description: '매주 화요일, 목요일 저녁 7시 한강에서 함께 달려요! 🏃‍♂️' },
  { name: '요리 클럽 - 쿡쿡', description: '맛있는 요리를 함께 만들고 나누는 모임 👨‍🍳' },
  { name: '영화 동호회 - 씨네필', description: '주말마다 영화 보고 이야기 나누는 모임 🎬' },
  { name: '등산 모임 - 산타클럽', description: '주말 아침 함께 산을 오르며 건강을 챙겨요 ⛰️' },
  { name: '사진 동호회 - 포토그래퍼스', description: '출사 가고 사진 찍는 것을 좋아하는 사람들의 모임 📷' },
  { name: '보드게임 카페 모임', description: '매주 금요일 저녁 보드게임을 즐기는 모임 🎲' },
  { name: '와인 테이스팅 클럽', description: '와인을 좋아하는 사람들의 모임 🍷' },
  { name: '댄스 동호회 - 무브먼트', description: 'K-POP 댄스를 배우고 즐기는 모임 💃' },
  { name: '명상과 요가', description: '매일 아침 6시 명상과 요가로 하루를 시작해요 🧘‍♀️' },
  { name: '카페 투어 모임', description: '서울의 숨은 카페들을 찾아다니는 모임 ☕' },
  { name: '스타트업 네트워킹', description: '스타트업에 관심있는 사람들의 네트워킹 모임 🚀' },
];

// 위치 기반 그룹 데이터 (Railway와 동일)
const locations = [
  { name: '강남역 스타벅스', lat: 37.498095, lng: 127.027610, address: '서울 강남구 강남대로 390', description: '강남역 스타벅스에서 커피 한잔 ☕' },
  { name: '코엑스 몰', lat: 37.512572, lng: 127.059074, address: '서울 강남구 영동대로 513', description: '코엑스에서 쇼핑하며 만나요 🛍️' },
  { name: '선릉역 주변', lat: 37.504503, lng: 127.048861, address: '서울 강남구 테헤란로 340', description: '선릉역 근처 직장인 모임' },
  { name: '역삼역 먹자골목', lat: 37.500622, lng: 127.036456, address: '서울 강남구 역삼동', description: '맛집 탐방 함께해요 🍜' },
  { name: '가로수길', lat: 37.520357, lng: 127.023102, address: '서울 강남구 신사동', description: '가로수길 쇼핑 & 카페 투어' },
  { name: '홍대 걷고싶은거리', lat: 37.556785, lng: 126.923516, address: '서울 마포구 와우산로 29길', description: '홍대에서 놀고 먹기! 🎉' },
  { name: '명동 쇼핑거리', lat: 37.563600, lng: 126.983337, address: '서울 중구 명동길', description: '명동에서 쇼핑과 맛집 탐방 🛒' },
  { name: '이태원 다국적 음식거리', lat: 37.534567, lng: 126.994441, address: '서울 용산구 이태원로', description: '세계 각국의 음식을 맛보자! 🌍' },
];

// 채팅 메시지 템플릿
const chatMessages = [
  '안녕하세요! 반갑습니다 😊',
  '프로필 보니까 취미가 비슷하네요!',
  '혹시 시간 되시면 커피 한잔 어떠세요?',
  '어떤 음식을 좋아하시나요?',
  '주말에 뭐 하시나요?',
  '영화 추천해주실 만한 게 있을까요?',
  '요즘 읽고 있는 책이 있나요?',
  '운동은 어떤 걸 하시나요?',
  '여행 가고 싶은 곳이 있나요?',
  '오늘 날씨가 정말 좋네요!',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  return `010${Math.floor(Math.random() * 90000000) + 10000000}`;
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
  console.log('🌱 로컬 개발용 통합 데이터베이스 시드 시작...');

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

  // 1. 회사/대학교 생성
  const createdCompanies = [];
  
  // 회사 생성
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

  // 대학교 생성
  for (const university of universities) {
    const created = await prisma.company.create({
      data: {
        name: university.name,
        domain: university.domain,
        type: CompanyType.UNIVERSITY,
        isVerified: true,
        logo: `https://logo.clearbit.com/${university.domain}`,
      }
    });
    createdCompanies.push(created);
  }

  console.log(`✅ ${createdCompanies.length}개 회사/대학교 생성 완료`);

  // 2. 사용자 생성 (150명 - Railway와 비슷한 규모)
  const createdUsers = [];
  for (let i = 0; i < 150; i++) {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const nameData = generateRandomName(gender);
    const company = Math.random() > 0.3 ? getRandomElement(createdCompanies) : null;
    
    const user = await prisma.user.create({
      data: {
        anonymousId: `anon_${i + 1}`,
        phoneNumber: generatePhoneNumber(),
        nickname: `${getRandomElement(nicknames)}${i + 1}`,
        gender,
        age: 22 + Math.floor(Math.random() * 16), // 22-37세
        bio: getRandomElement(bios),
        profileImage: `https://picsum.photos/400/400?random=${i + 1}`,
        credits: Math.floor(Math.random() * 10) + 1,
        isPremium: Math.random() > 0.8,
        premiumLevel: Math.random() > 0.8 ? PremiumLevel.PREMIUM : PremiumLevel.FREE,
        companyName: company?.name,
        createdAt: generateRandomDate(60),
        lastActive: generateRandomDate(7),
      }
    });
    createdUsers.push(user);
  }

  console.log(`✅ ${createdUsers.length}명 사용자 생성 완료`);

  // 3. 공식 그룹 생성 (회사/대학교 기반)
  const createdGroups = [];
  
  for (const company of createdCompanies) {
    const group = await prisma.group.create({
      data: {
        name: company.name,
        description: `${company.name} 임직원들을 위한 공식 그룹입니다.`,
        type: GroupType.OFFICIAL,
        imageUrl: company.logo,
        maxMembers: company.type === CompanyType.UNIVERSITY ? 5000 : 1000,
        isActive: true,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
        creator: {
          connect: { id: getRandomElement(createdUsers).id }
        },
        company: {
          connect: { id: company.id }
        },
        createdAt: generateRandomDate(90),
      }
    });
    createdGroups.push(group);
  }

  console.log(`✅ ${createdCompanies.length}개 공식 그룹 생성 완료`);

  // 4. 취미 그룹 생성
  for (const hobbyData of hobbyGroups) {
    const creator = getRandomElement(createdUsers);
    const group = await prisma.group.create({
      data: {
        name: hobbyData.name,
        description: hobbyData.description,
        type: GroupType.CREATED,
        maxMembers: 100,
        isActive: true,
        settings: {
          requiresApproval: Math.random() > 0.7,
          allowInvites: true,
          isPrivate: Math.random() > 0.8,
        },
        creator: {
          connect: { id: creator.id }
        },
        createdAt: generateRandomDate(30),
      }
    });
    createdGroups.push(group);
  }

  console.log(`✅ ${hobbyGroups.length}개 취미 그룹 생성 완료`);

  // 5. 위치 그룹 생성
  for (const locationData of locations) {
    const creator = getRandomElement(createdUsers);
    const group = await prisma.group.create({
      data: {
        name: locationData.name,
        description: locationData.description,
        type: GroupType.LOCATION,
        maxMembers: 50,
        isActive: true,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
        location: {
          address: locationData.address,
          latitude: locationData.lat,
          longitude: locationData.lng,
        },
        creator: {
          connect: { id: creator.id }
        },
        createdAt: generateRandomDate(7),
      }
    });
    createdGroups.push(group);
  }

  console.log(`✅ ${locations.length}개 위치 그룹 생성 완료`);

  // 6. 그룹 멤버 추가
  let memberCount = 0;
  for (const group of createdGroups) {
    const numMembers = Math.floor(Math.random() * 30) + 10; // 10-39명
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numMembers, shuffledUsers.length); i++) {
      try {
        await prisma.groupMember.create({
          data: {
            userId: shuffledUsers[i].id,
            groupId: group.id,
            role: i === 0 ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER,
            status: GroupMemberStatus.ACTIVE,
            joinedAt: generateRandomDate(20),
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

  // 7. 좋아요 생성 (500개)
  let likeCount = 0;
  for (let i = 0; i < 500; i++) {
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
          createdAt: generateRandomDate(14),
        }
      });
      likeCount++;
    } catch (error) {
      // 중복 좋아요 무시
      continue;
    }
  }

  console.log(`✅ ${likeCount}개 좋아요 생성 완료`);

  // 8. 매칭 생성 (50개)
  const matches = [];
  for (let i = 0; i < 50; i++) {
    const user1 = getRandomElement(createdUsers);
    const user2 = getRandomElement(createdUsers.filter(u => u.id !== user1.id));
    const group = getRandomElement(createdGroups);
    
    try {
      const match = await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
          groupId: group.id,
          status: Math.random() > 0.2 ? MatchStatus.ACTIVE : MatchStatus.EXPIRED,
          lastMessageAt: Math.random() > 0.5 ? generateRandomDate(3) : null,
          createdAt: generateRandomDate(14),
        }
      });
      matches.push(match);
    } catch (error) {
      continue;
    }
  }

  console.log(`✅ ${matches.length}개 매칭 생성 완료`);

  // 9. 채팅 메시지 생성
  let messageCount = 0;
  for (const match of matches.filter(m => m.status === MatchStatus.ACTIVE)) {
    const msgCount = Math.floor(Math.random() * 15) + 5; // 5-19개 메시지
    for (let i = 0; i < msgCount; i++) {
      const sender = Math.random() > 0.5 ? match.user1Id : match.user2Id;
      try {
        await prisma.chatMessage.create({
          data: {
            matchId: match.id,
            senderId: sender,
            type: MessageType.TEXT,
            content: getRandomElement(chatMessages),
            isEncrypted: true,
            createdAt: new Date(match.createdAt.getTime() + i * 60 * 60 * 1000), // 1시간씩 간격
          }
        });
        messageCount++;
      } catch (error) {
        continue;
      }
    }
  }

  console.log(`✅ ${messageCount}개 채팅 메시지 생성 완료`);

  // 통계 출력
  const stats = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    groups: await prisma.group.count(),
    members: await prisma.groupMember.count(),
    likes: await prisma.userLike.count(),
    matches: await prisma.match.count(),
    messages: await prisma.chatMessage.count(),
  };

  console.log('\n🎉 로컬 개발용 통합 데이터베이스 시드 완료!');
  console.log('📊 생성된 데이터 통계:');
  console.log(`   - 사용자: ${stats.users}명`);
  console.log(`   - 회사/대학교: ${stats.companies}개`);
  console.log(`   - 그룹: ${stats.groups}개`);
  console.log(`   - 멤버십: ${stats.members}개`);
  console.log(`   - 좋아요: ${stats.likes}개`);
  console.log(`   - 매칭: ${stats.matches}개`);
  console.log(`   - 채팅 메시지: ${stats.messages}개`);
  console.log('\n🚀 로컬과 Railway 데이터 구조가 통일되었습니다!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });