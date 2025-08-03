import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

/**
 * 참가자 특징 인터페이스
 * @interface Features
 */
interface Features {
  /** 상의 타입 */
  upperWear?: string;
  /** 하의 타입 */
  lowerWear?: string;
  /** 안경 착용 여부 */
  glasses?: boolean | null;
  /** 특별한 특징 */
  specialFeatures?: string;
}

/**
 * 참가자 특징 정보 인터페이스
 * @interface ParticipantFeatures
 */
interface ParticipantFeatures {
  /** 내 특징 */
  myFeatures: Features;
  /** 찾는 특징 */
  lookingForFeatures: Features;
}

/**
 * 즉석 자동 매칭 서비스 - 특징 기반 자동 매칭
 * @class InstantAutoMatchingService
 * @extends {EventEmitter}
 */
export class InstantAutoMatchingService extends EventEmitter {
  /**
   * InstantAutoMatchingService 생성자
   * @param {PrismaClient} prisma - Prisma 클라이언트
   */
  constructor(private prisma: PrismaClient) {
    super();
  }

  /**
   * 모임 참가 및 특징 입력
   * @param {string} userId - 사용자 ID
   * @param {string} code - 모임 코드
   * @param {string} nickname - 닉네임
   * @param {ParticipantFeatures} features - 참가자 특징
   * @returns {Promise<Object>} 모임 및 참가자 정보
   * @throws {Error} 모임을 찾을 수 없을 때
   */
  async joinMeetingWithFeatures(
    userId: string,
    code: string,
    nickname: string,
    features: ParticipantFeatures
  ) {
    // 모임 찾기
    const meeting = await this.prisma.instantMeeting.findUnique({
      where: { code },
    });

    if (!meeting || !meeting.isActive) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    // 트랜잭션으로 참가자 생성 및 특징 저장
    const result = await this.prisma.$transaction(async (tx) => {
      // 참가자 생성
      const participant = await tx.instantParticipant.upsert({
        where: {
          userId_meetingId: {
            userId,
            meetingId: meeting.id,
          },
        },
        update: {
          nickname,
          isActive: true,
          leftAt: null,
        },
        create: {
          userId,
          meetingId: meeting.id,
          nickname,
        },
      });

      // 특징 저장
      await tx.instantParticipantFeatures.upsert({
        where: {
          participantId: participant.id,
        },
        update: {
          myFeatures: features.myFeatures,
          lookingForFeatures: features.lookingForFeatures,
        },
        create: {
          participantId: participant.id,
          myFeatures: features.myFeatures,
          lookingForFeatures: features.lookingForFeatures,
        },
      });

      return participant;
    });

    // 자동 매칭 실행 (비동기)
    this.performAutoMatching(result.id, meeting.id).catch(console.error);

    // 활동 로그
    await this.logActivity(userId, meeting.id, 'JOIN', { 
      nickname,
      hasFeatures: true 
    });

    return {
      meeting,
      participant: {
        id: result.id,
        nickname: result.nickname,
      },
    };
  }

  /**
   * 특징 업데이트 및 재매칭
   * @param {string} participantId - 참가자 ID
   * @param {ParticipantFeatures} features - 업데이트할 특징
   * @returns {Promise<Object>} 매칭 결과
   * @throws {Error} 참가자를 찾을 수 없을 때
   */
  async updateFeaturesAndMatch(
    participantId: string,
    features: ParticipantFeatures
  ) {
    // 참가자 확인
    const participant = await this.prisma.instantParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || !participant.isActive) {
      throw new Error('참가자를 찾을 수 없습니다.');
    }

    // 특징 업데이트
    await this.prisma.instantParticipantFeatures.upsert({
      where: {
        participantId: participant.id,
      },
      update: {
        myFeatures: features.myFeatures,
        lookingForFeatures: features.lookingForFeatures,
      },
      create: {
        participantId: participant.id,
        myFeatures: features.myFeatures,
        lookingForFeatures: features.lookingForFeatures,
      },
    });

    // 자동 매칭 재실행
    const matchCount = await this.performAutoMatching(
      participant.id, 
      participant.meetingId
    );

    // 활동 로그
    await this.logActivity(participant.userId, participant.meetingId, 'FEATURE_UPDATED');

    // 다른 참가자들에게 알림 (재매칭 트리거)
    this.emit('featureUpdated', { 
      meetingId: participant.meetingId,
      participantId: participant.id 
    });

    return { matchCount };
  }

  /**
   * 자동 매칭 실행
   * @private
   * @param {string} participantId - 참가자 ID
   * @param {string} meetingId - 모임 ID
   * @returns {Promise<number>} 매칭된 수
   */
  private async performAutoMatching(
    participantId: string,
    meetingId: string
  ): Promise<number> {
    // 내 특징 가져오기
    const myData = await this.prisma.instantParticipantFeatures.findUnique({
      where: { participantId },
      include: { participant: true },
    });

    if (!myData) return 0;

    // 다른 참가자들의 특징 가져오기
    const otherParticipants = await this.prisma.instantParticipantFeatures.findMany({
      where: {
        participant: {
          meetingId,
          isActive: true,
          id: { not: participantId },
        },
      },
      include: { participant: true },
    });

    const matches = [];

    // 양방향 매칭 체크
    for (const other of otherParticipants) {
      const iMatchThem = this.checkFeatureMatch(
        myData.lookingForFeatures as Features,
        other.myFeatures as Features
      );
      
      const theyMatchMe = this.checkFeatureMatch(
        other.lookingForFeatures as Features,
        myData.myFeatures as Features
      );

      if (iMatchThem && theyMatchMe) {
        // 이미 매칭이 있는지 확인
        const existingMatch = await this.prisma.instantAutoMatch.findFirst({
          where: {
            OR: [
              { participant1Id: participantId, participant2Id: other.participantId },
              { participant1Id: other.participantId, participant2Id: participantId },
            ],
          },
        });

        if (!existingMatch) {
          matches.push(other);
        }
      }
    }

    // 매칭 생성
    for (const match of matches) {
      await this.createMatch(participantId, match.participantId, meetingId);
    }

    // 매칭 시도 로그
    await this.prisma.instantMatchAttempt.create({
      data: {
        meetingId,
        participantId,
        potentialMatches: otherParticipants.length,
        successfulMatches: matches.length,
      },
    });

    return matches.length;
  }

  /**
   * 특징 매칭 체크
   * @private
   * @param {Features} lookingFor - 찾는 특징
   * @param {Features} actual - 실제 특징
   * @returns {boolean} 매칭 여부
   */
  private checkFeatureMatch(lookingFor: Features, actual: Features): boolean {
    // 상의 체크
    if (lookingFor.upperWear && lookingFor.upperWear !== actual.upperWear) {
      return false;
    }

    // 하의 체크
    if (lookingFor.lowerWear && lookingFor.lowerWear !== actual.lowerWear) {
      return false;
    }

    // 안경 체크 (null은 상관없음)
    if (lookingFor.glasses !== null && lookingFor.glasses !== actual.glasses) {
      return false;
    }

    // 특별한 특징 체크
    if (lookingFor.specialFeatures && actual.specialFeatures) {
      const lookingKeywords = this.extractKeywords(lookingFor.specialFeatures);
      const actualKeywords = this.extractKeywords(actual.specialFeatures);

      // 키워드 매칭 (50% 이상)
      const matchCount = lookingKeywords.filter(keyword =>
        actualKeywords.some(ak => ak.includes(keyword) || keyword.includes(ak))
      ).length;

      if (matchCount < lookingKeywords.length * 0.5) {
        return false;
      }
    }

    return true;
  }

  /**
   * 키워드 추출
   * @private
   * @param {string} text - 텍스트
   * @returns {string[]} 추출된 키워드 배열
   */
  private extractKeywords(text: string): string[] {
    // 공백과 특수문자로 분리
    return text
      .toLowerCase()
      .split(/[\s,.\-_]+/)
      .filter(word => word.length > 1);
  }

  /**
   * 매칭 생성
   * @private
   * @param {string} participant1Id - 첫 번째 참가자 ID
   * @param {string} participant2Id - 두 번째 참가자 ID
   * @param {string} meetingId - 모임 ID
   * @returns {Promise<Object>} 생성된 매칭
   */
  private async createMatch(
    participant1Id: string,
    participant2Id: string,
    meetingId: string
  ) {
    const match = await this.prisma.instantAutoMatch.create({
      data: {
        meetingId,
        participant1Id,
        participant2Id,
      },
      include: {
        participant1: true,
        participant2: true,
      },
    });

    // 매칭 알림 이벤트
    this.emit('newMatch', {
      participant1: {
        id: match.participant1Id,
        nickname: match.participant1.nickname,
      },
      participant2: {
        id: match.participant2Id,
        nickname: match.participant2.nickname,
      },
      chatRoomId: match.chatRoomId,
    });

    // 활동 로그
    const participants = [match.participant1, match.participant2];
    for (const p of participants) {
      await this.logActivity(p.userId, meetingId, 'MATCH_CREATED', {
        matchId: match.id,
      });
    }

    return match;
  }

  /**
   * 내 매칭 조회
   * @param {string} participantId - 참가자 ID
   * @returns {Promise<Array>} 매칭 목록
   */
  async getMyMatches(participantId: string) {
    const matches = await this.prisma.instantAutoMatch.findMany({
      where: {
        OR: [
          { participant1Id: participantId },
          { participant2Id: participantId },
        ],
      },
      include: {
        participant1: true,
        participant2: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return matches.map(match => {
      const otherParticipant =
        match.participant1Id === participantId
          ? match.participant2
          : match.participant1;

      return {
        id: match.id,
        nickname: otherParticipant.nickname,
        chatRoomId: match.chatRoomId,
        matchedAt: match.matchedAt,
        lastMessage: match.messages[0]?.content || null,
      };
    });
  }

  /**
   * 참가자 통계
   * @param {string} participantId - 참가자 ID
   * @returns {Promise<Object>} 통계 정보
   * @throws {Error} 참가자를 찾을 수 없을 때
   */
  async getParticipantStats(participantId: string) {
    const participant = await this.prisma.instantParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new Error('참가자를 찾을 수 없습니다.');
    }

    // 매칭 수
    const matchCount = await this.prisma.instantAutoMatch.count({
      where: {
        OR: [
          { participant1Id: participantId },
          { participant2Id: participantId },
        ],
      },
    });

    // 마지막 매칭 시도
    const lastAttempt = await this.prisma.instantMatchAttempt.findFirst({
      where: { participantId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      matches: matchCount,
      lastAttempt: lastAttempt?.createdAt || null,
      potentialMatches: lastAttempt?.potentialMatches || 0,
    };
  }

  /**
   * 활동 로그 기록
   * @private
   * @param {string} userId - 사용자 ID
   * @param {string} meetingId - 모임 ID
   * @param {any} activityType - 활동 타입
   * @param {any} [activityData] - 활동 데이터
   * @returns {Promise<void>}
   */
  private async logActivity(
    userId: string,
    meetingId: string,
    activityType: any,
    activityData?: any
  ) {
    await this.prisma.instantActivityLog.create({
      data: {
        userId,
        meetingId,
        activityType,
        activityData,
      },
    });
  }
}