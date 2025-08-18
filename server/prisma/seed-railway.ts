import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType, PremiumLevel, VerificationStatus, MatchStatus, MessageType, PaymentType, PaymentStatus, PaymentMethod, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 한국 이름 및 닉네임 데이터
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
const firstNamesMale = ['민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '지후', '준서', '준우', '건우', '도현', '현우', '지훈'];
const firstNamesFemale = ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '지유', '지민', '채원', '수빈', '지아', '수아', '다은', '예은'];
const nicknames = ['커피러버', '헬스매니아', '음악감상가', '요리왕', '영화광', '등산러', '북벌레', '게이머', '여행가', '사진작가', '댄서', '러너', '골퍼', '스키어', '서퍼', '카페마니아', '독서광', '맛집탐방가', '드라마러버', '운동러버'];

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
];

// 회사 데이터
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

// 취미 그룹
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

// 위치 기반 그룹
const locations = [
  { name: '강남역 스타벅스', lat: 37.498095, lng: 127.027610, address: '서울 강남구 강남대로 390', description: '강남역 스타벅스에서 커피 한잔 ☕' },
  { name: '코엑스 몰', lat: 37.512572, lng: 127.059074, address: '서울 강남구 영동대로 513', description: '코엑스에서 쇼핑하며 만나요 🛍️' },
  { name: '선릉역 주변', lat: 37.504503, lng: 127.048861, address: '서울 강남구 테헤란로 340', description: '선릉역 근처 직장인 모임' },
  { name: '역삼역 먹자골목', lat: 37.500622, lng: 127.036456, address: '서울 강남구 역삼동', description: '맛집 탐방 함께해요 🍜' },
  { name: '가로수길', lat: 37.520357, lng: 127.023102, address: '서울 강남구 신사동', description: '가로수길 쇼핑 & 카페 투어' },
  { name: '홍대 걷고싶은거리', lat: 37.556785, lng: 126.923516, address: '서울 마포구 와우산로 29길', description: '홍대에서 놀고 먹기! 🎉' },
  { name: '명동 쇼핑거리', lat: 37.563600, lng: 126.983337, address: '서울 중구 명동길', description: '명동에서 쇼핑과 맛집 탐방 🛒' },
  { name: '이태원 다국적 음식거리', lat: 37.534567, lng: 126.994441, address: '서울 용산구 이태원로', description: '세계 각국의 음식을 맛보자! 🌍' },
  { name: '여의도 한강공원', lat: 37.528926, lng: 126.934906, address: '서울 영등포구 여의동로 330', description: '한강에서 피크닉과 산책 🌳' },
  { name: '성수동 카페거리', lat: 37.544587, lng: 127.055908, address: '서울 성동구 성수일로', description: '힙한 성수동 카페 투어 ☕' },
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
  return `010${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
}

async function main() {
  console.log('🚄 Railway PostgreSQL 전체 테스트 데이터 생성 시작...');

  try {
    // 회사 도메인 데이터 생성
    const companyDomains = await Promise.all(
      companies.concat(universities).map(org =>
        prisma.companyDomain.upsert({
          where: { domain: org.domain },
          update: {},
          create: {
            domain: org.domain,
            companyName: org.name,
            companyNameKr: org.nameKr,
            isVerified: true,
            industry: companies.includes(org as any) ? 'Technology' : 'Education',
            logoUrl: `https://logo.clearbit.com/${org.domain}`,
          },
        })
      )
    );

    console.log(`✅ ${companyDomains.length}개의 회사 도메인 생성 완료`);

    // 회사 데이터 생성
    const companiesData = await Promise.all(
      companies.concat(universities).map((org, index) =>
        prisma.company.upsert({
          where: { domain: org.domain },
          update: {},
          create: {
            name: org.name,
            domain: org.domain,
            logo: `https://logo.clearbit.com/${org.domain}`,
            isVerified: true,
            type: companies.includes(org as any) ? CompanyType.COMPANY : CompanyType.UNIVERSITY,
            description: `${org.nameKr} 공식 그룹입니다.`,
            location: index < 5 ? '서울특별시 강남구' : '서울특별시',
          },
        })
      )
    );

    console.log(`✅ ${companiesData.length}개의 회사/대학 생성 완료`);

    // 150명의 다양한 사용자 생성
    console.log('👥 사용자 생성 중...');
    const users = [];
    for (let i = 0; i < 150; i++) {
      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const lastName = getRandomElement(lastNames);
      const firstName = gender === Gender.MALE 
        ? getRandomElement(firstNamesMale)
        : getRandomElement(firstNamesFemale);
      const nickname = getRandomElement(nicknames) + (i + 1);
      const bio = getRandomElement(bios);
      const age = 20 + Math.floor(Math.random() * 20); // 20-39세
      const phoneNumber = generatePhoneNumber();
      const isPremium = Math.random() > 0.8; // 20% 프리미엄
      
      const user = await prisma.user.create({
        data: {
          clerkId: `user_${uuidv4()}`,
          anonymousId: `anon_${uuidv4()}`,
          phoneNumber,
          nickname,
          age,
          gender,
          bio,
          isVerified: Math.random() > 0.2, // 80% 인증
          credits: Math.floor(Math.random() * 50),
          isPremium,
          premiumLevel: isPremium ? (Math.random() > 0.5 ? PremiumLevel.BASIC : PremiumLevel.UPPER) : PremiumLevel.FREE,
          premiumUntil: isPremium ? new Date('2025-12-31') : null,
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
          companyName: Math.random() > 0.7 ? getRandomElement(companies.concat(universities)).nameKr : null,
          education: Math.random() > 0.6 ? getRandomElement(universities).nameKr : null,
          location: JSON.stringify({
            lat: 37.5665 + (Math.random() - 0.5) * 0.1,
            lng: 126.9780 + (Math.random() - 0.5) * 0.1,
          }),
          interests: [
            getRandomElement(['음악감상', '영화관람', '독서', '요리', '운동']),
            getRandomElement(['여행', '사진촬영', '게임', '댄스', '등산']),
            getRandomElement(['카페투어', '와인', '맥주', '드라마', '애니메이션']),
          ],
          height: 150 + Math.floor(Math.random() * 40), // 150-190cm
          mbti: getRandomElement(['ENFP', 'INFP', 'ENFJ', 'INFJ', 'ENTP', 'INTP', 'ENTJ', 'INTJ', 'ESFP', 'ISFP', 'ESFJ', 'ISFJ', 'ESTP', 'ISTP', 'ESTJ', 'ISTJ']),
          drinking: getRandomElement(['안마셔요', '가끔 마셔요', '자주 마셔요', '소셜드링킹']),
          smoking: getRandomElement(['안피워요', '가끔 피워요', '금연중']),
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 7일 내 활동
          locationSharingEnabled: Math.random() > 0.5,
        },
      });
      users.push(user);
    }

    console.log(`✅ ${users.length}명의 사용자 생성 완료`);

    // 페르소나 데이터 생성 (일부 사용자용)
    const personas = [];
    for (let i = 0; i < Math.floor(users.length * 0.3); i++) { // 30%의 사용자가 페르소나 보유
      const user = users[i];
      const persona = await prisma.persona.create({
        data: {
          userId: user.id,
          nickname: user.nickname + '_persona',
          age: user.age,
          bio: '이것은 페르소나 프로필입니다. ' + getRandomElement(bios),
          interests: [
            getRandomElement(['아트', '음악', '문학', '철학', '심리학']),
            getRandomElement(['창작활동', '봉사활동', '환경보호', '동물보호']),
          ],
          occupation: getRandomElement(['개발자', '디자이너', '마케터', '기획자', '컨설턴트', '교사', '의사', '변호사', '연구원', '예술가']),
          height: user.height,
          mbti: user.mbti,
          drinking: user.drinking,
          smoking: user.smoking,
        },
      });
      personas.push(persona);
    }

    console.log(`✅ ${personas.length}개의 페르소나 생성 완료`);

    // 회사 및 대학 그룹 생성
    const officialGroups = [];
    for (const company of companiesData) {
      const group = await prisma.group.create({
        data: {
          name: company.name,
          description: `${company.name} 임직원들을 위한 공식 그룹입니다.`,
          type: GroupType.OFFICIAL,
          isActive: true,
          maxMembers: company.type === CompanyType.COMPANY ? 10000 : 5000,
          companyId: company.id,
          settings: {},
          creatorId: getRandomElement(users).id,
          imageUrl: company.logo,
        },
      });
      officialGroups.push(group);
    }

    console.log(`✅ ${officialGroups.length}개의 공식 그룹 생성 완료`);

    // 취미 그룹 생성
    const createdGroups = [];
    for (const hobby of hobbyGroups) {
      const group = await prisma.group.create({
        data: {
          name: hobby.name,
          description: hobby.description,
          type: GroupType.CREATED,
          isActive: true,
          maxMembers: 100,
          settings: {},
          creatorId: getRandomElement(users).id,
        },
      });
      createdGroups.push(group);
    }

    console.log(`✅ ${createdGroups.length}개의 취미 그룹 생성 완료`);

    // 위치 기반 그룹 생성
    const locationGroups = [];
    for (const loc of locations) {
      const group = await prisma.group.create({
        data: {
          name: loc.name,
          description: loc.description,
          type: GroupType.LOCATION,
          isActive: true,
          maxMembers: 50,
          settings: {},
          location: {
            latitude: loc.lat,
            longitude: loc.lng,
            address: loc.address,
            radius: 0.5 + Math.random() * 1, // 0.5-1.5km
          },
          creatorId: getRandomElement(users).id,
        },
      });
      locationGroups.push(group);
    }

    console.log(`✅ ${locationGroups.length}개의 위치 기반 그룹 생성 완료`);

    // 그룹 멤버십 생성
    const allGroups = [...officialGroups, ...createdGroups, ...locationGroups];
    let membershipCount = 0;

    for (const group of allGroups) {
      const memberCount = 15 + Math.floor(Math.random() * 35); // 15-50명
      const selectedUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, memberCount);
      
      for (const [index, user] of selectedUsers.entries()) {
        let role = GroupMemberRole.MEMBER;
        if (user.id === group.creatorId) {
          role = GroupMemberRole.CREATOR;
        } else if (index < 3) { // 처음 3명은 관리자
          role = GroupMemberRole.ADMIN;
        }

        await prisma.groupMember.create({
          data: {
            userId: user.id,
            groupId: group.id,
            role,
            status: GroupMemberStatus.ACTIVE,
            joinedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // 최근 60일
          },
        });
        membershipCount++;
      }
    }

    console.log(`✅ ${membershipCount}개의 그룹 멤버십 생성 완료`);

    // 사용자 좋아요 및 매칭 생성
    console.log('💝 좋아요 및 매칭 시스템 데이터 생성 중...');
    const likes = [];
    const matches = [];

    for (let i = 0; i < 300; i++) { // 300개의 좋아요
      const fromUser = getRandomElement(users);
      const toUser = getRandomElement(users.filter(u => u.id !== fromUser.id));
      const group = getRandomElement(allGroups);

      try {
        const like = await prisma.userLike.create({
          data: {
            fromUserId: fromUser.id,
            toUserId: toUser.id,
            groupId: group.id,
            isSuper: Math.random() > 0.9, // 10% 슈퍼 좋아요
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        likes.push(like);

        // 상호 좋아요로 매치 생성 (20% 확률)
        if (Math.random() > 0.8) {
          try {
            await prisma.userLike.create({
              data: {
                fromUserId: toUser.id,
                toUserId: fromUser.id,
                groupId: group.id,
                isMatch: true,
              },
            });

            const match = await prisma.match.create({
              data: {
                user1Id: fromUser.id,
                user2Id: toUser.id,
                groupId: group.id,
                status: MatchStatus.ACTIVE,
                createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
              },
            });
            matches.push(match);
          } catch (error) {
            // 중복 데이터는 무시
          }
        }
      } catch (error) {
        // 중복 좋아요는 무시
      }
    }

    console.log(`✅ ${likes.length}개의 좋아요, ${matches.length}개의 매치 생성 완료`);

    // 채팅 메시지 생성
    let chatMessageCount = 0;
    for (const match of matches.slice(0, Math.min(matches.length, 50))) { // 상위 50개 매치에 메시지
      const messageCount = 3 + Math.floor(Math.random() * 15); // 3-18개 메시지
      
      for (let i = 0; i < messageCount; i++) {
        const sender = Math.random() > 0.5 ? match.user1Id : match.user2Id;
        await prisma.chatMessage.create({
          data: {
            matchId: match.id,
            senderId: sender,
            content: getRandomElement(chatMessages),
            type: MessageType.TEXT,
            isEncrypted: true,
            readAt: Math.random() > 0.3 ? new Date() : null, // 70% 읽음
            createdAt: new Date(match.createdAt.getTime() + i * 60 * 60 * 1000), // 매치 후 시간 순
          },
        });
        chatMessageCount++;
      }
    }

    console.log(`✅ ${chatMessageCount}개의 채팅 메시지 생성 완료`);

    // 결제 및 구독 데이터
    let paymentCount = 0;
    for (const user of users.slice(0, 30)) { // 30명의 결제 데이터
      if (Math.random() > 0.5) { // 50% 확률
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            amount: getRandomElement([2500, 5000, 9900, 19000, 99000]),
            currency: 'KRW',
            type: Math.random() > 0.7 ? PaymentType.PREMIUM_SUBSCRIPTION : PaymentType.LIKE_CREDITS,
            status: Math.random() > 0.9 ? PaymentStatus.FAILED : PaymentStatus.COMPLETED,
            method: getRandomElement([PaymentMethod.CARD, PaymentMethod.KAKAO_PAY, PaymentMethod.TOSS_PAY]),
            stripePaymentId: `pi_${uuidv4().substring(0, 24)}`,
            metadata: {},
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          },
        });
        paymentCount++;
      }
    }

    console.log(`✅ ${paymentCount}개의 결제 데이터 생성 완료`);

    // 알림 데이터
    let notificationCount = 0;
    for (const user of users.slice(0, 100)) { // 100명의 알림 데이터
      const notificationTypes = [
        NotificationType.LIKE_RECEIVED,
        NotificationType.MATCH_CREATED,
        NotificationType.MESSAGE_RECEIVED,
        NotificationType.GROUP_INVITATION,
      ];

      for (let i = 0; i < 3 + Math.floor(Math.random() * 7); i++) { // 3-10개 알림
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: getRandomElement(notificationTypes),
            title: '새로운 알림',
            message: '새로운 활동이 있습니다!',
            data: {},
            isRead: Math.random() > 0.4, // 60% 읽음
            readAt: Math.random() > 0.4 ? new Date() : null,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
        notificationCount++;
      }
    }

    console.log(`✅ ${notificationCount}개의 알림 생성 완료`);

    // 스토리 데이터
    let storyCount = 0;
    for (const user of users.slice(0, 50)) { // 50명의 스토리
      if (Math.random() > 0.6) { // 40% 확률
        await prisma.story.create({
          data: {
            userId: user.id,
            mediaUrl: `https://picsum.photos/400/600?random=${user.id}`,
            mediaType: 'IMAGE',
            caption: getRandomElement(['오늘의 일상 ✨', '좋은 하루! 😊', '맛있는 저녁 🍽️', '운동 완료! 💪', '새로운 카페 발견 ☕']),
            isActive: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
            createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000), // 최근 12시간
          },
        });
        storyCount++;
      }
    }

    console.log(`✅ ${storyCount}개의 스토리 생성 완료`);

    console.log('🎉 Railway PostgreSQL 전체 테스트 데이터 생성 완료!');
    
    // 최종 통계 출력
    const stats = {
      users: await prisma.user.count(),
      personas: await prisma.persona.count(),
      companies: await prisma.company.count(),
      companyDomains: await prisma.companyDomain.count(),
      groups: await prisma.group.count(),
      memberships: await prisma.groupMember.count(),
      likes: await prisma.userLike.count(),
      matches: await prisma.match.count(),
      chatMessages: await prisma.chatMessage.count(),
      payments: await prisma.payment.count(),
      notifications: await prisma.notification.count(),
      stories: await prisma.story.count(),
    };

    console.log('\n📊 Railway PostgreSQL 데이터베이스 통계:');
    console.log(`👥 사용자: ${stats.users}명`);
    console.log(`🎭 페르소나: ${stats.personas}개`);
    console.log(`🏢 회사: ${stats.companies}개`);
    console.log(`🌐 회사도메인: ${stats.companyDomains}개`);
    console.log(`👥 그룹: ${stats.groups}개`);
    console.log(`🤝 멤버십: ${stats.memberships}개`);
    console.log(`💖 좋아요: ${stats.likes}개`);
    console.log(`💕 매치: ${stats.matches}개`);
    console.log(`💬 채팅메시지: ${stats.chatMessages}개`);
    console.log(`💳 결제: ${stats.payments}개`);
    console.log(`🔔 알림: ${stats.notifications}개`);
    console.log(`📸 스토리: ${stats.stories}개`);

    console.log('\n🚄 Railway 전체 앱 시나리오 테스트 데이터 준비 완료!');

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 중 오류 발생:', error);
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