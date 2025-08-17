import { PrismaClient, GroupType, Gender } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 기본 사용자 생성
  const users = await Promise.all([
    prisma.user.create({
      data: {
        phoneNumber: '01012345678',
        nickname: '테스트유저1',
        age: 28,
        gender: Gender.MALE,
        bio: '안녕하세요! 개발자입니다.',
        isVerified: true,
        credits: 10,
        isPremium: false,
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '01023456789',
        nickname: '테스트유저2',
        age: 25,
        gender: Gender.FEMALE,
        bio: '디자이너입니다. 잘 부탁드려요!',
        isVerified: true,
        credits: 5,
        isPremium: true,
        premiumUntil: new Date('2025-12-31'),
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '01034567890',
        nickname: '테스트유저3',
        age: 30,
        gender: Gender.MALE,
        bio: '마케팅 담당자입니다.',
        isVerified: false,
        credits: 3,
        isPremium: false,
      },
    }),
  ]);

  console.log(`✅ ${users.length}명의 사용자 생성 완료`);

  // 위치 기반 그룹 생성 (서울 강남역 기준)
  const baseLatitude = 37.498095;
  const baseLongitude = 127.027610;

  const locationGroups = await Promise.all([
    prisma.group.create({
      data: {
        name: '강남역 스타벅스',
        description: '강남역 스타벅스에서 커피 한잔 ☕',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[0].id,
        settings: {},
        location: {
          latitude: baseLatitude,
          longitude: baseLongitude,
          address: '서울 강남구 강남대로 390',
          radius: 0.5,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '코엑스 몰',
        description: '코엑스에서 쇼핑하며 만나요 🛍️',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[1].id,
        settings: {},
        location: {
          latitude: baseLatitude + 0.003,
          longitude: baseLongitude + 0.003,
          address: '서울 강남구 영동대로 513',
          radius: 1,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '선릉역 주변',
        description: '선릉역 근처 직장인 모임',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[2].id,
        settings: {},
        location: {
          latitude: baseLatitude + 0.008,
          longitude: baseLongitude - 0.008,
          address: '서울 강남구 테헤란로 340',
          radius: 0.8,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '역삼역 먹자골목',
        description: '맛집 탐방 함께해요 🍜',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[0].id,
        settings: {},
        location: {
          latitude: baseLatitude - 0.005,
          longitude: baseLongitude + 0.002,
          address: '서울 강남구 역삼동',
          radius: 0.6,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '봉은사',
        description: '봉은사에서 힐링타임 🏛️',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[1].id,
        settings: {},
        location: {
          latitude: baseLatitude + 0.015,
          longitude: baseLongitude + 0.015,
          address: '서울 강남구 봉은사로 531',
          radius: 1.5,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '한강공원 뚝섬지구',
        description: '한강에서 피크닉 🌳',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[2].id,
        settings: {},
        location: {
          latitude: baseLatitude + 0.04,
          longitude: baseLongitude - 0.02,
          address: '서울 광진구 강변북로 139',
          radius: 2,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '가로수길',
        description: '가로수길 쇼핑 & 카페 투어',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[0].id,
        settings: {},
        location: {
          latitude: baseLatitude - 0.01,
          longitude: baseLongitude - 0.005,
          address: '서울 강남구 신사동 가로수길',
          radius: 1,
        },
      },
    }),
    prisma.group.create({
      data: {
        name: '압구정 로데오',
        description: '압구정 로데오거리 탐방',
        type: GroupType.LOCATION,
        isActive: true,
        creatorId: users[1].id,
        settings: {},
        location: {
          latitude: baseLatitude + 0.02,
          longitude: baseLongitude - 0.01,
          address: '서울 강남구 압구정로',
          radius: 1.2,
        },
      },
    }),
  ]);

  console.log(`✅ ${locationGroups.length}개의 위치 기반 그룹 생성 완료`);

  // 일반 그룹 생성
  const normalGroups = await Promise.all([
    prisma.group.create({
      data: {
        name: '삼성전자',
        description: '삼성전자 임직원 그룹',
        type: GroupType.OFFICIAL,
        isActive: true,
        maxMembers: 10000,
        settings: {},
      },
    }),
    prisma.group.create({
      data: {
        name: '서울대학교',
        description: '서울대학교 학생 및 졸업생 그룹',
        type: GroupType.OFFICIAL,
        isActive: true,
        maxMembers: 5000,
        settings: {},
      },
    }),
    prisma.group.create({
      data: {
        name: '주말 러닝 크루',
        description: '매주 토요일 아침 7시 한강 러닝',
        type: GroupType.CREATED,
        isActive: true,
        creatorId: users[0].id,
        maxMembers: 50,
        settings: {},
      },
    }),
    prisma.group.create({
      data: {
        name: '독서 모임',
        description: '매월 한 권의 책을 읽고 토론해요',
        type: GroupType.CREATED,
        isActive: true,
        creatorId: users[1].id,
        maxMembers: 20,
        settings: {},
      },
    }),
  ]);

  console.log(`✅ ${normalGroups.length}개의 일반 그룹 생성 완료`);

  // 그룹 멤버십 생성
  for (const user of users) {
    // 각 사용자를 몇 개의 그룹에 참여시킴
    const groupsToJoin = [...locationGroups.slice(0, 3), ...normalGroups.slice(0, 2)];
    
    for (const group of groupsToJoin) {
      if (group.creatorId !== user.id) {
        await prisma.groupMember.create({
          data: {
            userId: user.id,
            groupId: group.id,
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        }).catch(() => {
          // 이미 존재하는 경우 무시
        });
      }
    }
  }

  console.log('✅ 그룹 멤버십 생성 완료');

  // 회사 도메인 추가
  const companyDomains = await Promise.all([
    prisma.companyDomain.create({
      data: {
        domain: 'samsung.com',
        companyName: 'Samsung Electronics',
        companyNameKr: '삼성전자',
        isVerified: true,
        industry: 'Technology',
      },
    }),
    prisma.companyDomain.create({
      data: {
        domain: 'lg.com',
        companyName: 'LG Corporation',
        companyNameKr: 'LG',
        isVerified: true,
        industry: 'Electronics',
      },
    }),
    prisma.companyDomain.create({
      data: {
        domain: 'kakao.com',
        companyName: 'Kakao',
        companyNameKr: '카카오',
        isVerified: true,
        industry: 'Internet',
      },
    }),
    prisma.companyDomain.create({
      data: {
        domain: 'naver.com',
        companyName: 'Naver',
        companyNameKr: '네이버',
        isVerified: true,
        industry: 'Internet',
      },
    }),
  ]);

  console.log(`✅ ${companyDomains.length}개의 회사 도메인 생성 완료`);

  console.log('🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });