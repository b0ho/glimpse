import { Router } from 'express';
import { locationController } from '../controllers/LocationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 위치 기반 그룹 생성
router.post('/groups', authenticate, locationController.createLocationGroup);

// GPS로 위치 기반 그룹 참여
router.post('/groups/:groupId/join', authenticate, locationController.joinLocationGroup);

// QR 코드로 그룹 참여
router.post('/groups/join-qr', authenticate, locationController.joinGroupByQR);

// 주변 그룹 검색
router.get('/groups/nearby', locationController.getNearbyGroups);

// 위치 히스토리 조회
router.get('/history', authenticate, locationController.getLocationHistory);

// 그룹 QR 코드 생성
router.get('/groups/:groupId/qr-code', authenticate, locationController.getGroupQRCode);

// 좌표를 주소로 변환
router.get('/geocode/reverse', locationController.getAddressFromCoordinates);

export default router;