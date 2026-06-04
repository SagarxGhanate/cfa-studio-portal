const request = require('supertest');
const app = require('../index');

describe('Member Endpoints', () => {
  let authToken;
  let createdMemberId;

  // Login first to get auth token
  beforeAll(async () => {
    // Register a test user for member tests
    const email = `membertest${Date.now()}@cfastudio.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Member Tester', email, password: 'testpassword123' });

    authToken = res.body.data.token;
  });

  const testMember = {
    name: 'John Doe',
    phone: '9876543210',
    age: 25,
    location: 'Mumbai',
    society: 'Test Society',
    joiningDate: new Date().toISOString(),
    classType: 'GROUP',
    category: 'ADULTS',
    isActive: true,
  };

  // ─── Create Member ───
  describe('POST /api/members', () => {
    it('should create a new member', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMember);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(testMember.name);
      createdMemberId = res.body.data.id;
    });

    it('should reject member without required fields', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid classType', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testMember, classType: 'INVALID' });

      expect(res.status).toBe(400);
    });

    it('should reject without auth token', async () => {
      const res = await request(app)
        .post('/api/members')
        .send(testMember);

      expect(res.status).toBe(401);
    });
  });

  // ─── Get Members ───
  describe('GET /api/members', () => {
    it('should return a list of members', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('members');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.members)).toBe(true);
    });

    it('should support search query', async () => {
      const res = await request(app)
        .get('/api/members?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/members?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  // ─── Get Single Member ───
  describe('GET /api/members/:id', () => {
    it('should return a single member', async () => {
      const res = await request(app)
        .get(`/api/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdMemberId);
    });

    it('should return 404 for non-existent member', async () => {
      const res = await request(app)
        .get('/api/members/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Update Member ───
  describe('PUT /api/members/:id', () => {
    it('should update a member', async () => {
      const res = await request(app)
        .put(`/api/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'John Updated', age: 26 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John Updated');
      expect(res.body.data.age).toBe(26);
    });
  });

  // ─── Toggle Status ───
  describe('PATCH /api/members/:id/status', () => {
    it('should toggle member status', async () => {
      const res = await request(app)
        .patch(`/api/members/${createdMemberId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false); // Was true, now false
    });
  });

  // ─── Bulk Import ───
  describe('POST /api/members/bulk', () => {
    it('should import members in bulk', async () => {
      const members = [
        { name: 'Bulk 1', phone: '1111111111', age: 20, location: 'Delhi', joiningDate: new Date().toISOString(), classType: 'GROUP', category: 'ADULTS' },
        { name: 'Bulk 2', phone: '2222222222', age: 22, location: 'Delhi', joiningDate: new Date().toISOString(), classType: 'PERSONAL', category: 'KIDS' },
      ];

      const res = await request(app)
        .post('/api/members/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ members });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.created).toBe(2);
    });

    it('should skip invalid members in bulk import', async () => {
      const members = [
        { name: 'Valid', phone: '3333333333', age: 20, location: 'Delhi', joiningDate: new Date().toISOString(), classType: 'GROUP', category: 'ADULTS' },
        { name: '', phone: '', age: 0, location: '', joiningDate: '', classType: 'INVALID', category: 'INVALID' },
      ];

      const res = await request(app)
        .post('/api/members/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ members });

      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(1);
      expect(res.body.data.skipped).toBe(1);
    });
  });

  // ─── Societies ───
  describe('GET /api/members/societies', () => {
    it('should return unique societies', async () => {
      const res = await request(app)
        .get('/api/members/societies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Delete Member ───
  describe('DELETE /api/members/:id', () => {
    it('should delete a member', async () => {
      const res = await request(app)
        .delete(`/api/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted member', async () => {
      const res = await request(app)
        .get(`/api/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Delete All Members ───
  describe('DELETE /api/members/all', () => {
    it('should delete all members for admin', async () => {
      const res = await request(app)
        .delete('/api/members/all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
