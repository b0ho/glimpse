import express from 'express';
import { GroupController } from '../controllers/GroupController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
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

export default router;