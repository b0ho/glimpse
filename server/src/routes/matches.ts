import express from 'express';
import { MatchController } from '../controllers/MatchController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const matchController = new MatchController();

// All match routes require authentication
router.use(authMiddleware);

// Match operations
router.get('/', matchController.getMatches);
router.get('/:matchId', matchController.getMatchById);
router.delete('/:matchId', matchController.deleteMatch);

// Match statistics
router.get('/stats/overview', matchController.getMatchStats);

export default router;