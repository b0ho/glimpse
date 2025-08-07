import { PrismaClient, GroupType, Gender, GroupMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 앱의 하드코딩된 목데이터를 실제 데이터베이스로 마이그레이션하는 스크립트
 * Flyway와 같은 migration 방식으로 초기 데이터를 DB에 구축
 */
async function migrateMockData() {
  console.log('🚀 Mock 데이터 마이그레이션 시작...');

  try {
    // 1. 기존 데이터 정리
    console.log('📦 기존 데이터 정리 중...');
    await prisma.$transaction([
      prisma.chatMessage.deleteMany(),
      prisma.match.deleteMany(),
      prisma.userLike.deleteMany(),
      prisma.communityPost.deleteMany(),
      prisma.groupMember.deleteMany(),
      prisma.group.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // 2. 사용자 데이터 마이그레이션 (mobile/utils/mockData.ts의 dummyUsers 기반)
    console.log('👤 사용자 데이터 마이그레이션...');
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: 'user_1',
          anonymousId: 'anon_001',
          phoneNumber: '+821012345678',
          nickname: '커피러버',
          gender: Gender.MALE,
          isVerified: true,
          credits: 10,
          isPremium: false,
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_2',
          anonymousId: 'anon_002',
          phoneNumber: '+821023456789',
          nickname: '산책마니아',
          gender: Gender.FEMALE,
          isVerified: true,
          credits: 5,
          isPremium: false,
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_3',
          anonymousId: 'anon_003',
          phoneNumber: '+821034567890',
          nickname: '책벌레',
          gender: Gender.MALE,
          isVerified: true,
          credits: 15,
          isPremium: true,
          premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_4',
          anonymousId: 'anon_004',
          phoneNumber: '+821045678901',
          nickname: '영화광',
          gender: Gender.FEMALE,
          isVerified: true,
          credits: 8,
          isPremium: false,
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_5',
          anonymousId: 'anon_005',
          phoneNumber: '+821056789012',
          nickname: '음악애호가',
          gender: Gender.MALE,
          isVerified: true,
          credits: 20,
          isPremium: true,
          premiumUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      }),
      // WhoLikesYouScreen의 더미 데이터 추가
      prisma.user.create({
        data: {
          id: 'user_6',
          anonymousId: 'anon_006',
          phoneNumber: '+821000000001',
          nickname: '익명의 누군가',
          gender: Gender.MALE,
          isVerified: true,
          credits: 10,
          isPremium: false,
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_7',
          anonymousId: 'anon_007',
          phoneNumber: '+821000000002',
          nickname: '미스터리한 그 사람',
          gender: Gender.FEMALE,
          isVerified: false,
          credits: 5,
          isPremium: false,
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_8',
          anonymousId: 'anon_008',
          phoneNumber: '+821000000003',
          nickname: '조용한 관찰자',
          gender: Gender.MALE,
          isVerified: true,
          credits: 15,
          isPremium: true,
          premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      // 개발/테스트용 관리자 계정
      prisma.user.create({
        data: {
          id: 'admin_user',
          anonymousId: 'admin_anon',
          phoneNumber: '+821000000000',
          nickname: '관리자',
          gender: Gender.MALE,
          isVerified: true,
          credits: 999,
          isPremium: true,
          premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    console.log(`✅ ${users.length}명의 사용자 생성`);

    // 3. 그룹 데이터 마이그레이션 (mobile/utils/mockData.ts의 generateDummyGroups 기반)
    console.log('🏢 그룹 데이터 마이그레이션...');
    const groups = await Promise.all([
      // OFFICIAL 그룹들
      prisma.group.create({
        data: {
          id: 'group_1',
          name: '카카오 본사',
          type: GroupType.OFFICIAL,
          description: '카카오 임직원들을 위한 공식 그룹입니다.',
          maxMembers: 100,
          isActive: true,
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-15'),
        },
      }),
      prisma.group.create({
        data: {
          id: 'group_2',
          name: '네이버 판교',
          type: GroupType.OFFICIAL,
          description: '네이버 판교 사옥 직원들의 그룹입니다.',
          maxMembers: 200,
          isActive: true,
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-20'),
        },
      }),
      prisma.group.create({
        data: {
          id: 'group_3',
          name: '연세대학교 미래캠퍼스',
          type: GroupType.OFFICIAL,
          description: '연세대 송도 캠퍼스 학생들의 만남의 장',
          maxMembers: 150,
          isActive: true,
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-10'),
        },
      }),
      // CREATED 그룹들
      prisma.group.create({
        data: {
          id: 'group_4',
          name: '홍대 독서모임',
          type: GroupType.CREATED,
          description: '매주 토요일 홍대에서 만나는 20-30대 독서모임입니다.',
          maxMembers: 20,
          isActive: true,
          creatorId: 'user_3', // 책벌레가 만든 그룹
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-02-01'),
        },
      }),
      prisma.group.create({
        data: {
          id: 'group_5',
          name: '강남 러닝크루',
          type: GroupType.CREATED,
          description: '매주 화/목 저녁 한강에서 함께 뛰는 모임',
          maxMembers: 30,
          isActive: true,
          creatorId: 'user_5', // 음악애호가가 만든 그룹
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-25'),
        },
      }),
      prisma.group.create({
        data: {
          id: 'group_7',
          name: '코딩 스터디 모임',
          type: GroupType.CREATED,
          description: '주말 코딩 스터디와 프로젝트를 함께하는 개발자 모임',
          maxMembers: 25,
          isActive: true,
          creatorId: 'user_1', // 커피러버가 만든 그룹
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-30'),
        },
      }),
      // LOCATION 그룹
      prisma.group.create({
        data: {
          id: 'group_6',
          name: '스타벅스 여의도IFC점',
          type: GroupType.LOCATION,
          description: '여의도 IFC몰 스타벅스에서 만나는 사람들',
          maxMembers: 15,
          isActive: true,
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          location: {
            name: '스타벅스 여의도IFC점',
            latitude: 37.5252,
            longitude: 126.9265,
            address: '서울 영등포구 여의도동 국제금융로 10',
          },
          createdAt: new Date('2024-02-05'),
        },
      }),
      // INSTANCE 그룹
      prisma.group.create({
        data: {
          id: 'group_8',
          name: '요리 클래스 @압구정',
          type: GroupType.INSTANCE,
          description: '2월 한 달간 진행되는 이탈리안 요리 클래스 참여자들',
          maxMembers: 20,
          isActive: true,
          settings: {
            requiresApproval: false,
            allowInvites: true,
            isPrivate: false,
          },
          createdAt: new Date('2024-01-28'),
        },
      }),
    ]);

    console.log(`✅ ${groups.length}개의 그룹 생성`);

    // 4. 그룹 멤버십 생성
    console.log('👥 그룹 멤버십 생성...');
    const memberships = await Promise.all([
      // 카카오 본사 그룹 (group_1)
      prisma.groupMember.create({
        data: { userId: 'user_1', groupId: 'group_1', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_2', groupId: 'group_1', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_6', groupId: 'group_1', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_8', groupId: 'group_1', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'admin_user', groupId: 'group_1', role: GroupMemberRole.ADMIN },
      }),

      // 네이버 판교 그룹 (group_2)
      prisma.groupMember.create({
        data: { userId: 'user_3', groupId: 'group_2', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_4', groupId: 'group_2', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_7', groupId: 'group_2', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'admin_user', groupId: 'group_2', role: GroupMemberRole.ADMIN },
      }),

      // 연세대학교 그룹 (group_3)
      prisma.groupMember.create({
        data: { userId: 'user_5', groupId: 'group_3', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_1', groupId: 'group_3', role: GroupMemberRole.MEMBER },
      }),

      // 홍대 독서모임 (group_4) - 책벌레가 생성자
      prisma.groupMember.create({
        data: { userId: 'user_3', groupId: 'group_4', role: GroupMemberRole.CREATOR },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_4', groupId: 'group_4', role: GroupMemberRole.MEMBER },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_8', groupId: 'group_4', role: GroupMemberRole.MEMBER },
      }),

      // 기타 그룹들에도 적절히 배치
      prisma.groupMember.create({
        data: { userId: 'user_5', groupId: 'group_5', role: GroupMemberRole.CREATOR },
      }),
      prisma.groupMember.create({
        data: { userId: 'user_1', groupId: 'group_7', role: GroupMemberRole.CREATOR },
      }),
    ]);

    console.log(`✅ ${memberships.length}개의 그룹 멤버십 생성`);

    // 5. 좋아요 데이터 생성 (상호 좋아요 포함)
    console.log('💝 좋아요 데이터 생성...');
    const likes = await Promise.all([
      // 상호 좋아요 (매칭으로 이어질 예정)
      prisma.userLike.create({
        data: {
          fromUserId: 'user_1',
          toUserId: 'user_2',
          groupId: 'group_1',
          isSuper: false,
        },
      }),
      prisma.userLike.create({
        data: {
          fromUserId: 'user_2',
          toUserId: 'user_1',
          groupId: 'group_1',
          isSuper: false,
        },
      }),
      // WhoLikesYouScreen의 더미 데이터 반영
      prisma.userLike.create({
        data: {
          fromUserId: 'user_6',
          toUserId: 'user_3', // 책벌레가 받은 좋아요
          groupId: 'group_1',
          isSuper: true,
        },
      }),
      prisma.userLike.create({
        data: {
          fromUserId: 'user_7',
          toUserId: 'user_3',
          groupId: 'group_2',
          isSuper: false,
        },
      }),
      prisma.userLike.create({
        data: {
          fromUserId: 'user_8',
          toUserId: 'user_3',
          groupId: 'group_1',
          isSuper: false,
        },
      }),
      // 추가 좋아요들
      prisma.userLike.create({
        data: {
          fromUserId: 'user_3',
          toUserId: 'user_5',
          groupId: 'group_3',
          isSuper: false,
        },
      }),
      prisma.userLike.create({
        data: {
          fromUserId: 'user_5',
          toUserId: 'user_3',
          groupId: 'group_3',
          isSuper: true,
        },
      }),
    ]);

    console.log(`✅ ${likes.length}개의 좋아요 생성`);

    // 6. 매칭 데이터 생성 (상호 좋아요 기반)
    console.log('💕 매칭 데이터 생성...');
    const matches = await Promise.all([
      prisma.match.create({
        data: {
          id: 'match_1',
          user1Id: 'user_1',
          user2Id: 'user_2',
          groupId: 'group_1',
          isActive: true,
        },
      }),
      prisma.match.create({
        data: {
          id: 'match_2',
          user1Id: 'user_3',
          user2Id: 'user_5',
          groupId: 'group_3',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ ${matches.length}개의 매칭 생성`);

    // 7. 초기 채팅 메시지 생성
    console.log('💬 채팅 메시지 생성...');
    const messages = await Promise.all([
      prisma.chatMessage.create({
        data: {
          matchId: 'match_1',
          senderId: 'user_1',
          content: '안녕하세요! 매칭되어서 반가워요 😊',
          readAt: new Date(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          matchId: 'match_1',
          senderId: 'user_2',
          content: '안녕하세요! 저도 반가워요~ 커피 좋아하신다니 취향이 비슷하네요 ☕',
          readAt: new Date(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          matchId: 'match_2',
          senderId: 'user_3',
          content: '안녕하세요! 책 읽는 걸 좋아하시나봐요?',
          readAt: new Date(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          matchId: 'match_2',
          senderId: 'user_5',
          content: '네! 요즘 음악 관련 책도 많이 읽고 있어요 🎵',
        },
      }),
    ]);

    console.log(`✅ ${messages.length}개의 채팅 메시지 생성`);

    // 8. 콘텐츠 데이터 생성 (CommunityPost 형태로)
    console.log('📝 커뮤니티 포스트 생성...');
    const posts = await Promise.all([
      prisma.communityPost.create({
        data: {
          authorId: 'user_1',
          groupId: 'group_1',
          title: '오늘의 커피',
          content: '오늘 날씨가 정말 좋네요! 산책하기 딱 좋은 날씨에요 ☀️',
          tags: ['일상', '날씨'],
        },
      }),
      prisma.communityPost.create({
        data: {
          authorId: 'user_2',
          groupId: 'group_1',
          title: '새로운 카페 발견',
          content: '점심으로 새로운 카페에 갔는데 커피가 정말 맛있었어요 ☕',
          tags: ['카페', '추천'],
        },
      }),
      prisma.communityPost.create({
        data: {
          authorId: 'user_3',
          groupId: 'group_4',
          title: '이번 주 독서 추천',
          content: '새로 나온 책을 읽고 있는데 너무 재밌어서 밤새 읽을 것 같아요 📚',
          tags: ['독서', '추천'],
        },
      }),
      prisma.communityPost.create({
        data: {
          authorId: 'user_5',
          groupId: 'group_5',
          title: '러닝 후기',
          content: '운동 시작한지 일주일 됐는데 벌써 효과가 보이는 것 같아요 💪',
          tags: ['운동', '러닝'],
        },
      }),
    ]);

    console.log(`✅ ${posts.length}개의 커뮤니티 포스트 생성`);

    console.log(`
🎉 Mock 데이터 마이그레이션 완료!

📊 생성된 데이터 요약:
- 👤 사용자: ${users.length}명
- 🏢 그룹: ${groups.length}개
- 👥 멤버십: ${memberships.length}개
- 💝 좋아요: ${likes.length}개
- 💕 매칭: ${matches.length}개
- 💬 메시지: ${messages.length}개
- 📝 포스트: ${posts.length}개

이제 앱에서 API 호출을 활성화하여 실제 DB 데이터를 확인할 수 있습니다.
    `);

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateMockData()
    .then(() => {
      console.log('✅ 마이그레이션 성공');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

export { migrateMockData };