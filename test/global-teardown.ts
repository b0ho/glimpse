async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Any cleanup tasks here
  // For example: close database connections, clean up test files, etc.
  
  console.log('✅ Test cleanup complete');
}

export default globalTeardown;