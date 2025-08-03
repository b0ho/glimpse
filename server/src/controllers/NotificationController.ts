/**
 * @module NotificationController
 * @description 알림 관리 컨트롤러 - FCM 푸시 알림, 알림 기록 관리
 */
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/NotificationService';
import { createError } from '../middleware/errorHandler';

/**
 * 알림 관리 컨트롤러
 * FCM 토큰 관리, 푸시 알림 전송, 알림 기록 조회 및 관리 기능을 제공
 * @class NotificationController
 */
export class NotificationController {
  /**
   * FCM 토큰 등록
   * @param {Request} req - Express request 객체 (body: token, deviceType)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async registerFCMToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { token, deviceType } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!token || !deviceType) {
        throw createError(400, 'FCM 토큰과 디바이스 타입이 필요합니다.');
      }

      if (!['ios', 'android'].includes(deviceType)) {
        throw createError(400, '유효하지 않은 디바이스 타입입니다.');
      }

      await notificationService.registerFCMToken(userId, token, deviceType as 'ios' | 'android');

      res.json({
        success: true,
        message: 'FCM 토큰이 등록되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * FCM 토큰 제거
   * @param {Request} req - Express request 객체 (body: token)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async removeFCMToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw createError(400, 'FCM 토큰이 필요합니다.');
      }

      await notificationService.removeFCMToken(token);

      res.json({
        success: true,
        message: 'FCM 토큰이 제거되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 알림 목록 조회
   * @param {Request} req - Express request 객체 (query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      const notifications = await notificationService.getUserNotifications(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 알림 읽음 처리
   * @param {Request} req - Express request 객체 (params: notificationId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!notificationId) {
        throw createError(400, '알림 ID가 필요합니다.');
      }

      await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: '알림을 읽음으로 표시했습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 모든 알림 읽음 처리
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: '모든 알림을 읽음으로 표시했습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 읽지 않은 알림 갯수 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 알림 삭제
   * @param {Request} req - Express request 객체 (params: notificationId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!notificationId) {
        throw createError(400, '알림 ID가 필요합니다.');
      }

      await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: '알림이 삭제되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 테스트 알림 전송 (테스트용)
   * @param {Request} req - Express request 객체 (body: title, body, data)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async testNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { title, body, data } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      // 테스트 알림을 위해 임시로 알림 레코드 생성 후 푸시 전송
      const testNotification = await notificationService.sendPaymentSuccessNotification(
        userId,
        0,
        'CREDITS',
        0
      );
      
      if (testNotification) {
        await notificationService.deleteNotification(testNotification.id, userId);
      }

      res.json({
        success: true,
        message: '테스트 알림이 전송되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();