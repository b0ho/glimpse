/**
 * @module matches
 * @description 매칭 관리 API 라우트 모듈
 * 
 * 이 모듈은 Glimpse 앱의 핵심 기능인 사용자 간 매칭 시스템을 관리하는 API 엔드포인트들을 제공합니다.
 * 상호 '좋아요'를 통해 성사된 매칭을 관리하며, 다음과 같은 기능을 포함합니다:
 * - 매칭 목록 조회
 * - 매칭 상세 정보 확인
 * - 매칭 해제 기능
 * - 매칭 통계 조회
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import express from 'express';
import { MatchController } from '../controllers/MatchController';
import { authMiddleware } from '../middleware/auth';

/**
 * 매칭 관리 API 라우터
 * @description 매칭 관리 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = express.Router();

/**
 * 매칭 컸트롤러 인스턴스
 * @description 매칭 관련 비즈니스 로직을 처리하는 컸트롤러
 * @type {MatchController}
 */
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