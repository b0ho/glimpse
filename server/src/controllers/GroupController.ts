import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { groupService } from '../services/GroupService';
import { companyVerificationService } from '../services/CompanyVerificationService';
import { locationService } from '../services/LocationService';

/**
 * 그룹 컨트롤러 - 그룹 생성, 관리 및 가입 기능
 * @class GroupController
 */
export class GroupController {
  /**
   * 그룹 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (query: type, search, page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroups(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }
      const { type, search, page = 1, limit = 20 } = req.query;

      const groups = await groupService.getGroups({
        userId,
        type: type as any,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: groups
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 새 그룹 생성
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: name, description, type, settings, location, companyId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async createGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }
      const { name, description, type, settings, location, companyId } = req.body;

      if (!name || !type) {
        throw createError(400, '그룹 이름과 타입이 필요합니다.');
      }

      if (name.length < 2 || name.length > 50) {
        throw createError(400, '그룹 이름은 2자 이상 50자 이하로 입력해주세요.');
      }

      // Check group creation limits for non-premium users
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      if (!user.isPremium) {
        const groupCount = await prisma.group.count({
          where: { creatorId: userId }
        });

        if (groupCount >= 3) {
          throw createError(403, '무료 사용자는 최대 3개의 그룹만 생성할 수 있습니다.');
        }
      }

      // Validate user can create this type of group
      if (type === 'OFFICIAL' && !companyId) {
        throw createError(400, '공식 그룹은 회사 인증이 필요합니다.');
      }

      if (type === 'OFFICIAL') {
        const isVerified = await companyVerificationService.isUserVerifiedForCompany(userId, companyId);
        if (!isVerified) {
          throw createError(403, '해당 회사에 대한 인증이 필요합니다.');
        }
      }

      const group = await groupService.createGroup({
        name,
        description,
        type,
        settings: settings || {},
        location,
        companyId,
        creatorId: userId
      });

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 초대 링크 생성
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async generateInviteLink(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { groupId } = req.params;
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const inviteLink = await groupService.generateInviteLink(groupId, userId);

      res.json({
        success: true,
        data: { inviteLink }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 초대 링크로 그룹 가입
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: inviteCode)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async joinGroupByInvite(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { inviteCode } = req.params;
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const result = await groupService.joinGroupByInvite(inviteCode, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 초대 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroupInvites(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { groupId } = req.params;
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const invites = await groupService.getGroupInvites(groupId, userId);

      res.json({
        success: true,
        data: invites
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 초대 취소
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: inviteId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async revokeInvite(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { inviteId } = req.params;
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      await groupService.revokeInvite(inviteId, userId);

      res.json({
        success: true,
        message: '초대가 취소되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 특정 그룹 상세 정보 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroupById(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const group = await groupService.getGroupById(groupId, userId);

      if (!group) {
        throw createError(404, '그룹을 찾을 수 없습니다.');
      }

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 정보 업데이트
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, body: updateData)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updateGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }
      const updateData = req.body;

      // Check if user has permission to update
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['ADMIN', 'CREATOR'] },
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '그룹을 수정할 권한이 없습니다.');
      }

      const group = await groupService.updateGroup(groupId, updateData);

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 삭제
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async deleteGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      // Check if user is the creator
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { creatorId: true }
      });

      if (!group || group.creatorId !== userId) {
        throw createError(403, '그룹을 삭제할 권한이 없습니다.');
      }

      await groupService.deleteGroup(groupId);

      res.json({
        success: true,
        data: { message: '그룹이 삭제되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 가입
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async joinGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const result = await groupService.joinGroup(userId, groupId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 탈퇴
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async leaveGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      await groupService.leaveGroup(userId, groupId);

      res.json({
        success: true,
        data: { message: '그룹에서 나갔습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 멤버 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getGroupMembers(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }
      const { page = 1, limit = 50 } = req.query;

      // Check if user is member of the group
      const membership = await prisma.groupMember.findFirst({
        where: { groupId, userId, status: 'ACTIVE' }
      });

      if (!membership) {
        throw createError(403, '그룹 멤버만 멤버 목록을 볼 수 있습니다.');
      }

      const members = await groupService.getGroupMembers(
        groupId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹에 사용자 초대
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, body: phoneNumbers)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async inviteToGroup(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { phoneNumbers } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
        throw createError(400, '초대할 전화번호 목록이 필요합니다.');
      }

      // Check if user has permission to invite
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['ADMIN', 'CREATOR'] },
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '멤버를 초대할 권한이 없습니다.');
      }

      const result = await groupService.inviteUsersToGroup(groupId, phoneNumbers, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 멤버 역할 변경
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, userId, body: role)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async updateMemberRole(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId, userId: targetUserId } = req.params;
      const { role } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      if (!targetUserId) {
        throw createError(400, '사용자 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      if (!['MEMBER', 'ADMIN'].includes(role)) {
        throw createError(400, '유효하지 않은 역할입니다.');
      }

      // Check if user has permission
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['ADMIN', 'CREATOR'] },
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '멤버 역할을 변경할 권한이 없습니다.');
      }

      await prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: targetUserId,
            groupId
          }
        },
        data: { role }
      });

      res.json({
        success: true,
        data: { message: '멤버 역할이 변경되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹에서 멤버 제거
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, userId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async removeMember(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId, userId: targetUserId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      if (!targetUserId) {
        throw createError(400, '사용자 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      // Check if user has permission
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['ADMIN', 'CREATOR'] },
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '멤버를 제거할 권한이 없습니다.');
      }

      await prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: targetUserId,
            groupId
          }
        },
        data: { status: 'BANNED' }
      });

      res.json({
        success: true,
        data: { message: '멤버가 제거되었습니다.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 위치 기반 그룹 체크인
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, body: latitude, longitude, accuracy, method)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async locationCheckIn(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { latitude, longitude, accuracy, method = 'GPS' } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      if (!latitude || !longitude) {
        throw createError(400, '위치 정보가 필요합니다.');
      }

      // LocationService에 checkIn 메소드가 없으므로 임시로 주석처리
      // TODO: checkIn 메소드 구현 필요
      const result = { success: true };
      // const result = await locationService.checkIn(userId, groupId, {
      //   latitude,
      //   longitude,
      //   accuracy: accuracy || 100,
      //   method
      // });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 체크인 내역 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, query: page, limit)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getCheckIns(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }
      const { page = 1, limit = 20 } = req.query;

      // LocationService에 getCheckIns 메소드가 없으므로 임시로 주석처리
      // TODO: getCheckIns 메소드 구현 필요
      const checkIns: any[] = [];
      // const checkIns = await locationService.getCheckIns(
      //   groupId,
      //   parseInt(page as string),
      //   parseInt(limit as string)
      // );

      res.json({
        success: true,
        data: checkIns
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 초대 코드 생성
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, body: maxUses, expiresInHours)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async createInviteCode(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { maxUses = 1, expiresInHours = 24 } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      if (!groupId) {
        throw createError(400, '그룹 ID가 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      // Check if user has permission
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ['ADMIN', 'CREATOR'] },
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw createError(403, '초대 코드를 생성할 권한이 없습니다.');
      }

      const inviteCode = await groupService.createInviteCode(groupId, userId, maxUses, expiresInHours);

      res.json({
        success: true,
        data: inviteCode
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 초대 코드로 그룹 가입
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (body: code)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async joinByInviteCode(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }
      
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      if (!code) {
        throw createError(400, '초대 코드가 필요합니다.');
      }

      const result = await groupService.joinByInviteCode(userId, code);

      res.json({
        success: true,  
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 대기 중인 멤버 목록 조회
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getPendingMembers(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { groupId } = req.params;
      const userId = req.auth.userId;
      if (!userId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const pendingMembers = await groupService.getPendingMembers(groupId, userId);

      res.json({
        success: true,
        data: pendingMembers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 멤버 가입 승인
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, userId)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async approveMember(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { groupId, userId: targetUserId } = req.params;
      const adminUserId = req.auth.userId;
      if (!adminUserId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      const result = await groupService.approveMember(groupId, targetUserId, adminUserId);

      res.json({
        success: true,
        data: result,
        message: '멤버 가입이 승인되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 멤버 가입 거절
   * @param {ClerkAuthRequest} req - Clerk 인증이 포함된 request 객체 (params: groupId, userId, body: reason)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async rejectMember(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { groupId, userId: targetUserId } = req.params;
      const { reason } = req.body;
      const adminUserId = req.auth.userId;
      if (!adminUserId) {
        throw createError(401, '사용자 ID를 찾을 수 없습니다.');
      }

      await groupService.rejectMember(groupId, targetUserId, adminUserId, reason);

      res.json({
        success: true,
        message: '멤버 가입이 거절되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const groupController = new GroupController();