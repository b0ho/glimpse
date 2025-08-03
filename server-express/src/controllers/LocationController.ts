/**
 * @module LocationController
 * @description 위치 기반 그룹 관리 컨트롤러 - GPS 위치 기반 그룹 생성, 가입, QR 코드 기능 처리
 */
import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/LocationService';
import { createError } from '../middleware/errorHandler';

/**
 * 위치 기반 그룹 관리 컨트롤러
 * GPS 위치 기반 그룹 생성, 위치 검증, QR 코드 생성/스캔, 주변 그룹 검색 기능을 제공
 * @class LocationController
 */
export class LocationController {
  /**
   * 위치 기반 그룹 생성
   * @param {Request} req - Express request 객체 (body: name, description, latitude, longitude, radius, maxMembers)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async createLocationGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { name, description, latitude, longitude, radius, maxMembers } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!name || !latitude || !longitude || !radius) {
        throw createError(400, '필수 정보가 누락되었습니다.');
      }

      if (radius < 50 || radius > 5000) {
        throw createError(400, '반경은 50m에서 5000m 사이여야 합니다.');
      }

      const group = await locationService.createLocationGroup(userId, {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        maxMembers
      });

      res.status(201).json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 위치 기반 그룹 가입 (위치 검증)
   * @param {Request} req - Express request 객체 (params: groupId, body: latitude, longitude)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async joinLocationGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { groupId } = req.params;
      const { latitude, longitude } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!latitude || !longitude) {
        throw createError(400, '위치 정보가 필요합니다.');
      }

      const result = await locationService.verifyLocationForGroup(userId as string, groupId as string, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * QR 코드를 통한 그룹 가입
   * @param {Request} req - Express request 객체 (body: qrData)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async joinGroupByQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { qrData } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!qrData) {
        throw createError(400, 'QR 코드 데이터가 필요합니다.');
      }

      const result = await locationService.joinGroupByQRCode(userId, qrData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 주변 그룹 검색
   * @param {Request} req - Express request 객체 (query: latitude, longitude, radius)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getNearbyGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, radius = '5' } = req.query;

      if (!latitude || !longitude) {
        throw createError(400, '위치 정보가 필요합니다.');
      }

      const groups = await locationService.getNearbyGroups(
        {
          latitude: parseFloat(latitude as string),
          longitude: parseFloat(longitude as string)
        },
        parseFloat(radius as string)
      );

      res.json({
        success: true,
        data: groups
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 위치 이력 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getLocationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      const history = await locationService.getUserLocationHistory(userId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 QR 코드 생성 (관리자만 가능)
   * @param {Request} req - Express request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroupQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { groupId } = req.params;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      // 그룹 관리자인지 확인
      const { prisma } = await import('../config/database');
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: userId as string,
            groupId: groupId as string
          }
        }
      });

      if (!member || member.role !== 'ADMIN') {
        throw createError(403, '그룹 관리자만 QR 코드를 생성할 수 있습니다.');
      }

      const qrCode = await locationService.generateLocationQRCode(groupId as string);

      res.json({
        success: true,
        data: {
          qrCode
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 좌표로부터 주소 변환
   * @param {Request} req - Express request 객체 (query: latitude, longitude)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getAddressFromCoordinates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        throw createError(400, '위치 정보가 필요합니다.');
      }

      const address = await locationService.getAddressFromCoordinates({
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string)
      });

      res.json({
        success: true,
        data: {
          address
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();