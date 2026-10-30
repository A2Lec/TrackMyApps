process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
