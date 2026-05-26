// Set up test environment variables before any module imports
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-16-chars';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.MOCK_ANTHROPIC = 'true';
