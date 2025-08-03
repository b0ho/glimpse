import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { io } from '../index';
import { notificationService } from './NotificationService';

export class VideoCallService {
  // Create a new call record
  async createCallRecord(
    callerId: string,
    receiverId: string,
    callType: 'video' | 'audio'
  ) {
    const call = await prisma.videoCall.create({
      data: {
        callerId,
        receiverId,
        callType: callType === 'video' ? 'VIDEO' : 'AUDIO' as any,
        status: 'INITIATED',
      },
      include: {
        caller: {
          select: { id: true, nickname: true }
        },
        receiver: {
          select: { id: true, nickname: true }
        }
      }
    });

    return call;
  }

  // Update call status
  async updateCallStatus(
    callId: string,
    status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'MISSED' | 'REJECTED',
    userId: string
  ) {
    const call = await prisma.videoCall.findUnique({
      where: { id: callId }
    });

    if (!call) {
      throw createError(404, '통화를 찾을 수 없습니다.');
    }

    // Verify user is part of this call
    if (call.callerId !== userId && call.receiverId !== userId) {
      throw createError(403, '이 통화에 접근할 권한이 없습니다.');
    }

    const updatedCall = await prisma.videoCall.update({
      where: { id: callId },
      data: {
        status,
        startedAt: status === 'CONNECTED' ? new Date() : undefined,
        endedAt: ['ENDED', 'MISSED', 'REJECTED'].includes(status) ? new Date() : undefined,
        duration: status === 'ENDED' && call.startedAt 
          ? Math.floor((new Date().getTime() - call.startedAt.getTime()) / 1000)
          : undefined
      }
    });

    return updatedCall;
  }

  // Handle incoming call
  async initiateCall(
    callerId: string,
    receiverId: string,
    callType: 'video' | 'audio'
  ) {
    // Check if users are matched
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: callerId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: callerId }
        ],
        status: 'ACTIVE'
      }
    });

    if (!match) {
      throw createError(403, '매칭된 사용자만 통화할 수 있습니다.');
    }

    // Check if receiver is online
    const receiverSocketId = await this.getUserSocketId(receiverId);
    if (!receiverSocketId) {
      throw createError(400, '상대방이 오프라인 상태입니다.');
    }

    // Check if either user is already in a call
    const activeCall = await prisma.videoCall.findFirst({
      where: {
        OR: [
          { callerId: { in: [callerId, receiverId] } },
          { receiverId: { in: [callerId, receiverId] } }
        ],
        status: { in: ['INITIATED', 'RINGING', 'CONNECTED'] }
      }
    });

    if (activeCall) {
      throw createError(400, '이미 통화 중입니다.');
    }

    // Create call record
    const call = await this.createCallRecord(callerId, receiverId, callType);

    // Get caller info
    const caller = await prisma.user.findUnique({
      where: { id: callerId },
      select: { nickname: true }
    });

    // Send call invitation via Socket.IO
    io.to(receiverSocketId).emit('call-invite', {
      callId: call.id,
      fromUserId: callerId,
      fromUserName: caller?.nickname || 'Unknown',
      callType
    });

    // Send push notification
    await notificationService.sendCallNotification(
      receiverId,
      callerId,
      caller?.nickname || 'Unknown',
      callType
    );

    return call;
  }

  // Accept call
  async acceptCall(callId: string, userId: string) {
    const call = await prisma.videoCall.findUnique({
      where: { id: callId },
      include: {
        caller: { select: { id: true } },
        receiver: { select: { id: true } }
      }
    });

    if (!call) {
      throw createError(404, '통화를 찾을 수 없습니다.');
    }

    if (call.receiverId !== userId) {
      throw createError(403, '이 통화를 수락할 권한이 없습니다.');
    }

    if (call.status !== 'INITIATED' && call.status !== 'RINGING') {
      throw createError(400, '이미 종료되었거나 진행 중인 통화입니다.');
    }

    // Update call status
    await this.updateCallStatus(callId, 'CONNECTED', userId);

    // Notify caller
    const callerSocketId = await this.getUserSocketId(call.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { callId });
    }

    return { success: true };
  }

  // Reject call
  async rejectCall(callId: string, userId: string) {
    const call = await prisma.videoCall.findUnique({
      where: { id: callId }
    });

    if (!call) {
      throw createError(404, '통화를 찾을 수 없습니다.');
    }

    if (call.receiverId !== userId) {
      throw createError(403, '이 통화를 거절할 권한이 없습니다.');
    }

    // Update call status
    await this.updateCallStatus(callId, 'REJECTED', userId);

    // Notify caller
    const callerSocketId = await this.getUserSocketId(call.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-rejected', { callId });
    }

    return { success: true };
  }

  // End call
  async endCall(callId: string, userId: string) {
    const call = await prisma.videoCall.findUnique({
      where: { id: callId }
    });

    if (!call) {
      throw createError(404, '통화를 찾을 수 없습니다.');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw createError(403, '이 통화를 종료할 권한이 없습니다.');
    }

    // Update call status
    await this.updateCallStatus(callId, 'ENDED', userId);

    // Notify other party
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    const otherUserSocketId = await this.getUserSocketId(otherUserId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('call-ended', { callId });
    }

    return { success: true };
  }

  // Get call history
  async getCallHistory(userId: string, page: number, limit: number) {
    const calls = await prisma.videoCall.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        caller: {
          select: { id: true, nickname: true, profileImage: true }
        },
        receiver: {
          select: { id: true, nickname: true, profileImage: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return calls.map(call => ({
      id: call.id,
      otherUser: call.callerId === userId ? call.receiver : call.caller,
      callType: call.callType,
      status: call.status,
      duration: call.duration,
      createdAt: call.createdAt,
      isOutgoing: call.callerId === userId
    }));
  }

  // Get active call
  async getActiveCall(userId: string) {
    const call = await prisma.videoCall.findFirst({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ],
        status: { in: ['INITIATED', 'RINGING', 'CONNECTED'] }
      },
      include: {
        caller: {
          select: { id: true, nickname: true }
        },
        receiver: {
          select: { id: true, nickname: true }
        }
      }
    });

    return call;
  }

  // Helper: Get user's socket ID
  private async getUserSocketId(userId: string): Promise<string | null> {
    // In a real implementation, you'd store this in Redis or similar
    // For now, we'll check all connected sockets
    const sockets = await io.fetchSockets();
    
    for (const socket of sockets) {
      if ((socket.data as any)?.userId === userId) {
        return socket.id;
      }
    }
    
    return null;
  }

  // Handle missed calls
  async markAsMissed(callId: string) {
    const call = await prisma.videoCall.findUnique({
      where: { id: callId }
    });

    if (!call || call.status !== 'INITIATED' && call.status !== 'RINGING') {
      return;
    }

    await prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'MISSED',
        endedAt: new Date()
      }
    });

    // Send missed call notification
    await notificationService.sendMissedCallNotification(
      call.receiverId,
      call.callerId,
      call.callType === 'VIDEO' ? 'video' : 'audio'
    );
  }
}

export const videoCallService = new VideoCallService();