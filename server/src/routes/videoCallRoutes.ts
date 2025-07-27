import { Router } from 'express';
import { requireClerkAuth } from '../middleware/clerkAuth';
import { videoCallController } from '../controllers/VideoCallController';

const router = Router();

// All routes require authentication
router.use(requireClerkAuth);

// Initiate a call
router.post('/initiate', videoCallController.initiateCall);

// Accept a call
router.post('/:callId/accept', videoCallController.acceptCall);

// Reject a call
router.post('/:callId/reject', videoCallController.rejectCall);

// End a call
router.post('/:callId/end', videoCallController.endCall);

// Get call history
router.get('/history', videoCallController.getCallHistory);

// Get active call
router.get('/active', videoCallController.getActiveCall);

// WebRTC signaling
router.post('/signal', videoCallController.handleSignaling);

export default router;