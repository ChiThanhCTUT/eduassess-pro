import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, initializeDatabase } from '../server.js';

describe('Authentication API (SQA Test Suite)', () => {
  beforeAll(async () => {
    // Khởi tạo Database trước khi chạy test để có dữ liệu thật
    await initializeDatabase();
    // Đợi 1 giây để đảm bảo pool sẵn sàng (trong môi trường thực tế)
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('1. Đăng nhập thành công với tài khoản Admin hợp lệ (Happy Path)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.eduassess@university.edu.vn',
        password: '12345678'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đăng nhập thành công.');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  it('2. Từ chối đăng nhập khi sai mật khẩu (Negative Test - Boundary)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.eduassess@university.edu.vn',
        password: 'wrongpassword123'
      });
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email hoặc mật khẩu không chính xác.');
  });

  it('3. Từ chối đăng nhập khi thiếu trường email (Validation Test)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'admin'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Vui lòng cung cấp email và mật khẩu.');
  });
});
