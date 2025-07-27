import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/LocationService';
import { createError } from '../middleware/errorHandler';

export class LocationController {
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