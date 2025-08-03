/**
 * @module storyRoutes
 * @description 스토리 기능 API 라우트 모듈
 * 
 * 이 모듈은 인스타그램 스타일의 스토리 기능을 제공하는 API 엔드포인트들을 관리합니다.
 * 매칭된 사용자들과 일상을 공유할 수 있는 기능으로, 다음과 같은 기능을 포함합니다:
 * - 스토리 생성 (이미지/비디오 업로드)
 * - 내 스토리 및 매칭된 사용자 스토리 조회
 * - 스토리 조회 및 조회자 처리
 * - 스토리 삭제 기능
 * - 파일 업로드 속도 제한
 * 
 * @author Glimpse Development Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { requireClerkAuth } from '../middleware/clerkAuth';
import { storyController } from '../controllers/StoryController';
import { upload } from '../config/multer';
import { fileUploadLimiter } from '../middleware/specificRateLimiters';

/**
 * 스토리 API 라우터
 * @description 스토리 기능 관련 API 엔드포인트를 관리하는 Express Router 인스턴스
 * @type {Router}
 */
const router = Router();

// All routes require authentication
router.use(requireClerkAuth);

// Create a new story
router.post('/', fileUploadLimiter, upload.single('media'), storyController.createStory);

// Get user's own stories
router.get('/my', storyController.getMyStories);

// Get stories from matched users (feed)
router.get('/feed', storyController.getMatchedUsersStories);

// Get a specific story
router.get('/:storyId', storyController.getStoryById);

// View a story (mark as viewed)
router.post('/:storyId/view', storyController.viewStory);

// Get story viewers
router.get('/:storyId/viewers', storyController.getStoryViewers);

// Delete a story
router.delete('/:storyId', storyController.deleteStory);

// Get stories from a specific user
router.get('/user/:userId', storyController.getUserStories);

export default router;