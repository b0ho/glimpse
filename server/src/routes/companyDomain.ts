/**
 * @module companyDomain
 * @description 회사 도메인 인증 API 라우트 모듈
 * 
 * 이 모듈은 회사 이메일 도메인을 통한 사용자 인증 기능을 제공하는 API 엔드포인트들을 관리합니다.
 * 한국의 기업 문화에 맞춰 회사 인증을 통한 그룹 가입 기능을 지원하며, 다음과 같은 기능을 포함합니다:
 * - 회사 이메일 인증 코드 발송
 * - 이메일 인증 코드 검증
 * - 인증된 도메인 목록 조회
 * - 도메인 검색 기능
 * - 새로운 회사 도메인 추가 (관리자용)
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { companyDomainController } from '../controllers/CompanyDomainController';
import { authenticate } from '../middleware/auth';

/**
 * 회사 도메인 인증 API 라우터
 * @description 회사 도메인 인증 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// 인증된 사용자용 엔드포인트
router.post('/verify/send', authenticate, companyDomainController.sendVerificationEmail);
router.post('/verify/code', authenticate, companyDomainController.verifyEmailCode);

// 공개 엔드포인트
router.get('/domains', companyDomainController.getVerifiedDomains);
router.get('/domains/search', companyDomainController.searchDomains);

// 관리자용 엔드포인트 (나중에 관리자 권한 미들웨어 추가)
router.post('/domains', companyDomainController.addCompanyDomain);

export default router;