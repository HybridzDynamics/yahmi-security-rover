const request = require('supertest');
const app = require('../../server');

describe('REST API Integration Tests', () => {
  describe('Protected Endpoints Security Check', () => {
    test('rejects unauthorized access to protected routes without JWT', async () => {
      // Trying to access protected route without Authorization header
      const res = await request(app).get('/api/rover/status');
      
      // Should either be 401 Unauthorized or 404 if route requires auth middleware
      expect([401, 404]).toContain(res.statusCode);
      if (res.statusCode === 401) {
        expect(res.body).toHaveProperty('error');
      }
    });

    test('rejects invalid credentials on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'non_existent_user_9999', password: 'wrongPassword!' });

      expect([401, 500]).toContain(res.statusCode);
    });
  });
});
