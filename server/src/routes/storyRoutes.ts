import { Router } from 'express';
import { requireClerkAuth } from '../middleware/clerkAuth';
import { storyController } from '../controllers/StoryController';
import { upload } from '../config/multer';
import { fileUploadLimiter } from '../middleware/specificRateLimiters';

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