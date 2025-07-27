import { Response, NextFunction } from 'express';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { videoCallService } from '../services/VideoCallService';
import { io } from '../index';

export class VideoCallController {
  // Initiate a call
  async initiateCall(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { receiverId, callType = 'video' } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const callerId = req.auth.userId;

      if (!receiverId) {
        throw createError(400, '수신자 ID가 필요합니다.');
      }

      if (!['video', 'audio'].includes(callType)) {
        throw createError(400, '유효하지 않은 통화 유형입니다.');
      }

      const call = await videoCallService.initiateCall(callerId, receiverId, callType);

      res.json({
        success: true,
        data: call
      });
    } catch (error) {
      next(error);
    }
  }

  // Accept a call
  async acceptCall(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { callId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      if (!callId) {
        throw createError(400, '통화 ID가 필요합니다.');
      }

      const result = await videoCallService.acceptCall(callId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Reject a call
  async rejectCall(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { callId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      if (!callId) {
        throw createError(400, '통화 ID가 필요합니다.');
      }

      const result = await videoCallService.rejectCall(callId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // End a call
  async endCall(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { callId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      if (!callId) {
        throw createError(400, '통화 ID가 필요합니다.');
      }

      const result = await videoCallService.endCall(callId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get call history
  async getCallHistory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      const calls = await videoCallService.getCallHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: calls
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active call
  async getActiveCall(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      const call = await videoCallService.getActiveCall(userId);

      res.json({
        success: true,
        data: call
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle WebRTC signaling
  async handleSignaling(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, targetUserId, data } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;

      if (!type || !targetUserId || !data) {
        throw createError(400, '필수 정보가 누락되었습니다.');
      }

      // Find target user's socket
      const sockets = await io.fetchSockets();
      const targetSocket = sockets.find(
        socket => (socket.data as any)?.userId === targetUserId
      );

      if (!targetSocket) {
        throw createError(400, '상대방이 오프라인 상태입니다.');
      }

      // Forward signaling data
      switch (type) {
        case 'offer':
          targetSocket.emit('call-offer', {
            fromUserId: userId,
            offer: data
          });
          break;
        case 'answer':
          targetSocket.emit('call-answer', {
            fromUserId: userId,
            answer: data
          });
          break;
        case 'ice-candidate':
          targetSocket.emit('ice-candidate', {
            fromUserId: userId,
            candidate: data
          });
          break;
        default:
          throw createError(400, '유효하지 않은 신호 유형입니다.');
      }

      res.json({
        success: true,
        data: { message: '신호가 전송되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const videoCallController = new VideoCallController();