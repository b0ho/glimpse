describe('Mobile App', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should define environment variables', () => {
    // Test environment variable access
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
    expect(apiUrl).toContain('localhost');
  });
});