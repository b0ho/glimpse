/**
 * 개발 및 테스트용 더미 데이터 생성 유틸리티
 */

import { Content, Group, GroupType, Match } from '@/types';

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
      authorId: `user_${(i % 7) + 1}`,
      authorNickname: nicknames[i % nicknames.length],
      groupId: 'group_company_1',
      type: i % 4 === 0 ? 'image' : 'text',
      text: textSamples[i % textSamples.length],
      imageUrls: i % 4 === 0 ? [`https://picsum.photos/400/300?random=${i}`] : undefined,
      likeCount: Math.floor(Math.random() * 20),
      isLikedByUser: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 일주일 랜덤
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
      createdAt: new Date('2024-01-15'),
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
      createdAt: new Date('2024-01-20'),
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
      createdAt: new Date('2024-01-10'),
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
      createdBy: 'user_123',
      createdAt: new Date('2024-02-01'),
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
      createdBy: 'user_456',
      createdAt: new Date('2024-01-25'),
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
        latitude: 37.5252,
        longitude: 126.9265,
        address: '서울 영등포구 여의도동 국제금융로 10',
      },
      createdAt: new Date('2024-02-05'),
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
      createdBy: 'user_789',
      createdAt: new Date('2024-01-30'),
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
      expiresAt: new Date('2024-03-01'),
      createdAt: new Date('2024-01-28'),
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
      matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      chatChannelId: 'chat_1',
    },
    {
      id: 'match_2',
      user1Id: 'current_user',
      user2Id: 'user_5',
      groupId: 'group_2',
      matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
      chatChannelId: 'chat_2',
    },
    {
      id: 'match_3',
      user1Id: 'current_user',
      user2Id: 'user_8',
      groupId: 'group_1',
      matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
      chatChannelId: 'chat_3',
    },
  ];
};

/**
 * 매칭된 사용자 닉네임 더미 데이터
 */
export const dummyUserNicknames: { [key: string]: string } = {
  user_2: '커피매니아',
  user_5: '독서광',
  user_8: '영화러버',
};