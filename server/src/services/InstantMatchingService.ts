import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class InstantMatchingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 즉석 모임 생성
   */
  async createInstantMeeting(creatorId: string, data: {
    name: string;
    duration: number; // 시간 단위
    location?: { lat: number; lng: number; address: string };
    featureCategories: string[];
  }) {
    const code = this.generateMeetingCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.duration);

    const meeting = await this.prisma.instantMeeting.create({
      data: {
        code,
        name: data.name,
        creatorId,
        location: data.location,
        featureCategories: data.featureCategories,
        expiresAt,
      },
    });

    // 활동 로그
    await this.logActivity(creatorId, meeting.id, 'JOIN', { role: 'creator' });

    return meeting;
  }

  /**
   * 즉석 모임 참가
   */
  async joinInstantMeeting(userId: string, code: string, nickname: string) {
    // 모임 찾기
    const meeting = await this.prisma.instantMeeting.findUnique({
      where: { code },
      include: {
        participants: {
          where: { isActive: true },
        },
      },
    });

    if (!meeting || !meeting.isActive) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    if (meeting.expiresAt < new Date()) {
      throw new Error('만료된 모임입니다.');
    }

    // 이미 참가중인지 확인
    const existing = await this.prisma.instantParticipant.findUnique({
      where: {
        userId_meetingId: {
          userId,
          meetingId: meeting.id,
        },
      },
    });

    if (existing && existing.isActive) {
      throw new Error('이미 참가중인 모임입니다.');
    }

    // 참가자 생성 또는 재활성화
    const participant = await this.prisma.instantParticipant.upsert({
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

    // 활동 로그
    await this.logActivity(userId, meeting.id, 'JOIN', { nickname });

    return {
      meeting: {
        id: meeting.id,
        name: meeting.name,
        featureCategories: meeting.featureCategories,
        expiresAt: meeting.expiresAt,
      },
      participant: {
        id: participant.id,
        nickname: participant.nickname,
      },
      participantCount: meeting.participants.length + 1,
    };
  }

  /**
   * 호감 표현 (구체적 특징 허용)
   */
  async expressInterest(
    participantId: string,
    meetingId: string,
    targetFeatures: any
  ) {
    // 참가자 확인
    const participant = await this.prisma.instantParticipant.findFirst({
      where: {
        id: participantId,
        meetingId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('참가자 정보를 찾을 수 없습니다.');
    }

    // 호감 저장
    await this.prisma.instantInterest.create({
      data: {
        fromParticipantId: participantId,
        meetingId,
        targetFeatures,
      },
    });

    // 매칭 확인
    const matches = await this.findAndCreateMatches(
      participantId,
      meetingId,
      targetFeatures
    );

    // 활동 로그
    await this.logActivity(participant.userId, meetingId, 'INTEREST_SENT', {
      matchCount: matches.length,
    });

    return {
      success: true,
      matchCount: matches.length,
    };
  }

  /**
   * 매칭 찾기 및 생성
   */
  private async findAndCreateMatches(
    fromParticipantId: string,
    meetingId: string,
    targetFeatures: any
  ) {
    // 모든 활성 참가자 조회
    const participants = await this.prisma.instantParticipant.findMany({
      where: {
        meetingId,
        isActive: true,
        id: { not: fromParticipantId },
      },
    });

    const matches = [];

    for (const participant of participants) {
      // 상대방이 나에게 보낸 호감 확인
      const reverseInterests = await this.prisma.instantInterest.findMany({
        where: {
          fromParticipantId: participant.id,
          meetingId,
        },
      });

      for (const interest of reverseInterests) {
        // 내가 상대방의 특징과 일치하는지 확인
        if (await this.checkFeatureMatch(interest.targetFeatures, fromParticipantId)) {
          // 매칭 생성
          const match = await this.createMatch(
            fromParticipantId,
            participant.id,
            meetingId
          );
          if (match) {
            matches.push(match);
          }
        }
      }
    }

    return matches;
  }

  /**
   * 특징 매칭 확인 (실제 구현 필요)
   */
  private async checkFeatureMatch(
    targetFeatures: any,
    participantId: string
  ): Promise<boolean> {
    // TODO: 실제 특징 매칭 로직 구현
    // 여기서는 간단히 true 반환 (실제로는 특징 비교 필요)
    return true;
  }

  /**
   * 매칭 생성
   */
  private async createMatch(
    participant1Id: string,
    participant2Id: string,
    meetingId: string
  ) {
    // 이미 매칭이 있는지 확인
    const existing = await this.prisma.instantMatch.findFirst({
      where: {
        OR: [
          { participant1Id, participant2Id },
          { participant1Id: participant2Id, participant2Id: participant1Id },
        ],
      },
    });

    if (existing) {
      return null;
    }

    // 매칭 생성
    const match = await this.prisma.instantMatch.create({
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

    // 두 참가자의 userId 가져오기 (활동 로그용)
    const participants = await this.prisma.instantParticipant.findMany({
      where: {
        id: { in: [participant1Id, participant2Id] },
      },
    });

    // 활동 로그
    for (const p of participants) {
      await this.logActivity(p.userId, meetingId, 'MATCH_CREATED', {
        matchId: match.id,
      });
    }

    return match;
  }

  /**
   * 매칭 목록 조회 (닉네임만 공개)
   */
  async getMyMatches(participantId: string, meetingId: string) {
    const matches = await this.prisma.instantMatch.findMany({
      where: {
        meetingId,
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
        participantNickname: otherParticipant.nickname,
        chatRoomId: match.chatRoomId,
        matchedAt: match.matchedAt,
        lastMessage: match.messages[0]?.content || null,
      };
    });
  }

  /**
   * 메시지 전송
   */
  async sendMessage(
    participantId: string,
    chatRoomId: string,
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'EMOJI' = 'TEXT'
  ) {
    // 매칭 확인
    const match = await this.prisma.instantMatch.findFirst({
      where: {
        chatRoomId,
        OR: [
          { participant1Id: participantId },
          { participant2Id: participantId },
        ],
      },
    });

    if (!match) {
      throw new Error('채팅방을 찾을 수 없습니다.');
    }

    // 메시지 생성
    const message = await this.prisma.instantMessage.create({
      data: {
        chatRoomId,
        senderParticipantId: participantId,
        content: this.encryptMessage(content), // 암호화
        messageType,
      },
    });

    // 활동 로그
    const participant = await this.prisma.instantParticipant.findUnique({
      where: { id: participantId },
    });
    
    if (participant) {
      await this.logActivity(participant.userId, match.meetingId, 'MESSAGE_SENT');
    }

    return {
      id: message.id,
      content,
      messageType,
      createdAt: message.createdAt,
    };
  }

  /**
   * 활동 로그 기록
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

  /**
   * 모임 코드 생성
   */
  private generateMeetingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 메시지 암호화 (실제 구현 필요)
   */
  private encryptMessage(content: string): string {
    // TODO: 실제 암호화 구현
    return content;
  }

  /**
   * 메시지 복호화 (실제 구현 필요)
   */
  private decryptMessage(content: string): string {
    // TODO: 실제 복호화 구현
    return content;
  }
}