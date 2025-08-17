import { PrismaClient, GroupType, Gender, GroupMemberRole, GroupMemberStatus, CompanyType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 한국 이름 생성용 데이터
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
const firstNamesMale = ['민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '지후', '준서', '준우', '건우', '도현', '현우', '지훈'];
const firstNamesFemale = ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '지유', '지민', '채원', '수빈', '지아', '수아', '다은', '예은'];
const nicknames = ['커피러버', '헬스매니아', '음악감상가', '요리왕', '영화광', '등산러', '북벌레', '게이머', '여행가', '사진작가', '댄서', '러너', '골퍼', '스키어', '서퍼'];
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
];

// 회사 및 대학 목록
const companies = [
  { name: '삼성전자', domain: 'samsung.com', type: GroupType.OFFICIAL },
  { name: 'LG전자', domain: 'lge.com', type: GroupType.OFFICIAL },
  { name: '현대자동차', domain: 'hyundai.com', type: GroupType.OFFICIAL },
  { name: 'SK텔레콤', domain: 'sktelecom.com', type: GroupType.OFFICIAL },
  { name: '네이버', domain: 'navercorp.com', type: GroupType.OFFICIAL },
  { name: '카카오', domain: 'kakaocorp.com', type: GroupType.OFFICIAL },
  { name: '쿠팡', domain: 'coupang.com', type: GroupType.OFFICIAL },
  { name: '배달의민족', domain: 'woowahan.com', type: GroupType.OFFICIAL },
  { name: '토스', domain: 'toss.im', type: GroupType.OFFICIAL },
  { name: '당근마켓', domain: 'daangn.com', type: GroupType.OFFICIAL },
];

const universities = [
  { name: '서울대학교', domain: 'snu.ac.kr', type: GroupType.OFFICIAL },
  { name: '연세대학교', domain: 'yonsei.ac.kr', type: GroupType.OFFICIAL },
  { name: '고려대학교', domain: 'korea.ac.kr', type: GroupType.OFFICIAL },
  { name: '서강대학교', domain: 'sogang.ac.kr', type: GroupType.OFFICIAL },
  { name: '성균관대학교', domain: 'skku.edu', type: GroupType.OFFICIAL },
  { name: '한양대학교', domain: 'hanyang.ac.kr', type: GroupType.OFFICIAL },
  { name: '이화여자대학교', domain: 'ewha.ac.kr', type: GroupType.OFFICIAL },
  { name: '중앙대학교', domain: 'cau.ac.kr', type: GroupType.OFFICIAL },
  { name: '경희대학교', domain: 'khu.ac.kr', type: GroupType.OFFICIAL },
  { name: '한국외국어대학교', domain: 'hufs.ac.kr', type: GroupType.OFFICIAL },
];

// 취미 그룹
const hobbyGroups = [
  { name: '독서 모임 - 책갈피', description: '매월 한 권의 책을 함께 읽고 토론하는 모임입니다' },
  { name: '러닝 크루 - 한강러너스', description: '매주 화요일, 목요일 저녁 7시 한강에서 함께 달려요!' },
  { name: '요리 클럽 - 쿡쿡', description: '맛있는 요리를 함께 만들고 나누는 모임' },
  { name: '영화 동호회 - 씨네필', description: '주말마다 영화 보고 이야기 나누는 모임' },
  { name: '등산 모임 - 산타클럽', description: '주말 아침 함께 산을 오르며 건강을 챙겨요' },
  { name: '사진 동호회 - 포토그래퍼스', description: '출사 가고 사진 찍는 것을 좋아하는 사람들의 모임' },
  { name: '보드게임 카페 모임', description: '매주 금요일 저녁 보드게임을 즐기는 모임' },
  { name: '와인 테이스팅 클럽', description: '와인을 좋아하는 사람들의 모임' },
  { name: '댄스 동호회 - 무브먼트', description: 'K-POP 댄스를 배우고 즐기는 모임' },
  { name: '명상과 요가', description: '매일 아침 6시 명상과 요가로 하루를 시작해요' },
];

// 생성할 초대코드 생성 함수
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function main() {
  console.log('🌱 확장 시드 데이터 생성 시작...');

  try {
    // 기존 데이터 삭제
    await prisma.groupMember.deleteMany();
    await prisma.groupLike.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    console.log('🗑️ 기존 데이터 삭제 완료');

    // 회사 데이터 생성
    const companiesData = await Promise.all(
      companies.map(company =>
        prisma.company.create({
          data: {
            name: company.name,
            domain: company.domain,
            logo: `https://logo.clearbit.com/${company.domain}`,
            isVerified: true,
            type: CompanyType.COMPANY,
          },
        })
      )
    );

    console.log(`✅ ${companiesData.length}개의 회사 생성 완료`);

    // 다양한 사용자 생성 (100명)
    const users = [];
    for (let i = 0; i < 100; i++) {
      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const firstName = gender === Gender.MALE 
        ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)]
        : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
      const nickname = nicknames[Math.floor(Math.random() * nicknames.length)] + (i + 1);
      const bio = bios[Math.floor(Math.random() * bios.length)];
      const age = 20 + Math.floor(Math.random() * 20); // 20-39세
      const phoneNumber = `010${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      
      const user = await prisma.user.create({
        data: {
          phoneNumber,
          nickname,
          age,
          gender,
          bio,
          isVerified: Math.random() > 0.3, // 70% 인증
          credits: Math.floor(Math.random() * 20),
          isPremium: Math.random() > 0.7, // 30% 프리미엄
          premiumUntil: Math.random() > 0.7 ? new Date('2025-12-31') : null,
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
          location: JSON.stringify({
            lat: 37.5665 + (Math.random() - 0.5) * 0.1,
            lng: 126.9780 + (Math.random() - 0.5) * 0.1,
          }),
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 7일 내 활동
        },
      });
      users.push(user);
    }

    console.log(`✅ ${users.length}명의 사용자 생성 완료`);

    // 회사 및 대학 그룹 생성
    const officialGroups = [];
    
    // 회사 그룹
    for (const [index, company] of companiesData.entries()) {
      const group = await prisma.group.create({
        data: {
          name: company.name,
          description: `${company.name} 임직원들을 위한 공식 그룹입니다.`,
          type: GroupType.OFFICIAL,
          isActive: true,
          maxMembers: 10000,
          companyId: company.id,
          settings: {},
          creatorId: users[index % users.length].id,
        },
      });
      officialGroups.push(group);
    }

    // 대학 그룹
    for (const [index, univ] of universities.entries()) {
      const group = await prisma.group.create({
        data: {
          name: univ.name,
          description: `${univ.name} 재학생 및 졸업생을 위한 공식 그룹입니다.`,
          type: GroupType.OFFICIAL,
          isActive: true,
          maxMembers: 5000,
          settings: {},
          creatorId: users[(index + 10) % users.length].id,
        },
      });
      officialGroups.push(group);
    }

    console.log(`✅ ${officialGroups.length}개의 공식 그룹 생성 완료`);

    // 취미 그룹 생성
    const createdGroups = [];
    for (const [index, hobby] of hobbyGroups.entries()) {
      const group = await prisma.group.create({
        data: {
          name: hobby.name,
          description: hobby.description,
          type: GroupType.CREATED,
          isActive: true,
          maxMembers: 100,
          settings: {},
          creatorId: users[(index + 20) % users.length].id,
        },
      });
      createdGroups.push(group);
    }

    console.log(`✅ ${createdGroups.length}개의 취미 그룹 생성 완료`);

    // 위치 기반 그룹 생성
    const locations = [
      { name: '강남역 스타벅스', lat: 37.498095, lng: 127.027610, address: '서울 강남구 강남대로 390' },
      { name: '코엑스 몰', lat: 37.512572, lng: 127.059074, address: '서울 강남구 영동대로 513' },
      { name: '선릉역 주변', lat: 37.504503, lng: 127.048861, address: '서울 강남구 테헤란로 340' },
      { name: '역삼역 먹자골목', lat: 37.500622, lng: 127.036456, address: '서울 강남구 역삼동' },
      { name: '가로수길', lat: 37.520357, lng: 127.023102, address: '서울 강남구 신사동' },
    ];

    const locationGroups = [];
    for (const [index, loc] of locations.entries()) {
      const group = await prisma.group.create({
        data: {
          name: loc.name,
          description: `${loc.name}에서 만나는 사람들`,
          type: GroupType.LOCATION,
          isActive: true,
          maxMembers: 50,
          settings: {},
          location: {
            latitude: loc.lat,
            longitude: loc.lng,
            address: loc.address,
            radius: 0.5,
          },
          creatorId: users[(index + 30) % users.length].id,
        },
      });
      locationGroups.push(group);
    }

    console.log(`✅ ${locationGroups.length}개의 위치 기반 그룹 생성 완료`);

    // 그룹 멤버십 생성
    const allGroups = [...officialGroups, ...createdGroups, ...locationGroups];
    let membershipCount = 0;

    for (const group of allGroups) {
      // 각 그룹에 랜덤하게 10-50명의 멤버 추가
      const memberCount = 10 + Math.floor(Math.random() * 40);
      const selectedUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, memberCount);
      
      for (const [index, user] of selectedUsers.entries()) {
        // 그룹 생성자는 이미 CREATOR 역할로 추가
        if (user.id === group.creatorId) {
          await prisma.groupMember.create({
            data: {
              userId: user.id,
              groupId: group.id,
              role: GroupMemberRole.CREATOR,
              status: GroupMemberStatus.ACTIVE,
              joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 최근 30일 내 참여
            },
          });
        } else {
          // 일반 멤버 또는 관리자
          const role = index < 2 ? GroupMemberRole.ADMIN : GroupMemberRole.MEMBER;
          await prisma.groupMember.create({
            data: {
              userId: user.id,
              groupId: group.id,
              role,
              status: GroupMemberStatus.ACTIVE,
              joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
        membershipCount++;
      }
    }

    console.log(`✅ ${membershipCount}개의 그룹 멤버십 생성 완료`);

    // 그룹 좋아요 생성
    let likeCount = 0;
    for (const group of allGroups) {
      // 각 그룹에 랜덤하게 5-20개의 좋아요 추가
      const likeUserCount = 5 + Math.floor(Math.random() * 15);
      const selectedUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, likeUserCount);
      
      for (const user of selectedUsers) {
        await prisma.groupLike.create({
          data: {
            userId: user.id,
            groupId: group.id,
          },
        });
        likeCount++;
      }
    }

    console.log(`✅ ${likeCount}개의 그룹 좋아요 생성 완료`);

    console.log('🎉 확장 시드 데이터 생성 완료!');
    
    // 통계 출력
    const stats = {
      users: await prisma.user.count(),
      groups: await prisma.group.count(),
      memberships: await prisma.groupMember.count(),
      likes: await prisma.groupLike.count(),
    };

    console.log('\n📊 데이터베이스 통계:');
    console.log(`- 사용자: ${stats.users}명`);
    console.log(`- 그룹: ${stats.groups}개`);
    console.log(`- 멤버십: ${stats.memberships}개`);
    console.log(`- 좋아요: ${stats.likes}개`);

  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', error);
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