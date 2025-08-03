/**
 * @module contentFilter
 * @description 콘텐츠 필터링 API 라우트 모듈
 * 
 * 이 모듈은 부적절한 콘텐츠를 필터링하고 관리하는 API 엔드포인트들을 제공합니다.
 * 안전한 데이팅 환경을 위해 다음과 같은 기능을 포함합니다:
 * - 부적절한 콘텐츠 신고
 * - 콘텐츠 필터링 테스트
 * - 금지어 관리 (관리자용)
 * - 자동 콘텐츠 검열 시스템
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { contentFilterController } from '../controllers/ContentFilterController';
import { authenticate } from '../middleware/auth';

/**
 * 콘텐츠 필터링 API 라우터
 * @description 콘텐츠 필터링 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// 일반 사용자 엔드포인트
router.post('/report', authenticate, contentFilterController.reportContent);
router.post('/test', authenticate, contentFilterController.testFilter);

// 관리자 엔드포인트 (나중에 관리자 권한 미들웨어 추가)
router.get('/banned-words', contentFilterController.getBannedWords);
router.post('/banned-words', contentFilterController.addBannedWord);
router.delete('/banned-words/:wordId', contentFilterController.removeBannedWord);

export default router;