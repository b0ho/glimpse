import { Router } from 'express';
import { companyDomainController } from '../controllers/CompanyDomainController';
import { authenticate } from '../middleware/auth';

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