import { Router } from 'express';
import { contentFilterController } from '../controllers/ContentFilterController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 일반 사용자 엔드포인트
router.post('/report', authenticate, contentFilterController.reportContent);
router.post('/test', authenticate, contentFilterController.testFilter);

// 관리자 엔드포인트 (나중에 관리자 권한 미들웨어 추가)
router.get('/banned-words', contentFilterController.getBannedWords);
router.post('/banned-words', contentFilterController.addBannedWord);
router.delete('/banned-words/:wordId', contentFilterController.removeBannedWord);

export default router;