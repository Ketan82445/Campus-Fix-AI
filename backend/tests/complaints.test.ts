import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

describe('Complaint Lifecycle & API Tests (/api/complaints)', () => {
  let studentToken: string;
  let createdComplaintId: string;

  beforeAll(async () => {
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@campusfix.local', password: 'Password123!' });
    studentToken = studentRes.body.data.token;
  });

  afterAll(async () => {
    if (createdComplaintId) {
      await prisma.complaint.deleteMany({ where: { id: createdComplaintId } });
    }
    await prisma.$disconnect();
  });

  it('should create a complaint with AI analysis and department assignment', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Ethernet cable broken in Library Room 4',
        description: 'Ethernet cable is snapped and internet access is unavailable in Library Room 4.',
        location: 'Library 2nd Floor Room 4'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaintNumber).toBeDefined();
    expect(res.body.data.category).toBeDefined();

    createdComplaintId = res.body.data.id;
  });

  it('should fetch list of student complaints with pagination', async () => {
    const res = await request(app)
      .get('/api/complaints?page=1&limit=10')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.page).toBe(1);
  });

  it('should fetch single complaint details with status history and AI prediction', async () => {
    const res = await request(app)
      .get(`/api/complaints/${createdComplaintId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdComplaintId);
    expect(Array.isArray(res.body.data.statusHistory)).toBe(true);
  });
});
