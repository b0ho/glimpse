import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCallDto, CallType } from './dto/create-call.dto';
import { CallEventDto, CallEventType } from './dto/call-event.dto';
import { TurnCredentialsDto } from './dto/turn-credentials.dto';
import * as crypto from 'crypto';

/**
 * 영상/음성 통화 서비스
 *
 * WebRTC 기반 P2P 통화를 지원합니다.
 */
@Injectable()
export class VideoCallService {
  private readonly turnSecret: string;
  private readonly turnServer: string;
  private readonly callTimeout = 60000; // 1분
  private activeCalls = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
    this.turnSecret = this.configService.get('TURN_SECRET', '');
    this.turnServer = this.configService.get(
      'TURN_SERVER',
      'turn:turn.example.com:3478',
    );
  }

  /**
   * 통화 시작
   *
   * @param callerId 발신자 ID
   * @param data 통화 데이터
   * @returns 생성된 통화 정보
   */
  async initiateCall(callerId: string, data: CreateCallDto) {
    const { recipientId: receiverId, type } = data;
    const matchId = null; // TODO: add matchId to CreateCallDto if needed

    // 매치 확인 (있는 경우)
    if (matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException('매치를 찾을 수 없습니다.');
      }

      // 매치 참여자 확인
      if (match.user1Id !== callerId && match.user2Id !== callerId) {
        throw new ForbiddenException('매치 참여자가 아닙니다.');
      }

      if (match.user1Id !== receiverId && match.user2Id !== receiverId) {
        throw new BadRequestException('수신자가 매치 참여자가 아닙니다.');
      }
    }

    // 이미 진행 중인 통화 확인
    const existingCall = await this.prisma.videoCall.findFirst({
      where: {
        OR: [
          {
            callerId,
            receiverId: receiverId,
            status: { in: ['INITIATED', 'RINGING', 'CONNECTED'] },
          },
          {
            callerId: receiverId,
            receiverId: callerId,
            status: { in: ['INITIATED', 'RINGING', 'CONNECTED'] },
          },
        ],
      },
    });

    if (existingCall) {
      throw new BadRequestException('이미 진행 중인 통화가 있습니다.');
    }

    // 통화 생성
    const call = await this.prisma.videoCall.create({
      data: {
        callerId,
        receiverId,
        callType: type as any, // TODO: fix CallType enum in Prisma schema
        status: 'INITIATED',
        startedAt: new Date(),
      },
      include: {
        caller: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    // 푸시 알림 전송
    await this.notificationService.sendPushNotification(receiverId, {
      title: `${callerId}님의 ${type === 'VIDEO' ? '영상' : '음성'} 통화`,
      body: '통화 요청이 왔습니다.',
      data: {
        type: 'INCOMING_CALL',
        callId: call.id,
        callType: type,
        callerId: callerId,
        callerNickname: callerId,
        callerImage: null,
      },
    });

    // 타임아웃 설정 (1분 후 자동 취소)
    const timeout = setTimeout(() => {
      this.handleCallTimeout(call.id);
    }, this.callTimeout);

    this.activeCalls.set(call.id, timeout as any);

    return call;
  }

  /**
   * 통화 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param data 이벤트 데이터
   */
  async handleCallEvent(userId: string, data: CallEventDto) {
    const { callId, type, data: eventData } = data;

    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        receiver: true,
      },
    });

    if (!call) {
      throw new NotFoundException('통화를 찾을 수 없습니다.');
    }

    // 참여자 확인
    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('통화 참여자가 아닙니다.');
    }

    switch (type) {
      case CallEventType.ACCEPT:
        return this.acceptCall(call.id, userId);

      case CallEventType.REJECT:
        return this.rejectCall(call.id, userId);

      case CallEventType.END:
        return this.endCall(call.id, userId);

      case CallEventType.ICE_CANDIDATE:
      case CallEventType.OFFER:
      case CallEventType.ANSWER:
        return this.relaySignal(call, userId, type, eventData);

      case CallEventType.MUTE_AUDIO:
      case CallEventType.UNMUTE_AUDIO:
      case CallEventType.MUTE_VIDEO:
      case CallEventType.UNMUTE_VIDEO:
        return this.updateMediaState(call, userId, type);

      default:
        throw new BadRequestException('알 수 없는 이벤트 타입입니다.');
    }
  }

  /**
   * TURN 서버 자격 증명 생성
   *
   * @param userId 사용자 ID
   * @returns TURN 자격 증명
   */
  async getTurnCredentials(userId: string): Promise<TurnCredentialsDto> {
    const timestamp = Math.floor(Date.now() / 1000) + 86400; // 24시간 유효
    const username = `${timestamp}:${userId}`;

    // HMAC-SHA1로 자격 증명 생성
    const hmac = crypto.createHmac('sha1', this.turnSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return {
      username,
      credential,
      urls: [
        this.turnServer,
        this.turnServer.replace('turn:', 'turns:').replace(':3478', ':5349'),
      ],
      ttl: 86400,
    };
  }

  /**
   * 활성 통화 목록 조회
   *
   * @param userId 사용자 ID
   * @returns 활성 통화 목록
   */
  async getActiveCalls(userId: string) {
    const calls = await this.prisma.videoCall.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }],
        status: {
          in: ['INITIATED', 'RINGING', 'CONNECTED'],
        },
      },
      include: {
        caller: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return calls.map((call) => ({
      ...call,
      isIncoming: call.receiverId === userId,
      otherUser: call.callerId === userId ? call.receiver : call.caller,
    }));
  }

  /**
   * 통화 기록 조회
   *
   * @param userId 사용자 ID
   * @param limit 조회 개수
   * @param offset 오프셋
   */
  async getCallHistory(userId: string, limit: number = 20, offset: number = 0) {
    const calls = await this.prisma.videoCall.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }],
        status: {
          in: ['ENDED', 'MISSED', 'REJECTED'],
        },
      },
      include: {
        caller: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    return {
      calls: calls.map((call) => ({
        ...call,
        isIncoming: call.receiverId === userId,
        otherUser: call.callerId === userId ? call.receiver : call.caller,
        duration: call.duration,
      })),
      pagination: {
        limit,
        offset,
        hasMore: calls.length === limit,
      },
    };
  }

  /**
   * 통화 수락
   *
   * @param callId 통화 ID
   * @param userId 사용자 ID
   */
  private async acceptCall(callId: string, userId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call || call.receiverId !== userId) {
      throw new ForbiddenException('통화를 수락할 수 없습니다.');
    }

    if (call.status !== 'INITIATED') {
      throw new BadRequestException('대기 중인 통화가 아닙니다.');
    }

    // 타임아웃 제거
    const timeout = this.activeCalls.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeCalls.delete(callId);
    }

    // 통화 상태 업데이트
    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'CONNECTED',
        startedAt: new Date(),
      },
    });

    // 발신자에게 알림
    await this.notificationService.sendNotification({
      userId: call.callerId,
      type: 'CALL_ACCEPTED',
      content: '통화가 수락되었습니다.',
      data: { callId },
    });

    return updatedCall;
  }

  /**
   * 통화 거절
   *
   * @param callId 통화 ID
   * @param userId 사용자 ID
   */
  private async rejectCall(callId: string, userId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call || call.receiverId !== userId) {
      throw new ForbiddenException('통화를 거절할 수 없습니다.');
    }

    if (call.status !== 'INITIATED') {
      throw new BadRequestException('대기 중인 통화가 아닙니다.');
    }

    // 타임아웃 제거
    const timeout = this.activeCalls.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeCalls.delete(callId);
    }

    // 통화 상태 업데이트
    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'REJECTED',
        endedAt: new Date(),
      },
    });

    // 발신자에게 알림
    await this.notificationService.sendNotification({
      userId: call.callerId,
      type: 'CALL_REJECTED',
      content: '통화가 거절되었습니다.',
      data: { callId },
    });

    return updatedCall;
  }

  /**
   * 통화 종료
   *
   * @param callId 통화 ID
   * @param userId 사용자 ID
   */
  private async endCall(callId: string, userId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call || (call.callerId !== userId && call.receiverId !== userId)) {
      throw new ForbiddenException('통화를 종료할 수 없습니다.');
    }

    if (call.status === 'ENDED') {
      return call;
    }

    // 통화 상태 업데이트
    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // 상대방에게 알림
    const otherUserId =
      call.callerId === userId ? call.receiverId : call.callerId;
    await this.notificationService.sendNotification({
      userId: otherUserId,
      type: 'CALL_ENDED',
      content: '통화가 종료되었습니다.',
      data: { callId },
    });

    return updatedCall;
  }

  /**
   * 시그널링 중계
   *
   * @param call 통화 정보
   * @param userId 발신자 ID
   * @param type 시그널 타입
   * @param data 시그널 데이터
   */
  private async relaySignal(
    call: any,
    userId: string,
    type: CallEventType,
    data: any,
  ) {
    const targetUserId =
      call.callerId === userId ? call.receiverId : call.callerId;

    // WebSocket을 통해 상대방에게 시그널 전달
    // 실제 구현에서는 WebSocket 서비스를 통해 전달
    await this.notificationService.sendNotification({
      userId: targetUserId,
      type: 'CALL_SIGNAL',
      content: type,
      data: {
        callId: call.id,
        signalType: type,
        signalData: data,
      },
    });

    return { success: true };
  }

  /**
   * 미디어 상태 업데이트
   *
   * @param call 통화 정보
   * @param userId 사용자 ID
   * @param type 이벤트 타입
   */
  private async updateMediaState(
    call: any,
    userId: string,
    type: CallEventType,
  ) {
    const targetUserId =
      call.callerId === userId ? call.receiverId : call.callerId;

    // 상대방에게 미디어 상태 변경 알림
    await this.notificationService.sendNotification({
      userId: targetUserId,
      type: 'MEDIA_STATE_CHANGED',
      content: type,
      data: {
        callId: call.id,
        mediaEvent: type,
      },
    });

    return { success: true };
  }

  /**
   * 통화 타임아웃 처리
   *
   * @param callId 통화 ID
   */
  private async handleCallTimeout(callId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call || call.status !== 'INITIATED') {
      return;
    }

    // 통화 상태를 MISSED로 변경
    await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'MISSED',
        endedAt: new Date(),
      },
    });

    // 발신자에게 알림
    await this.notificationService.sendNotification({
      userId: call.callerId,
      type: 'CALL_TIMEOUT',
      content: '통화 연결 시간이 초과되었습니다.',
      data: { callId },
    });

    this.activeCalls.delete(callId);
  }
}
