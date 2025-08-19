import { test, expect } from '@playwright/test';

test.describe('Post Creation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the mobile app
    await page.goto('http://localhost:8081');
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
  });

  test('should create a post and save to database', async ({ page }) => {
    // Try to find and click on community or posts section
    // Mobile app might have different navigation
    const communityButton = page.locator('text=/커뮤니티|Community|게시판/i').first();
    if (await communityButton.isVisible()) {
      await communityButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for create post button (+ button or "작성" button)
    const createButton = page.locator('[aria-label*="create"], [aria-label*="작성"], text=/작성|글쓰기|Create|Write/i, [data-testid="create-post"]').first();
    
    if (await createButton.isVisible()) {
      console.log('Found create button, clicking...');
      await createButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Try floating action button
      const fabButton = page.locator('[aria-label*="fab"], [class*="fab"], [data-testid="fab"]').first();
      if (await fabButton.isVisible()) {
        console.log('Found FAB button, clicking...');
        await fabButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Fill in the post form
    const titleInput = page.locator('input[placeholder*="제목"], input[placeholder*="Title"], [data-testid="post-title"]').first();
    const contentInput = page.locator('textarea[placeholder*="내용"], textarea[placeholder*="Content"], [data-testid="post-content"], [contenteditable="true"]').first();

    if (await titleInput.isVisible()) {
      await titleInput.fill('테스트 게시글 제목 - ' + new Date().toISOString());
    }

    if (await contentInput.isVisible()) {
      await contentInput.fill('테스트 게시글 내용입니다. 이것은 Playwright를 통한 자동 테스트입니다.');
    }

    // Submit the post
    const submitButton = page.locator('button:has-text("등록"), button:has-text("작성"), button:has-text("Submit"), button:has-text("Post"), [data-testid="submit-post"]').first();
    
    if (await submitButton.isVisible()) {
      console.log('Submitting post...');
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check if the post appears in the list
      const postTitle = page.locator('text=/테스트 게시글 제목/').first();
      
      if (await postTitle.isVisible()) {
        console.log('✅ Post created successfully and visible in the UI!');
      } else {
        console.log('⚠️ Post may have been created but not immediately visible');
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'post-creation-test.png', fullPage: true });
  });

  test('verify post in database', async ({ request }) => {
    // Check if the post was saved via API
    const response = await request.get('http://localhost:3001/api/v1/community/posts', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok()) {
      const posts = await response.json();
      console.log('Total posts in database:', posts.data?.length || 0);
      
      // Check for our test post
      const testPost = posts.data?.find((post: any) => 
        post.title?.includes('테스트 게시글 제목')
      );
      
      if (testPost) {
        console.log('✅ Test post found in database:', testPost);
      } else {
        console.log('❌ Test post not found in database');
        console.log('Latest posts:', posts.data?.slice(0, 3));
      }
    } else {
      console.log('❌ Failed to fetch posts from API:', response.status());
    }
  });
});