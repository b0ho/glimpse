import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('성능 테스트', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01098989898');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('989898');
    await authPage.clickVerify();
  });

  test('대용량 메시지 처리', async ({ page, context }) => {
    await page.goto('/chat/match-performance-test');
    
    // 성능 메트릭 수집 시작
    await page.evaluate(() => {
      (window as any).performanceMetrics = {
        messagesSent: 0,
        messagesReceived: 0,
        startTime: Date.now(),
        errors: 0
      };
    });
    
    // 100개의 메시지 연속 전송
    const messageCount = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < messageCount; i++) {
      await page.fill('[data-testid="message-input"]', `성능 테스트 메시지 ${i + 1}`);
      await page.press('[data-testid="message-input"]', 'Enter');
      
      // 메시지 전송 확인 (비동기)
      await page.evaluate((index) => {
        (window as any).performanceMetrics.messagesSent = index + 1;
      }, i);
    }
    
    // 모든 메시지 렌더링 대기
    await page.waitForSelector(`[data-testid="message-${messageCount}"]`, { timeout: 30000 });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // 성능 지표 확인
    const metrics = await page.evaluate(() => (window as any).performanceMetrics);
    
    // 성능 기준
    expect(totalTime).toBeLessThan(10000); // 10초 이내
    expect(metrics.errors).toBe(0);
    expect(metrics.messagesSent).toBe(messageCount);
    
    // 평균 처리 시간
    const avgTime = totalTime / messageCount;
    expect(avgTime).toBeLessThan(100); // 메시지당 100ms 이내
    
    // 메모리 사용량 체크
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1048576; // MB
      }
      return 0;
    });
    
    expect(memoryUsage).toBeLessThan(200); // 200MB 이내
  });

  test('동시 접속자 시뮬레이션', async ({ page, context, browser }) => {
    const userCount = 20;
    const pages: any[] = [];
    
    // 여러 사용자 동시 접속
    for (let i = 0; i < userCount; i++) {
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      pages.push({ context: newContext, page: newPage });
      
      // 각 사용자 로그인
      const authPage = new AuthPage(newPage);
      await authPage.goto();
      await authPage.enterPhoneNumber(`0101111${String(i).padStart(4, '0')}`);
      await authPage.clickSendCode();
      await authPage.enterVerificationCode(`11${String(i).padStart(4, '0')}`);
      await authPage.clickVerify();
    }
    
    // 모든 사용자가 동시에 액션 수행
    const startTime = Date.now();
    
    await Promise.all(pages.map(async ({ page }, index) => {
      // 그룹 목록 조회
      await page.goto('/groups');
      await page.waitForSelector('[data-testid="groups-list"]');
      
      // 매칭 화면 이동
      await page.goto('/matching');
      await page.waitForSelector('[data-testid="user-card"]');
      
      // 좋아요 전송
      if (index % 2 === 0) {
        await page.click('[data-testid="like-button"]');
      }
    }));
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // 동시 처리 성능 확인
    expect(totalTime).toBeLessThan(15000); // 15초 이내
    
    // 에러 발생 여부 확인
    for (const { page } of pages) {
      const errors = await page.evaluate(() => {
        return (window as any).__errors || [];
      });
      expect(errors).toHaveLength(0);
    }
    
    // 정리
    for (const { context } of pages) {
      await context.close();
    }
  });

  test('이미지 로딩 최적화', async ({ page }) => {
    await page.goto('/stories');
    
    // 네트워크 속도 제한 (3G)
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 지연
      await route.continue();
    });
    
    // 이미지 로딩 성능 측정
    const startTime = Date.now();
    
    // 스토리 목록 로딩
    await page.waitForSelector('[data-testid="stories-list"]');
    
    // 모든 이미지 로딩 확인
    const images = await page.locator('img[data-testid^="story-thumbnail-"]').all();
    
    for (const img of images) {
      await expect(img).toBeVisible();
    }
    
    const loadTime = Date.now() - startTime;
    
    // 느린 네트워크에서도 적절한 시간 내 로딩
    expect(loadTime).toBeLessThan(5000); // 5초 이내
    
    // Lazy loading 확인
    const lazyLoadedImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img[loading="lazy"]');
      return imgs.length;
    });
    
    expect(lazyLoadedImages).toBeGreaterThan(0);
    
    // 이미지 최적화 확인 (WebP 지원)
    const webpImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img[src*=".webp"], source[srcset*=".webp"]');
      return imgs.length;
    });
    
    expect(webpImages).toBeGreaterThan(0);
  });

  test('실시간 업데이트 성능', async ({ page, context }) => {
    // 두 번째 사용자 생성
    const page2 = await context.newPage();
    const authPage2 = new AuthPage(page2);
    await authPage2.goto();
    await authPage2.enterPhoneNumber('01087878787');
    await authPage2.clickSendCode();
    await authPage2.enterVerificationCode('878787');
    await authPage2.clickVerify();
    
    // 채팅방 입장
    await page.goto('/chat/match-realtime-test');
    await page2.goto('/chat/match-realtime-test');
    
    // 실시간 메시지 성능 측정
    const messageCount = 50;
    const latencies: number[] = [];
    
    // 메시지 수신 리스너 설정
    await page2.evaluate(() => {
      (window as any).messageTimestamps = {};
      window.addEventListener('message-received', (event: any) => {
        const { messageId, timestamp } = event.detail;
        (window as any).messageTimestamps[messageId] = Date.now() - timestamp;
      });
    });
    
    // 연속 메시지 전송
    for (let i = 0; i < messageCount; i++) {
      const messageId = `msg-${i}`;
      const timestamp = Date.now();
      
      await page.evaluate((data) => {
        const { id, time } = data;
        window.postMessage({ 
          type: 'SEND_MESSAGE',
          messageId: id,
          timestamp: time,
          content: `실시간 테스트 ${id}`
        }, '*');
      }, { id: messageId, time: timestamp });
      
      // 짧은 간격으로 전송
      await page.waitForTimeout(50);
    }
    
    // 모든 메시지 수신 대기
    await page2.waitForTimeout(3000);
    
    // 지연 시간 분석
    const timestamps = await page2.evaluate(() => (window as any).messageTimestamps);
    const latencyValues = Object.values(timestamps) as number[];
    
    // 평균 지연 시간
    const avgLatency = latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length;
    expect(avgLatency).toBeLessThan(200); // 평균 200ms 이내
    
    // 최대 지연 시간
    const maxLatency = Math.max(...latencyValues);
    expect(maxLatency).toBeLessThan(1000); // 최대 1초 이내
    
    // 메시지 손실률
    const receivedCount = latencyValues.length;
    const lossRate = (messageCount - receivedCount) / messageCount;
    expect(lossRate).toBeLessThan(0.01); // 1% 미만 손실
  });

  test('대용량 그룹 목록 렌더링', async ({ page }) => {
    await page.goto('/groups');
    
    // 가상 스크롤링 성능 테스트
    const startTime = Date.now();
    
    // 초기 렌더링
    await page.waitForSelector('[data-testid="groups-list"]');
    const initialRenderTime = Date.now() - startTime;
    
    // 초기 렌더링은 빨라야 함
    expect(initialRenderTime).toBeLessThan(1000); // 1초 이내
    
    // 스크롤 성능 측정
    const scrollStartTime = Date.now();
    
    // 빠른 스크롤
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 1000);
      });
      await page.waitForTimeout(100);
    }
    
    const scrollTime = Date.now() - scrollStartTime;
    
    // 스크롤 중 프레임 드롭 확인
    const frameDrops = await page.evaluate(() => {
      return new Promise(resolve => {
        let drops = 0;
        let lastTime = performance.now();
        let frameCount = 0;
        
        const checkFrame = () => {
          const currentTime = performance.now();
          const delta = currentTime - lastTime;
          
          if (delta > 33) { // 30fps 기준 (33ms)
            drops++;
          }
          
          lastTime = currentTime;
          frameCount++;
          
          if (frameCount < 60) {
            requestAnimationFrame(checkFrame);
          } else {
            resolve(drops);
          }
        };
        
        requestAnimationFrame(checkFrame);
      });
    });
    
    // 프레임 드롭 최소화
    expect(frameDrops).toBeLessThan(5); // 60프레임 중 5개 미만
    
    // DOM 노드 수 확인 (가상 스크롤링)
    const visibleNodes = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid^="group-item-"]').length;
    });
    
    // 가상 스크롤링으로 DOM 노드 제한
    expect(visibleNodes).toBeLessThan(50); // 화면에 50개 미만만 렌더링
  });

  test('API 응답 시간 모니터링', async ({ page }) => {
    // API 인터셉터 설정
    await page.route('**/api/**', async route => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      
      // 응답 시간 기록
      await page.evaluate((data) => {
        (window as any).apiMetrics = (window as any).apiMetrics || [];
        (window as any).apiMetrics.push({
          url: data.url,
          duration: data.duration,
          status: data.status
        });
      }, {
        url: route.request().url(),
        duration: endTime - startTime,
        status: response.status()
      });
      
      await route.fulfill({ response });
    });
    
    // 여러 API 호출 수행
    await page.goto('/');
    await page.goto('/groups');
    await page.goto('/matching');
    await page.goto('/chat');
    
    // API 메트릭 분석
    const metrics = await page.evaluate(() => (window as any).apiMetrics || []);
    
    // 모든 API 응답 시간 확인
    for (const metric of metrics) {
      expect(metric.duration).toBeLessThan(1000); // 1초 이내
      expect(metric.status).toBeLessThan(400); // 성공 응답
    }
    
    // 평균 응답 시간
    const avgResponseTime = metrics.reduce((sum: number, m: any) => sum + m.duration, 0) / metrics.length;
    expect(avgResponseTime).toBeLessThan(300); // 평균 300ms 이내
  });

  test('메모리 누수 검사', async ({ page }) => {
    // 초기 메모리 사용량
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 반복적인 화면 전환
    for (let i = 0; i < 20; i++) {
      await page.goto('/groups');
      await page.waitForSelector('[data-testid="groups-list"]');
      
      await page.goto('/matching');
      await page.waitForSelector('[data-testid="user-card"]');
      
      await page.goto('/chat');
      await page.waitForSelector('[data-testid="chat-list"]');
    }
    
    // 가비지 컬렉션 강제 실행
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // 최종 메모리 사용량
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 메모리 증가량 확인
    const memoryIncrease = finalMemory - initialMemory;
    const increasePercentage = (memoryIncrease / initialMemory) * 100;
    
    // 메모리 누수 없음 (20% 이상 증가하지 않음)
    expect(increasePercentage).toBeLessThan(20);
  });
});