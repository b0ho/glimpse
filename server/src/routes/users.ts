import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// All user routes require authentication
router.use(authMiddleware);

// User profile operations
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateProfile);
router.delete('/me', userController.deleteAccount);

// User discovery and matching
router.get('/recommendations', userController.getRecommendations);
router.get('/:userId', userController.getUserById);

// Like system
router.post('/like', userController.sendLike);
router.get('/likes/received', userController.getReceivedLikes);
router.get('/likes/sent', userController.getSentLikes);

// Credit management
router.get('/credits', userController.getCredits);
router.post('/credits/purchase', userController.purchaseCredits);

export default router;