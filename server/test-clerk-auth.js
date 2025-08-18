#!/usr/bin/env node

/**
 * Clerk 인증 테스트 스크립트
 * Clerk API를 사용하여 사용자 생성 및 인증 테스트
 */

const CLERK_SECRET_KEY = 'sk_test_ahquE3eARWKYofKL7BQoMLfHl7474tiTuMSm1twG4C';
const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testClerkAuth() {
  console.log('====================================');
  console.log('   Clerk 인증 통합 테스트');
  console.log('====================================\n');

  try {
    // 1. Clerk API를 사용하여 테스트 사용자 생성
    console.log('1. Clerk 테스트 사용자 생성 시도...');
    
    const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: [`test_${Date.now()}@example.com`],
        first_name: 'Test',
        last_name: 'User',
        password: 'Glimpse#2025$Secure!',
        skip_password_requirement: false,
        skip_password_checks: false
      })
    });

    if (!clerkResponse.ok) {
      const errorText = await clerkResponse.text();
      console.log('❌ Clerk 사용자 생성 실패:', clerkResponse.status);
      console.log('응답:', errorText);
      
      // Clerk 연결 테스트
      console.log('\n2. Clerk API 연결 테스트...');
      const testResponse = await fetch('https://api.clerk.com/v1/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ Clerk API 연결 성공');
        const data = await testResponse.json();
        console.log(`현재 사용자 수: ${data.total_count || 0}명`);
      } else {
        console.log('❌ Clerk API 연결 실패:', testResponse.status);
      }
    } else {
      const userData = await clerkResponse.json();
      console.log('✅ Clerk 사용자 생성 성공:', userData.id);
      
      // 2. 로컬 서버 API 테스트
      console.log('\n3. 로컬 서버 인증 API 테스트...');
      
      // 회원가입 테스트
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true'
        },
        body: JSON.stringify({
          phoneNumber: `+8210${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          nickname: `테스트유저${Date.now()}`,
          age: 25,
          gender: 'MALE'
        })
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('✅ 회원가입 API 성공:', registerData);
      } else {
        console.log('❌ 회원가입 API 실패:', registerResponse.status);
        const errorText = await registerResponse.text();
        console.log('에러:', errorText);
      }
    }
    
    // 3. 현재 인증 설정 확인
    console.log('\n4. 현재 인증 설정 확인...');
    
    // JWT 인증 테스트
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'x-dev-auth': 'true'
      }
    });
    
    console.log(`JWT 인증 상태: ${meResponse.status === 200 ? '✅ 활성화' : '❌ 비활성화'} (${meResponse.status})`);
    
    // 서버 헬스체크
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('서버 상태:', healthData.status === 'ok' ? '✅ 정상' : '❌ 오류');
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error.message);
  }
  
  console.log('\n====================================');
  console.log('   테스트 완료');
  console.log('====================================');
}

// 스크립트 실행
testClerkAuth().catch(console.error);