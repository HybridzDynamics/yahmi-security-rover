const request = require('supertest');
const app = require('../../server');

describe('System Health & Observability Endpoints', () => {
  test('GET /health returns 200 with system metadata', async () => {
    const response = await request(app).get('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'yahmi-security-rover');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database');
  });

  test('GET /api/health redirects to /health', async () => {
    const response = await request(app).get('/api/health');
    expect([301, 302]).toContain(response.statusCode);
  });

  test('GET /metrics returns 200 with runtime performance metrics', async () => {
    const response = await request(app).get('/metrics');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memoryUsage');
    expect(response.body.memoryUsage).toHaveProperty('rss');
    expect(response.body.memoryUsage).toHaveProperty('heapUsed');
  });

  test('GET /non-existent-endpoint returns 404', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
});
