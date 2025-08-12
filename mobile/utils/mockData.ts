/**
 * 개발 및 테스트용 더미 데이터 생성 유틸리티
 */

import { Content, Group, GroupType, Match, User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자가 생성한 그룹을 저장할 키
const CREATED_GROUPS_KEY = 'user_created_groups';
// 사용자가 생성한 콘텐츠를 저장할 키
const CREATED_CONTENTS_KEY = 'user_created_contents';

/**
 * 홈 피드용 더미 콘텐츠 생성
 * @param count - 생성할 콘텐츠 개수 (기본값: 15)
 * @returns 더미 콘텐츠 배열
 */
export const generateDummyContent = (count: number = 15): Content[] => {
  const contents: Content[] = [];
  const nicknames = ['커피러버', '산책마니아', '책벌레', '영화광', '음악애호가', '요리사', '여행자'];
  const textSamples = [
    '오늘 날씨가 정말 좋네요! 산책하기 딱 좋은 날씨에요 ☀️',
    '점심으로 새로운 카페에 갔는데 커피가 정말 맛있었어요 ☕',
    '주말에 영화 보러 갈 예정인데 추천해주실 만한 영화 있나요?',
    '운동 시작한지 일주일 됐는데 벌써 효과가 보이는 것 같아요 💪',
    '새로 나온 책을 읽고 있는데 너무 재밌어서 밤새 읽을 것 같아요 📚',
    '오늘 요리에 도전해봤는데 생각보다 잘 나온 것 같아요!',
    '퇴근길에 찍은 일몰 사진이에요. 오늘도 수고했어요 🌅',
  ];

  for (let i = 1; i <= count; i++) {
    contents.push({
      id: `content_${i}`,
      userId: `user_${(i % 7) + 1}`,
      authorId: `user_${(i % 7) + 1}`,
      authorNickname: nicknames[i % nicknames.length],
      type: i % 4 === 0 ? 'image' : 'text',
      text: textSamples[i % textSamples.length],
      imageUrls: i % 4 === 0 ? [`https://picsum.photos/400/300?random=${i}`] : undefined,
      groupId: `group_${(i % 8) + 1}`, // 다양한 그룹에 속하도록
      likes: Math.floor(Math.random() * 20),
      likeCount: Math.floor(Math.random() * 20),
      views: Math.floor(Math.random() * 50),
      isPublic: true,
      isLikedByUser: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 일주일 랜덤
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return contents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * 그룹 탐색용 더미 그룹 데이터 생성
 * @returns 더미 그룹 배열
 */
export const generateDummyGroups = (): Group[] => {
  const groups: Group[] = [
    {
      id: 'group_1',
      name: '카카오 본사',
      type: GroupType.OFFICIAL,
      description: '카카오 임직원들을 위한 공식 그룹입니다.',
      memberCount: 45,
      maleCount: 23,
      femaleCount: 22,
      minimumMembers: 10,
      isMatchingActive: true,
      isActive: true,
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'group_2',
      name: '네이버 판교',
      type: GroupType.OFFICIAL,
      description: '네이버 판교 사옥 직원들의 그룹입니다.',
      memberCount: 67,
      maleCount: 35,
      femaleCount: 32,
      minimumMembers: 10,
      isMatchingActive: true,
      isActive: true,
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'group_3',
      name: '연세대학교 미래캠퍼스',
      type: GroupType.OFFICIAL,
      description: '연세대 송도 캠퍼스 학생들의 만남의 장',
      memberCount: 89,
      maleCount: 44,
      femaleCount: 45,
      minimumMembers: 20,
      isMatchingActive: true,
      isActive: true,
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'group_4',
      name: '홍대 독서모임',
      type: GroupType.CREATED,
      description: '매주 토요일 홍대에서 만나는 20-30대 독서모임입니다.',
      memberCount: 12,
      maleCount: 5,
      femaleCount: 7,
      minimumMembers: 8,
      isMatchingActive: true,
      isActive: true,
      creatorId: 'user_123',
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
    {
      id: 'group_5',
      name: '강남 러닝크루',
      type: GroupType.CREATED,
      description: '매주 화/목 저녁 한강에서 함께 뛰는 모임',
      memberCount: 18,
      maleCount: 8,
      femaleCount: 10,
      minimumMembers: 6,
      isMatchingActive: true,
      isActive: true,
      creatorId: 'user_456',
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25'),
    },
    {
      id: 'group_6',
      name: '스타벅스 여의도IFC점',
      type: GroupType.LOCATION,
      description: '여의도 IFC몰 스타벅스에서 만나는 사람들',
      memberCount: 8,
      maleCount: 3,
      femaleCount: 5,
      minimumMembers: 6,
      isMatchingActive: true,
      location: {
        name: '스타벅스 여의도IFC점',
        latitude: 37.5252,
        longitude: 126.9265,
        address: '서울 영등포구 여의도동 국제꺈융로 10',
      },
      isActive: true,
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05'),
    },
    {
      id: 'group_7',
      name: '코딩 스터디 모임',
      type: GroupType.CREATED,
      description: '주말 코딩 스터디와 프로젝트를 함께하는 개발자 모임',
      memberCount: 15,
      maleCount: 10,
      femaleCount: 5,
      minimumMembers: 8,
      isMatchingActive: true,
      isActive: true,
      creatorId: 'user_789',
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30'),
    },
    {
      id: 'group_8',
      name: '요리 클래스 @압구정',
      type: GroupType.INSTANCE,
      description: '2월 한 달간 진행되는 이탈리안 요리 클래스 참여자들',
      memberCount: 20,
      maleCount: 8,
      femaleCount: 12,
      minimumMembers: 16,
      isMatchingActive: true,
      isActive: true,
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false,
      },
      expiresAt: new Date('2024-03-01'),
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-01-28'),
    },
  ];

  return groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * 매칭 화면용 더미 매칭 데이터 생성
 * @returns 더미 매칭 배열
 */
export const generateDummyMatches = (): Match[] => {
  return [
    {
      id: 'match_1',
      user1Id: 'current_user',
      user2Id: 'user_2',
      groupId: 'group_1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastMessageAt: null,
      isActive: true,
      chatChannelId: 'chat_1',
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'match_2',
      user1Id: 'current_user',
      user2Id: 'user_5',
      groupId: 'group_2',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
      matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastMessageAt: null,
      isActive: true,
      chatChannelId: 'chat_2',
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'match_3',
      user1Id: 'current_user',
      user2Id: 'user_8',
      groupId: 'group_1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
      matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lastMessageAt: null,
      isActive: true,
      chatChannelId: 'chat_3',
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
};

/**
 * 익명성 시스템 테스트용 더미 사용자 데이터
 */
export const dummyUsers: User[] = [
  {
    id: 'user_1',
    anonymousId: 'anon_001',
    phoneNumber: '+821012345678',
    nickname: '커피러버',
    realName: '김민수',
    gender: 'MALE',
    isVerified: true,
    credits: 10,
    isPremium: false,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_2',
    anonymousId: 'anon_002', 
    phoneNumber: '+821023456789',
    nickname: '산책마니아',
    realName: '이소영',
    gender: 'FEMALE',
    isVerified: true,
    credits: 5,
    isPremium: false,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_3',
    anonymousId: 'anon_003',
    phoneNumber: '+821034567890',
    nickname: '책벌레',
    realName: '박준호',
    gender: 'MALE',
    isVerified: true,
    credits: 15,
    isPremium: true,
    premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_4',
    anonymousId: 'anon_004',
    phoneNumber: '+821045678901',
    nickname: '영화광',
    realName: '최지은',
    gender: 'FEMALE',
    isVerified: true,
    credits: 8,
    isPremium: false,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_5',
    anonymousId: 'anon_005',
    phoneNumber: '+821056789012',
    nickname: '음악애호가',
    realName: '정태현',
    gender: 'MALE',
    isVerified: true,
    credits: 20,
    isPremium: true,
    premiumUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * 매칭된 사용자 닉네임 더미 데이터 (하위 호환성)
 */
export const dummyUserNicknames: { [key: string]: string } = {
  user_2: '커피매니아',
  user_5: '독서광',
  user_8: '영화러버',
};

/**
 * 사용자가 생성한 그룹을 AsyncStorage에 저장
 * @param group - 저장할 그룹 정보
 */
export const saveCreatedGroup = async (group: Group): Promise<void> => {
  try {
    console.log('[MockData] 생성된 그룹 저장 시작:', group.id);
    const existingGroups = await getCreatedGroups();
    const updatedGroups = [...existingGroups, group];
    await AsyncStorage.setItem(CREATED_GROUPS_KEY, JSON.stringify(updatedGroups));
    console.log('[MockData] 생성된 그룹 저장 완료. 총', updatedGroups.length, '개');
  } catch (error) {
    console.error('[MockData] 생성된 그룹 저장 실패:', error);
  }
};

/**
 * 사용자가 생성한 그룹 목록을 AsyncStorage에서 불러오기
 * @returns 저장된 그룹 배열
 */
export const getCreatedGroups = async (): Promise<Group[]> => {
  try {
    const storedGroups = await AsyncStorage.getItem(CREATED_GROUPS_KEY);
    if (storedGroups) {
      const parsedGroups = JSON.parse(storedGroups);
      console.log('[MockData] 저장된 그룹 불러옴:', parsedGroups.length, '개');
      return parsedGroups;
    }
    return [];
  } catch (error) {
    console.error('[MockData] 저장된 그룹 불러오기 실패:', error);
    return [];
  }
};

/**
 * 더미 그룹과 사용자 생성 그룹을 합쳐서 반환
 * @returns 전체 그룹 배열
 */
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    console.log('[MockData] getAllGroups 시작');
    
    // 더미 그룹 생성
    let dummyGroups: Group[] = [];
    try {
      dummyGroups = generateDummyGroups();
      console.log('[MockData] 더미 그룹 생성 완료:', dummyGroups.length, '개');
    } catch (error) {
      console.error('[MockData] 더미 그룹 생성 실패:', error);
      dummyGroups = []; // 빈 배열로 fallback
    }
    
    // 저장된 그룹 로드
    let createdGroups: Group[] = [];
    try {
      createdGroups = await getCreatedGroups();
      console.log('[MockData] 저장된 그룹 로드 완료:', createdGroups.length, '개');
    } catch (error) {
      console.error('[MockData] 저장된 그룹 로드 실패:', error);
      createdGroups = []; // 빈 배열로 fallback
    }
    
    const allGroups = [...dummyGroups, ...createdGroups];
    console.log('[MockData] 전체 그룹 개수:', allGroups.length);
    
    // 안전한 정렬
    try {
      return allGroups.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (sortError) {
      console.error('[MockData] 그룹 정렬 실패:', sortError);
      return allGroups; // 정렬 없이 반환
    }
  } catch (error) {
    console.error('[MockData] 전체 그룹 조회 실패:', error);
    // 최후의 fallback - 빈 배열 반환
    return [];
  }
};

/**
 * 채팅용 더미 메시지 데이터
 */
export const generateDummyChatMessages = (matchId: string = 'match_1') => {
  const baseTime = Date.now() - 24 * 60 * 60 * 1000; // 24시간 전부터 시작
  
  return [
    {
      id: `msg_${matchId}_1`,
      matchId: matchId,
      senderId: 'user_2',
      content: '안녕하세요! 매치되어서 반가워요 😊',
      type: 'TEXT' as const,
      isRead: true,
      isEncrypted: false,
      createdAt: new Date(baseTime + 60 * 1000), // 1분 후
      updatedAt: new Date(baseTime + 60 * 1000),
    },
    {
      id: `msg_${matchId}_2`,
      matchId: matchId,
      senderId: 'current_user',
      content: '안녕하세요! 저도 반가워요. 어떤 그룹에서 만났었죠?',
      type: 'TEXT' as const,
      isRead: true,
      isEncrypted: false,
      createdAt: new Date(baseTime + 5 * 60 * 1000), // 5분 후
      updatedAt: new Date(baseTime + 5 * 60 * 1000),
    },
    {
      id: `msg_${matchId}_3`,
      matchId: matchId,
      senderId: 'user_2',
      content: '카카오 본사 그룹에서요! 저도 개발자인데 혹시 어떤 부서에서 일하시나요?',
      type: 'TEXT' as const,
      isRead: true,
      isEncrypted: false,
      createdAt: new Date(baseTime + 8 * 60 * 1000), // 8분 후
      updatedAt: new Date(baseTime + 8 * 60 * 1000),
    },
    {
      id: `msg_${matchId}_4`,
      matchId: matchId,
      senderId: 'current_user',
      content: '저는 프론트엔드 개발팀에 있어요. 회사 근처에서 맛있는 점심 맛집 아시나요?',
      type: 'TEXT' as const,
      isRead: true,
      isEncrypted: false,
      createdAt: new Date(baseTime + 12 * 60 * 1000), // 12분 후
      updatedAt: new Date(baseTime + 12 * 60 * 1000),
    },
    {
      id: `msg_${matchId}_5`,
      matchId: matchId,
      senderId: 'user_2',
      content: '아! 저희 같은 팀이네요 ㅎㅎ 혹시 시간되실 때 같이 점심 드실래요? 좋은 곳 알고 있어요!',
      type: 'TEXT' as const,
      isRead: false,
      isEncrypted: false,
      createdAt: new Date(baseTime + 15 * 60 * 1000), // 15분 후
      updatedAt: new Date(baseTime + 15 * 60 * 1000),
    },
  ];
};

/**
 * 사용자가 생성한 콘텐츠를 AsyncStorage에 저장
 * @param content - 저장할 콘텐츠 정보
 */
export const saveCreatedContent = async (content: Content): Promise<void> => {
  try {
    console.log('[MockData] 생성된 콘텐츠 저장 시작:', content.id);
    const existingContents = await getCreatedContents();
    const updatedContents = [content, ...existingContents]; // 최신 순으로 정렬
    await AsyncStorage.setItem(CREATED_CONTENTS_KEY, JSON.stringify(updatedContents));
    console.log('[MockData] 생성된 콘텐츠 저장 완료. 총', updatedContents.length, '개');
  } catch (error) {
    console.error('[MockData] 생성된 콘텐츠 저장 실패:', error);
  }
};

/**
 * 사용자가 생성한 콘텐츠 목록을 AsyncStorage에서 불러오기
 * @returns 저장된 콘텐츠 배열
 */
export const getCreatedContents = async (): Promise<Content[]> => {
  try {
    const storedContents = await AsyncStorage.getItem(CREATED_CONTENTS_KEY);
    if (storedContents) {
      const parsedContents = JSON.parse(storedContents);
      console.log('[MockData] 저장된 콘텐츠 불러옴:', parsedContents.length, '개');
      // Date 객체 복원
      return parsedContents.map((content: any) => ({
        ...content,
        createdAt: new Date(content.createdAt),
        updatedAt: new Date(content.updatedAt),
      }));
    }
    return [];
  } catch (error) {
    console.error('[MockData] 저장된 콘텐츠 불러오기 실패:', error);
    return [];
  }
};

/**
 * 더미 콘텐츠와 사용자 생성 콘텐츠를 합쳐서 반환
 * @returns 전체 콘텐츠 배열
 */
export const getAllContents = async (): Promise<Content[]> => {
  try {
    console.log('[MockData] getAllContents 시작');
    
    // 더미 콘텐츠 생성
    let dummyContents: Content[] = [];
    try {
      dummyContents = generateDummyContent(10); // 더미 개수를 줄여서 생성된 콘텐츠가 더 잘 보이도록
      console.log('[MockData] 더미 콘텐츠 생성 완료:', dummyContents.length, '개');
    } catch (error) {
      console.error('[MockData] 더미 콘텐츠 생성 실패:', error);
      dummyContents = [];
    }
    
    // 저장된 콘텐츠 로드
    let createdContents: Content[] = [];
    try {
      createdContents = await getCreatedContents();
      console.log('[MockData] 저장된 콘텐츠 로드 완료:', createdContents.length, '개');
    } catch (error) {
      console.error('[MockData] 저장된 콘텐츠 로드 실패:', error);
      createdContents = [];
    }
    
    const allContents = [...createdContents, ...dummyContents]; // 생성된 콘텐츠를 먼저 배치
    console.log('[MockData] 전체 콘텐츠 개수:', allContents.length);
    
    // 시간순으로 정렬 (최신순)
    try {
      return allContents.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (sortError) {
      console.error('[MockData] 콘텐츠 정렬 실패:', sortError);
      return allContents;
    }
  } catch (error) {
    console.error('[MockData] 전체 콘텐츠 조회 실패:', error);
    return [];
  }
};

/**
 * 확장된 매칭 데이터 (더 많은 정보 포함)
 */
export const generateEnhancedMatches = (): Match[] => {
  const groups = generateDummyGroups();
  
  return [
    {
      id: 'match_1',
      user1Id: 'current_user',
      user2Id: 'user_2',
      groupId: 'group_1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastMessageAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
      isActive: true,
      chatChannelId: 'chat_1',
      updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 1,
      type: 'DATING',
      status: 'ACTIVE',
      otherUser: {
        id: 'user_2',
        anonymousId: 'anon_002',
        phoneNumber: '+821023456789',
        nickname: '커피매니아',
        realName: '이소영', // 매치된 후 공개
        gender: 'FEMALE',
        age: 28,
        bio: '커피와 독서를 좋아하는 프론트엔드 개발자입니다. 새로운 카페 탐방이 취미에요 ☕',
        profileImage: 'https://picsum.photos/200/200?random=2',
        isVerified: true,
        credits: 5,
        isPremium: false,
        lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10분 전
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      group: groups.find(g => g.id === 'group_1'),
    },
    {
      id: 'match_2',
      user1Id: 'current_user',
      user2Id: 'user_5',
      groupId: 'group_4',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
      matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3시간 전
      isActive: true,
      chatChannelId: 'chat_2',
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      unreadCount: 0,
      type: 'DATING',
      status: 'ACTIVE',
      otherUser: {
        id: 'user_5',
        anonymousId: 'anon_005',
        phoneNumber: '+821056789012',
        nickname: '독서광',
        realName: '정태현',
        gender: 'MALE',
        age: 31,
        bio: '책과 클래식 음악을 사랑하는 백엔드 개발자. 홍대 독서모임에서 자주 뵐 수 있어요 📚',
        profileImage: 'https://picsum.photos/200/200?random=5',
        isVerified: true,
        credits: 20,
        isPremium: true,
        premiumUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30분 전
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      group: groups.find(g => g.id === 'group_4'),
    },
    {
      id: 'match_3',
      user1Id: 'current_user',
      user2Id: 'user_8',
      groupId: 'group_5',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
      matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lastMessageAt: null, // 아직 대화 시작 안함
      isActive: true,
      chatChannelId: 'chat_3',
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      unreadCount: 0,
      type: 'DATING',
      status: 'ACTIVE',
      otherUser: {
        id: 'user_8',
        anonymousId: 'anon_008',
        phoneNumber: '+821078901234',
        nickname: '영화러버',
        realName: '김하은',
        gender: 'FEMALE',
        age: 26,
        bio: '영화와 운동을 좋아해요. 강남 러닝크루에서 활동 중이에요! 🏃‍♀️',
        profileImage: 'https://picsum.photos/200/200?random=8',
        isVerified: true,
        credits: 12,
        isPremium: false,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      group: groups.find(g => g.id === 'group_5'),
    },
  ];
};