/**
 * @module location
 * @description 위치 기반 그룹 API 라우트 모듈
 * 
 * 이 모듈은 GPS 좌표와 QR 코드를 활용한 위치 기반 그룹 기능을 제공하는 API 엔드포인트들을 관리합니다.
 * 카카오 맵 API를 활용하여 한국 지역에 최적화되어 있으며, 다음과 같은 기능을 포함합니다:
 * - 위치 기반 그룹 생성 및 참여
 * - GPS 좌표 및 QR 코드를 통한 그룹 참여
 * - 주변 그룹 검색
 * - 위치 히스토리 관리
 * - 좌표-주소 변환 서비스
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { locationController } from '../controllers/LocationController';
import { authenticate } from '../middleware/auth';

/**
 * 위치 기반 API 라우터
 * @description 위치 기반 그룹 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
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