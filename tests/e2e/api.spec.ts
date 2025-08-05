import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  test('should return health status from API', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('should handle 404 for unknown API routes', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/v1/unknown-route');
    
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });

  test('should require authentication for protected routes', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/v1/users/profile');
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.message || data.error).toBeDefined();
  });
});