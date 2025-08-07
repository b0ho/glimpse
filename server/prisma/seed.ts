import { PrismaClient, GroupType, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data (optional, remove if you want to keep existing data)
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.chatRoom.deleteMany(),
    prisma.matching.deleteMany(),
    prisma.like.deleteMany(),
    prisma.content.deleteMany(),
    prisma.groupMembership.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user_1',
        phoneNumber: '+821012345678',
        nickname: '커피러버',
        realName: '김민수',
        gender: Gender.MALE,
        isVerified: true,
        credits: 10,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_2',
        phoneNumber: '+821023456789',
        nickname: '산책마니아',
        realName: '이소영',
        gender: Gender.FEMALE,
        isVerified: true,
        credits: 5,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_3',
        phoneNumber: '+821034567890',
        nickname: '책벌레',
        realName: '박준호',
        gender: Gender.MALE,
        isVerified: true,
        credits: 15,
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_4',
        phoneNumber: '+821045678901',
        nickname: '영화광',
        realName: '최지은',
        gender: Gender.FEMALE,
        isVerified: true,
        credits: 8,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_5',
        phoneNumber: '+821056789012',
        nickname: '음악애호가',
        realName: '정태현',
        gender: Gender.MALE,
        isVerified: true,
        credits: 20,
        isPremium: true,
        premiumUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_6',
        phoneNumber: '+821067890123',
        nickname: '요리사',
        realName: '김요리',
        gender: Gender.FEMALE,
        isVerified: true,
        credits: 12,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_7',
        phoneNumber: '+821078901234',
        nickname: '여행자',
        realName: '이여행',
        gender: Gender.MALE,
        isVerified: true,
        credits: 7,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user_8',
        phoneNumber: '+821089012345',
        nickname: '영화러버',
        realName: '박영화',
        gender: Gender.FEMALE,
        isVerified: true,
        credits: 10,
        isPremium: false,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    }),
    // Add admin user
    prisma.user.create({
      data: {
        id: 'admin_user',
        phoneNumber: '+821000000000',
        nickname: '관리자',
        realName: '관리자',
        gender: Gender.MALE,
        isVerified: true,
        credits: 999,
        isPremium: true,
        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create groups
  const groups = await Promise.all([
    prisma.group.create({
      data: {
        id: 'group_1',
        name: '카카오 본사',
        type: GroupType.OFFICIAL,
        description: '카카오 임직원들을 위한 공식 그룹입니다.',
        minimumMembers: 10,
        isMatchingActive: true,
        isActive: true,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_2',
        name: '네이버 판교',
        type: GroupType.OFFICIAL,
        description: '네이버 판교 사옥 직원들의 그룹입니다.',
        minimumMembers: 10,
        isMatchingActive: true,
        isActive: true,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_3',
        name: '연세대학교 미래캠퍼스',
        type: GroupType.OFFICIAL,
        description: '연세대 송도 캠퍼스 학생들의 만남의 장',
        minimumMembers: 20,
        isMatchingActive: true,
        isActive: true,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_4',
        name: '홍대 독서모임',
        type: GroupType.CREATED,
        description: '매주 토요일 홍대에서 만나는 20-30대 독서모임입니다.',
        minimumMembers: 8,
        isMatchingActive: true,
        isActive: true,
        creatorId: 'user_1',
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_5',
        name: '강남 러닝크루',
        type: GroupType.CREATED,
        description: '매주 화/목 저녁 한강에서 함께 뛰는 모임',
        minimumMembers: 6,
        isMatchingActive: true,
        isActive: true,
        creatorId: 'user_2',
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_6',
        name: '스타벅스 여의도IFC점',
        type: GroupType.LOCATION,
        description: '여의도 IFC몰 스타벅스에서 만나는 사람들',
        minimumMembers: 6,
        isMatchingActive: true,
        isActive: true,
        location: {
          name: '스타벅스 여의도IFC점',
          latitude: 37.5252,
          longitude: 126.9265,
          address: '서울 영등포구 여의도동 국제금융로 10',
        },
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_7',
        name: '코딩 스터디 모임',
        type: GroupType.CREATED,
        description: '주말 코딩 스터디와 프로젝트를 함께하는 개발자 모임',
        minimumMembers: 8,
        isMatchingActive: true,
        isActive: true,
        creatorId: 'user_5',
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
    prisma.group.create({
      data: {
        id: 'group_8',
        name: '요리 클래스 @압구정',
        type: GroupType.INSTANCE,
        description: '2월 한 달간 진행되는 이탈리안 요리 클래스 참여자들',
        minimumMembers: 16,
        isMatchingActive: true,
        isActive: true,
        expiresAt: new Date('2025-03-01'),
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
        },
      },
    }),
  ]);

  console.log(`Created ${groups.length} groups`);

  // Create group memberships
  const memberships = await Promise.all([
    // Group 1 - 카카오 본사
    prisma.groupMembership.create({
      data: { userId: 'user_1', groupId: 'group_1', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_2', groupId: 'group_1', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_3', groupId: 'group_1', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'admin_user', groupId: 'group_1', role: 'ADMIN' },
    }),
    // Group 2 - 네이버 판교
    prisma.groupMembership.create({
      data: { userId: 'user_4', groupId: 'group_2', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_5', groupId: 'group_2', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'admin_user', groupId: 'group_2', role: 'ADMIN' },
    }),
    // Group 3 - 연세대학교
    prisma.groupMembership.create({
      data: { userId: 'user_6', groupId: 'group_3', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_7', groupId: 'group_3', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_8', groupId: 'group_3', role: 'MEMBER' },
    }),
    // Group 4 - 홍대 독서모임 (user_1이 creator)
    prisma.groupMembership.create({
      data: { userId: 'user_1', groupId: 'group_4', role: 'OWNER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_3', groupId: 'group_4', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_4', groupId: 'group_4', role: 'MEMBER' },
    }),
    // Group 5 - 강남 러닝크루 (user_2가 creator)
    prisma.groupMembership.create({
      data: { userId: 'user_2', groupId: 'group_5', role: 'OWNER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_5', groupId: 'group_5', role: 'MEMBER' },
    }),
    prisma.groupMembership.create({
      data: { userId: 'user_6', groupId: 'group_5', role: 'MEMBER' },
    }),
  ]);

  console.log(`Created ${memberships.length} group memberships`);

  // Create contents
  const textSamples = [
    '오늘 날씨가 정말 좋네요! 산책하기 딱 좋은 날씨에요 ☀️',
    '점심으로 새로운 카페에 갔는데 커피가 정말 맛있었어요 ☕',
    '주말에 영화 보러 갈 예정인데 추천해주실 만한 영화 있나요?',
    '운동 시작한지 일주일 됐는데 벌써 효과가 보이는 것 같아요 💪',
    '새로 나온 책을 읽고 있는데 너무 재밌어서 밤새 읽을 것 같아요 📚',
    '오늘 요리에 도전해봤는데 생각보다 잘 나온 것 같아요!',
    '퇴근길에 찍은 일몰 사진이에요. 오늘도 수고했어요 🌅',
  ];

  const contents = [];
  for (let i = 0; i < 15; i++) {
    const userIndex = (i % 7) + 1;
    const content = await prisma.content.create({
      data: {
        id: `content_${i + 1}`,
        userId: `user_${userIndex}`,
        type: i % 4 === 0 ? 'IMAGE' : 'TEXT',
        text: textSamples[i % textSamples.length],
        imageUrls: i % 4 === 0 ? [`https://picsum.photos/400/300?random=${i}`] : [],
        isPublic: true,
        likeCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 50),
      },
    });
    contents.push(content);
  }

  console.log(`Created ${contents.length} contents`);

  // Create some likes
  const likes = await Promise.all([
    prisma.like.create({
      data: {
        fromUserId: 'user_1',
        toUserId: 'user_2',
        groupId: 'group_1',
        isSuper: false,
      },
    }),
    prisma.like.create({
      data: {
        fromUserId: 'user_2',
        toUserId: 'user_1',
        groupId: 'group_1',
        isSuper: false,
      },
    }),
    prisma.like.create({
      data: {
        fromUserId: 'user_3',
        toUserId: 'admin_user',
        groupId: 'group_1',
        isSuper: true,
      },
    }),
    prisma.like.create({
      data: {
        fromUserId: 'user_4',
        toUserId: 'user_5',
        groupId: 'group_2',
        isSuper: false,
      },
    }),
    prisma.like.create({
      data: {
        fromUserId: 'user_5',
        toUserId: 'user_4',
        groupId: 'group_2',
        isSuper: false,
      },
    }),
  ]);

  console.log(`Created ${likes.length} likes`);

  // Create matches (from mutual likes)
  const matches = await Promise.all([
    prisma.matching.create({
      data: {
        id: 'match_1',
        user1Id: 'user_1',
        user2Id: 'user_2',
        groupId: 'group_1',
        isActive: true,
      },
    }),
    prisma.matching.create({
      data: {
        id: 'match_2',
        user1Id: 'user_4',
        user2Id: 'user_5',
        groupId: 'group_2',
        isActive: true,
      },
    }),
    prisma.matching.create({
      data: {
        id: 'match_3',
        user1Id: 'admin_user',
        user2Id: 'user_3',
        groupId: 'group_1',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${matches.length} matches`);

  // Create chat rooms for matches
  const chatRooms = await Promise.all([
    prisma.chatRoom.create({
      data: {
        id: 'chat_1',
        matchingId: 'match_1',
        isActive: true,
      },
    }),
    prisma.chatRoom.create({
      data: {
        id: 'chat_2',
        matchingId: 'match_2',
        isActive: true,
      },
    }),
    prisma.chatRoom.create({
      data: {
        id: 'chat_3',
        matchingId: 'match_3',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${chatRooms.length} chat rooms`);

  // Create some initial messages
  const messages = await Promise.all([
    prisma.chatMessage.create({
      data: {
        chatRoomId: 'chat_1',
        senderId: 'user_1',
        content: '안녕하세요! 매칭되어서 반가워요 😊',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        chatRoomId: 'chat_1',
        senderId: 'user_2',
        content: '안녕하세요! 저도 반가워요~ 커피 좋아하신다니 취향이 비슷하네요 ☕',
        isRead: true,
      },
    }),
    prisma.chatMessage.create({
      data: {
        chatRoomId: 'chat_2',
        senderId: 'user_4',
        content: '안녕하세요! 영화 좋아하신다고 들었어요',
        isRead: false,
      },
    }),
  ]);

  console.log(`Created ${messages.length} chat messages`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });