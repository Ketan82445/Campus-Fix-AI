import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

jest.setTimeout(45000);

describe('Cluster 3 & 20: Duplicate Detection & Community Upvotes', () => {
  let student1Token: string;
  let student2Token: string;
  let adminToken: string;
  let primaryComplaintId: string;
  let duplicateComplaintId: string;

  beforeAll(async () => {
    // Login Student 1
    const s1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@campusfix.local', password: 'Password123!' });
    student1Token = s1Res.body.data.token;

    // Login Student 2
    const s2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student2@campusfix.local', password: 'Password123!' });
    student2Token = s2Res.body.data.token;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campusfix.local', password: 'Password123!' });
    adminToken = adminRes.body.data.token;

    // Create a primary complaint for testing
    const primaryRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        title: 'Projector lamp flickering and dying in Computer Lab 3',
        description: 'The overhead ceiling projector in Lab 3 flickers repeatedly and turns off after 5 minutes.',
        location: 'CS & IT Block, 2nd Floor, Lab 3',
        building: 'CS & IT Block',
        floor: '2nd Floor',
        room: 'Lab 3'
      });
    primaryComplaintId = primaryRes.body.data.id;
  });

  afterAll(async () => {
    if (duplicateComplaintId) {
      await prisma.complaint.deleteMany({ where: { id: duplicateComplaintId } });
    }
    if (primaryComplaintId) {
      await prisma.complaint.deleteMany({ where: { id: primaryComplaintId } });
    }
    await prisma.$disconnect();
  });

  it('1. should detect similar complaints in real time with similarity score and reasons', async () => {
    const res = await request(app)
      .post('/api/complaints/check-similar')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        title: 'Projector not working in Lab 3',
        description: 'Projector won\'t turn on in Lab 3 for practical session',
        location: 'CS & IT Block 2nd Floor Lab 3',
        building: 'CS & IT Block',
        room: 'Lab 3'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const match = res.body.data.find((c: any) => c.id === primaryComplaintId);
    expect(match).toBeDefined();
    expect(match.similarityScore).toBeGreaterThanOrEqual(40);
    expect(Array.isArray(match.matchReasons)).toBe(true);
  });

  it('2. should toggle community upvote ("I\'m Affected Too") for Student 2', async () => {
    // First upvote
    const upvoteRes = await request(app)
      .post(`/api/complaints/${primaryComplaintId}/upvote`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(upvoteRes.status).toBe(200);
    expect(upvoteRes.body.success).toBe(true);
    expect(upvoteRes.body.data.upvoted).toBe(true);
    expect(upvoteRes.body.data.upvoteCount).toBe(1);

    // Verify in detailed complaint fetch
    const getRes = await request(app)
      .get(`/api/complaints/${primaryComplaintId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.hasUpvoted).toBe(true);
    expect(getRes.body.data.upvoteCount).toBe(1);

    // Toggle off (remove confirmation)
    const toggleOffRes = await request(app)
      .post(`/api/complaints/${primaryComplaintId}/upvote`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(toggleOffRes.status).toBe(200);
    expect(toggleOffRes.body.data.upvoted).toBe(false);
    expect(toggleOffRes.body.data.upvoteCount).toBe(0);
  });

  it('3. should allow Admin to mark a duplicate ticket and link it to the primary ticket', async () => {
    // Create a second complaint that is a duplicate
    const secondComp = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        title: 'Lab 3 Projector completely broken',
        description: 'No display on wall projector in Lab 3.',
        location: 'CS & IT Block Lab 3'
      });
    duplicateComplaintId = secondComp.body.data.id;

    // Student should not be authorized to mark duplicate
    const studentForbidden = await request(app)
      .post(`/api/complaints/${duplicateComplaintId}/mark-duplicate`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ originalComplaintId: primaryComplaintId, reason: 'Duplicate' });
    expect(studentForbidden.status).toBe(403);

    // Admin marks duplicate
    const adminRes = await request(app)
      .post(`/api/complaints/${duplicateComplaintId}/mark-duplicate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        originalComplaintId: primaryComplaintId,
        reason: 'Identical issue reported for the same room projector.'
      });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.status).toBe('CLOSED');
    expect(adminRes.body.data.duplicateOfId).toBe(primaryComplaintId);

    // Fetch primary complaint and verify duplicate child is listed
    const primaryFetch = await request(app)
      .get(`/api/complaints/${primaryComplaintId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(primaryFetch.status).toBe(200);
    expect(primaryFetch.body.data.duplicates.some((d: any) => d.id === duplicateComplaintId)).toBe(true);
  });
});
