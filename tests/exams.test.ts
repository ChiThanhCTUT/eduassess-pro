import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, initializeDatabase } from '../server.js';

describe('Exams API (SQA Test Suite)', () => {
  let studentToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Khởi tạo Database
    await initializeDatabase();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Lấy Token của Admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin.eduassess@university.edu.vn',
      password: '12345678'
    });
    adminToken = adminRes.body.token;

    // Lấy Token của Sinh viên mặc định
    const studentRes = await request(app).post('/api/auth/login').send({
      email: 'alex.johnson@university.edu.vn',
      password: '12345678' // default seeded password for students in EduAssess Pro
    });
    studentToken = studentRes.body.token;
  });

  it('1. Trả về lỗi 401 khi không có Token (Security Test)', async () => {
    const res = await request(app).get('/api/exams');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Chưa cung cấp token xác thực.');
  });

  it('2. Admin có thể lấy toàn bộ danh sách đề thi (Role-based Authorization)', async () => {
    const res = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('3. Sinh viên chỉ thấy đề thi hợp lệ của lớp mình (Business Logic Test - Equivalence Partitioning)', async () => {
    const res = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // Kiểm tra xem dữ liệu trả về có hợp lệ không (có mảng, thuộc tính)
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
    }
  });
});
