import request from 'supertest';
import app from '../src/app';

describe('Role-Based Access Control (RBAC) Security Tests', () => {
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Login Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@campusfix.local', password: 'Password123!' });
    studentToken = studentRes.body.data.token;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campusfix.local', password: 'Password123!' });
    adminToken = adminRes.body.data.token;
  });

  it('should return 401 Unauthorized when requesting protected route without token', async () => {
    const res = await request(app).get('/api/analytics/overview');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 Forbidden when student attempts admin analytics endpoint', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow admin user to access admin analytics endpoint (200 OK)', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeDefined();
  });
});
