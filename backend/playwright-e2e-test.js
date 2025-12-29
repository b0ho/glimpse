// Playwright E2E Test for Spring Boot Server Integration
// This test verifies that the Spring Boot backend server is working correctly
// and can replace the NestJS server for the mobile app

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function runE2ETests() {
    console.log('🚀 Starting E2E Tests for Spring Boot Server Integration\n');
    
    const testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Health Check without auth
    console.log('📝 Test 1: Health check without authentication');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.server === 'backend' && data.devMode === false) {
            console.log('✅ PASSED: Health check returns correct response without auth');
            testResults.passed++;
            testResults.tests.push({ name: 'Health check without auth', status: 'passed' });
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.log('❌ FAILED: Health check without auth -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Health check without auth', status: 'failed', error: error.message });
    }
    
    // Test 2: Health Check with dev auth
    console.log('\n📝 Test 2: Health check with dev authentication');
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            headers: { 'x-dev-auth': 'true' }
        });
        const data = await response.json();
        
        if (data.status === 'ok' && data.devMode === true) {
            console.log('✅ PASSED: Dev mode correctly detected with x-dev-auth header');
            testResults.passed++;
            testResults.tests.push({ name: 'Health check with dev auth', status: 'passed' });
        } else {
            throw new Error('Dev mode not detected');
        }
    } catch (error) {
        console.log('❌ FAILED: Health check with dev auth -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Health check with dev auth', status: 'failed', error: error.message });
    }
    
    // Test 3: Groups endpoint without auth (should fail)
    console.log('\n📝 Test 3: Groups endpoint without authentication (should be unauthorized)');
    try {
        const response = await fetch(`${API_BASE_URL}/groups`);
        const data = await response.json();
        
        if (data.error === 'Unauthorized') {
            console.log('✅ PASSED: Groups endpoint correctly requires authentication');
            testResults.passed++;
            testResults.tests.push({ name: 'Groups endpoint auth required', status: 'passed' });
        } else {
            throw new Error('Endpoint did not require authentication');
        }
    } catch (error) {
        console.log('❌ FAILED: Groups auth check -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Groups endpoint auth required', status: 'failed', error: error.message });
    }
    
    // Test 4: Groups endpoint with dev auth
    console.log('\n📝 Test 4: Groups endpoint with dev authentication');
    try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            headers: { 'x-dev-auth': 'true' }
        });
        const data = await response.json();
        
        if (data.groups && Array.isArray(data.groups) && data.groups.length === 2) {
            const group1 = data.groups[0];
            if (group1.id === 'group-1' && group1.name === '서강대학교') {
                console.log('✅ PASSED: Groups endpoint returns correct test data');
                testResults.passed++;
                testResults.tests.push({ name: 'Groups endpoint with auth', status: 'passed' });
            } else {
                throw new Error('Invalid group data structure');
            }
        } else {
            throw new Error('Groups data not returned');
        }
    } catch (error) {
        console.log('❌ FAILED: Groups with auth -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Groups endpoint with auth', status: 'failed', error: error.message });
    }
    
    // Test 5: User profile endpoint
    console.log('\n📝 Test 5: User profile endpoint with dev authentication');
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'x-dev-auth': 'true' }
        });
        const data = await response.json();
        
        if (data.id === 'test-user-001' && data.nickname === '테스트 사용자') {
            console.log('✅ PASSED: User profile endpoint returns correct test user');
            testResults.passed++;
            testResults.tests.push({ name: 'User profile endpoint', status: 'passed' });
        } else {
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.log('❌ FAILED: User profile -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'User profile endpoint', status: 'failed', error: error.message });
    }
    
    // Test 6: Login endpoint
    console.log('\n📝 Test 6: Login endpoint (POST)');
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: '+821012345678',
                password: 'test123'
            })
        });
        const data = await response.json();
        
        if (data.accessToken && data.refreshToken && data.user) {
            console.log('✅ PASSED: Login endpoint returns tokens and user data');
            testResults.passed++;
            testResults.tests.push({ name: 'Login endpoint', status: 'passed' });
        } else {
            throw new Error('Invalid login response');
        }
    } catch (error) {
        console.log('❌ FAILED: Login endpoint -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Login endpoint', status: 'failed', error: error.message });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 E2E TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📝 Total: ${testResults.passed + testResults.failed}`);
    console.log('='.repeat(60));
    
    if (testResults.failed === 0) {
        console.log('\n🎉 SUCCESS: All E2E tests passed! Spring Boot server is ready.');
        console.log('✨ The mobile app can now connect to the Spring Boot server on port 3001.');
    } else {
        console.log('\n⚠️  WARNING: Some tests failed. Please review the errors above.');
        console.log('\nFailed tests:');
        testResults.tests
            .filter(t => t.status === 'failed')
            .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
    
    return testResults;
}

// Run the tests
runE2ETests().catch(console.error);