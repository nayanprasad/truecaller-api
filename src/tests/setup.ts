// Set testing environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8081'; // Use a different port for testing
process.env.DATABASE_URL = 'postgresql://admin:password@localhost:5432/truecaller_test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use a different Redis DB for testing
process.env.REDIS_TTL = '3600';
process.env.REDIS_RATE_LIMIT_WINDOW = '60';
process.env.REDIS_RATE_LIMIT_MAX = '100';
process.env.SESSION_TTL = '2592000';

// Add global Jest timeout
jest.setTimeout(30000); // 30 seconds

// Here you can add global setup/teardown logic
beforeAll(async () => {
  // Global setup - will run once before all tests
  console.log('Starting test suite');
});

afterAll(async () => {
  // Global teardown - will run once after all tests
  console.log('Finished test suite');
});