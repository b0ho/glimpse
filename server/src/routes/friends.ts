import { Router } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth';
import { friendController } from '../controllers/FriendController';

const router = Router();

// Get friend requests
router.get('/requests', clerkAuthMiddleware, friendController.getFriendRequests);

// Send friend request
router.post('/requests', clerkAuthMiddleware, friendController.sendFriendRequest);

// Accept friend request
router.post('/requests/:requestId/accept', clerkAuthMiddleware, friendController.acceptFriendRequest);

// Reject friend request
router.post('/requests/:requestId/reject', clerkAuthMiddleware, friendController.rejectFriendRequest);

// Get friends list
router.get('/', clerkAuthMiddleware, friendController.getFriends);

// Remove friend
router.delete('/:friendId', clerkAuthMiddleware, friendController.removeFriend);

export default router;