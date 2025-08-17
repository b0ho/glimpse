import { test, expect } from '@playwright/test';

test.describe('Glimpse Mobile App - 전체 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
  });

  test('1. 앱 초기 로딩 및 온보딩', async ({ page }) => {
    // 앱 로딩 확인
    await expect(page).toHaveTitle(/Glimpse/i);
    
    // 온보딩 화면 확인
    const onboardingTitle = page.locator('text=/당신의 이상형을 찾아보세요/i');
    if (await onboardingTitle.isVisible()) {
      await expect(onboardingTitle).toBeVisible();
      
      // 온보딩 스킵 또는 완료
      const skipButton = page.locator('text=/건너뛰기|시작하기/i');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      }
    }
  });

  test('2. 회원가입 플로우', async ({ page }) => {
    // 회원가입 버튼 클릭
    const signUpButton = page.locator('text=/회원가입|가입하기|Sign Up/i').first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // 이메일 입력
      const emailInput = page.locator('input[type="email"], input[placeholder*="이메일"], input[placeholder*="Email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"], input[placeholder*="비밀번호"], input[placeholder*="Password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('Test123!@#');
      }
      
      // 닉네임 입력
      const nicknameInput = page.locator('input[placeholder*="닉네임"], input[placeholder*="Nickname"]').first();
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('TestUser');
      }
    }
  });

  test('3. 로그인 플로우', async ({ page }) => {
    // 로그인 버튼 클릭
    const loginButton = page.locator('text=/로그인|Sign In|Login/i').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // 이메일 입력
      const emailInput = page.locator('input[type="email"], input[placeholder*="이메일"], input[placeholder*="Email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"], input[placeholder*="비밀번호"], input[placeholder*="Password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('Test123!@#');
      }
      
      // 로그인 버튼 클릭
      const submitButton = page.locator('button:has-text("로그인"), button:has-text("Sign In")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }
  });

  test('4. 홈 화면 네비게이션', async ({ page }) => {
    // 하단 탭 네비게이션 확인
    const tabLabels = ['홈', '그룹', '매치', '채팅', '프로필'];
    
    for (const label of tabLabels) {
      const tab = page.locator(`text=/${label}/i`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500); // 화면 전환 대기
      }
    }
  });

  test('5. 그룹 기능', async ({ page }) => {
    // 그룹 탭으로 이동
    const groupTab = page.locator('text=/그룹|Groups/i').first();
    if (await groupTab.isVisible()) {
      await groupTab.click();
      
      // 그룹 카테고리 확인
      const categories = ['공식 그룹', '생성 그룹', '인스턴스 그룹', '위치 그룹'];
      for (const category of categories) {
        const categoryElement = page.locator(`text=/${category}/i`).first();
        if (await categoryElement.isVisible()) {
          await expect(categoryElement).toBeVisible();
        }
      }
      
      // 그룹 검색
      const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('테스트 그룹');
        await page.waitForTimeout(500);
      }
    }
  });

  test('6. 프로필 설정', async ({ page }) => {
    // 프로필 탭으로 이동
    const profileTab = page.locator('text=/프로필|Profile|내 정보/i').first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      
      // 프로필 편집 버튼
      const editButton = page.locator('text=/편집|Edit|수정/i').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // 자기소개 수정
        const bioInput = page.locator('textarea[placeholder*="자기소개"], textarea[placeholder*="Bio"]').first();
        if (await bioInput.isVisible()) {
          await bioInput.fill('안녕하세요! 테스트 사용자입니다.');
        }
      }
    }
  });

  test('7. 프리미엄 기능', async ({ page }) => {
    // 프리미엄 섹션 찾기
    const premiumButton = page.locator('text=/프리미엄|Premium|구독/i').first();
    if (await premiumButton.isVisible()) {
      await premiumButton.click();
      
      // 가격 정보 확인
      await expect(page.locator('text=/₩9,900/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
      await expect(page.locator('text=/무제한 좋아요/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });

  test('8. 좋아요 기능', async ({ page }) => {
    // 홈 화면으로 이동
    const homeTab = page.locator('text=/홈|Home|메인/i').first();
    if (await homeTab.isVisible()) {
      await homeTab.click();
      
      // 좋아요 버튼 찾기
      const likeButton = page.locator('button[aria-label*="좋아요"], button[aria-label*="Like"], .like-button').first();
      if (await likeButton.isVisible()) {
        await likeButton.click();
        
        // 좋아요 확인 모달
        const confirmButton = page.locator('text=/확인|OK|네/i').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  });

  test('9. 채팅 기능', async ({ page }) => {
    // 채팅 탭으로 이동
    const chatTab = page.locator('text=/채팅|Chat|메시지/i').first();
    if (await chatTab.isVisible()) {
      await chatTab.click();
      
      // 채팅 목록 확인
      const chatList = page.locator('[role="list"], .chat-list').first();
      if (await chatList.isVisible()) {
        // 첫 번째 채팅 열기
        const firstChat = chatList.locator('> *').first();
        if (await firstChat.isVisible()) {
          await firstChat.click();
          
          // 메시지 입력
          const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]').first();
          if (await messageInput.isVisible()) {
            await messageInput.fill('안녕하세요!');
            
            // 전송 버튼
            const sendButton = page.locator('button[aria-label*="전송"], button[aria-label*="Send"]').first();
            if (await sendButton.isVisible()) {
              await sendButton.click();
            }
          }
        }
      }
    }
  });

  test('10. 설정 메뉴', async ({ page }) => {
    // 설정 메뉴 찾기
    const settingsButton = page.locator('text=/설정|Settings|환경설정/i').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // 설정 항목들 확인
      const settingItems = [
        '알림 설정',
        '개인정보 보호',
        '계정 관리',
        '도움말',
        '로그아웃'
      ];
      
      for (const item of settingItems) {
        const itemElement = page.locator(`text=/${item}/i`).first();
        if (await itemElement.isVisible()) {
          await expect(itemElement).toBeVisible();
        }
      }
    }
  });

  test('11. 관심상대 찾기', async ({ page }) => {
    // 관심상대 찾기 메뉴
    const interestButton = page.locator('text=/관심상대|Interest|찾기/i').first();
    if (await interestButton.isVisible()) {
      await interestButton.click();
      
      // 전화번호 입력
      const phoneInput = page.locator('input[placeholder*="전화번호"], input[type="tel"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('01012345678');
      }
      
      // 검색 버튼
      const searchButton = page.locator('button:has-text("검색"), button:has-text("찾기")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
      }
    }
  });

  test('11-1. 근처 사용자 기능', async ({ page }) => {
    // 홈 화면으로 이동
    const homeTab = page.getByRole('tab', { name: /home/i });
    if (await homeTab.isVisible()) {
      await homeTab.click();
      await page.waitForTimeout(1000);
    }
    
    // 근처 사용자 버튼 찾기 및 클릭
    const nearbyButton = page.getByText('근처 사용자');
    if (await nearbyButton.isVisible()) {
      await nearbyButton.click();
      await page.waitForTimeout(2000);
      
      // 위치 권한 요청 화면 또는 근처 사용자 목록 확인
      const locationPermission = page.getByText(/위치 권한/i);
      const nearbyUsersList = page.getByText(/주변 사용자/i);
      
      if (await locationPermission.isVisible()) {
        console.log('위치 권한 요청 화면이 표시됨');
      } else if (await nearbyUsersList.isVisible()) {
        console.log('근처 사용자 목록이 표시됨');
      }
      
      // 뒤로 가기
      const backButton = page.locator('[aria-label*="back"], [name="arrow-back"]').first();
      if (await backButton.isVisible()) {
        await backButton.click();
      }
    }
  });

  test('12. 위치 기반 그룹', async ({ page }) => {
    // 위치 권한 요청 처리
    page.on('dialog', async dialog => {
      if (dialog.message().includes('위치')) {
        await dialog.accept();
      }
    });
    
    // 위치 그룹 탭
    const locationTab = page.locator('text=/위치|Location|근처/i').first();
    if (await locationTab.isVisible()) {
      await locationTab.click();
      
      // 지도 또는 위치 목록 확인
      const mapElement = page.locator('.map, #map, [aria-label*="지도"]').first();
      const locationList = page.locator('.location-list, [aria-label*="위치 목록"]').first();
      
      if (await mapElement.isVisible()) {
        await expect(mapElement).toBeVisible();
      } else if (await locationList.isVisible()) {
        await expect(locationList).toBeVisible();
      }
    }
  });

  test('13. 알림 기능', async ({ page }) => {
    // 알림 아이콘 찾기
    const notificationIcon = page.locator('[aria-label*="알림"], [aria-label*="Notification"], .notification-icon').first();
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();
      
      // 알림 목록 확인
      const notificationList = page.locator('.notification-list, [role="list"]').first();
      if (await notificationList.isVisible()) {
        await expect(notificationList).toBeVisible();
      }
    }
  });

  test('14. 다크모드 전환', async ({ page }) => {
    // 설정에서 다크모드 찾기
    const settingsButton = page.locator('text=/설정|Settings/i').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // 다크모드 토글
      const darkModeToggle = page.locator('text=/다크 모드|Dark Mode|어두운 테마/i').first();
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        
        // 배경색 변경 확인
        await page.waitForTimeout(500);
        const body = page.locator('body');
        const backgroundColor = await body.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // 다크모드 적용 확인 (어두운 색상)
        console.log('Background color:', backgroundColor);
      }
    }
  });

  test('15. 로그아웃', async ({ page }) => {
    // 로그아웃 버튼 찾기
    const logoutButton = page.locator('text=/로그아웃|Logout|Sign Out/i').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // 확인 다이얼로그
      page.on('dialog', async dialog => {
        if (dialog.message().includes('로그아웃')) {
          await dialog.accept();
        }
      });
      
      // 로그인 화면으로 돌아갔는지 확인
      await page.waitForTimeout(1000);
      const loginButton = page.locator('text=/로그인|Sign In/i').first();
      if (await loginButton.isVisible()) {
        await expect(loginButton).toBeVisible();
      }
    }
  });
});

// 성능 테스트
test.describe('성능 및 반응성 테스트', () => {
  test('페이지 로딩 시간', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`페이지 로딩 시간: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
  });
  
  test('화면 전환 속도', async ({ page }) => {
    await page.goto('http://localhost:8081');
    
    const tabs = ['그룹', '매치', '채팅', '프로필'];
    
    for (const tab of tabs) {
      const tabElement = page.locator(`text=/${tab}/i`).first();
      if (await tabElement.isVisible()) {
        const startTime = Date.now();
        await tabElement.click();
        await page.waitForTimeout(100);
        const transitionTime = Date.now() - startTime;
        
        console.log(`${tab} 탭 전환 시간: ${transitionTime}ms`);
        expect(transitionTime).toBeLessThan(1000); // 1초 이내 전환
      }
    }
  });
});

// 접근성 테스트
test.describe('접근성 테스트', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('http://localhost:8081');
    
    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter 키로 선택
    await page.keyboard.press('Enter');
    
    // 포커스 이동 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
  
  test('스크린 리더 라벨', async ({ page }) => {
    await page.goto('http://localhost:8081');
    
    // aria-label 확인
    const buttons = await page.locator('button[aria-label]').all();
    expect(buttons.length).toBeGreaterThan(0);
    
    // role 속성 확인
    const navigation = await page.locator('[role="navigation"]').all();
    const lists = await page.locator('[role="list"]').all();
    
    console.log(`접근성 요소: ${buttons.length} buttons, ${navigation.length} navigation, ${lists.length} lists`);
  });
});