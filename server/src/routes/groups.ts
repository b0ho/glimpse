/**
 * @module groups
 * @description 그룹 관리 API 라우트 모듈
 * 
 * 이 모듈은 Glimpse 앱의 핵심 기능인 그룹 시스템을 관리하는 API 엔드포인트들을 제공합니다.
 * 4가지 그룹 유형(Official, Created, Instance, Location)을 지원하며, 다음과 같은 기능을 포함합니다:
 * - 그룹 CRUD 작업 (생성, 조회, 수정, 삭제)
 * - 그룹 가입/탈퇴 및 멤버 관리
 * - 초대 시스템 (코드 및 링크 기반)
 * - 위치 기반 그룹 기능 (체크인)
 * - 멤버 승인 시스템
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import express from 'express';
import { GroupController } from '../controllers/GroupController';
import { authMiddleware } from '../middleware/auth';

/**
 * 그룹 관리 API 라우터
 * @description 그룹 관리 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = express.Router();

/**
 * 그룹 컸트롤러 인스턴스
 * @description 그룹 관련 비즈니스 로직을 처리하는 컸트롤러
 * @type {GroupController}
 */
const groupController = new GroupController();

// All group routes require authentication
router.use(authMiddleware);

// Group CRUD operations
router.get('/', groupController.getGroups);
router.post('/', groupController.createGroup);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Group membership
router.post('/:groupId/join', groupController.joinGroup);
router.delete('/:groupId/leave', groupController.leaveGroup);
router.get('/:groupId/members', groupController.getGroupMembers);

// Group management (admin/creator only)
router.post('/:groupId/invite', groupController.inviteToGroup);
router.put('/:groupId/members/:userId', groupController.updateMemberRole);
router.delete('/:groupId/members/:userId', groupController.removeMember);

// Location-based groups
router.post('/:groupId/checkin', groupController.locationCheckIn);
router.get('/:groupId/checkins', groupController.getCheckIns);

// Invite codes (legacy)
router.post('/:groupId/invite-codes', groupController.createInviteCode);
router.post('/join-by-code', groupController.joinByInviteCode);

// New invite system
router.post('/:groupId/invites', groupController.generateInviteLink);
router.get('/:groupId/invites', groupController.getGroupInvites);
router.delete('/invites/:inviteId', groupController.revokeInvite);
router.post('/join/:inviteCode', groupController.joinGroupByInvite);

// Member approval system
router.get('/:groupId/pending-members', groupController.getPendingMembers);
router.put('/:groupId/members/:userId/approve', groupController.approveMember);
router.delete('/:groupId/members/:userId/reject', groupController.rejectMember);

export default router;