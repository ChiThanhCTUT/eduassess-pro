import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { JWT_SECRET } from './config';

export interface AuthRequest extends Request {
  user?: any;
}

export function generateToken(
  user: { email: string; role: string; name: string; studentId: string; class_id?: number | null },
  expiresInMs: number = 30 * 60 * 1000,
): string {
  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name,
    studentId: user.studentId,
    class_id: user.class_id || null,
    exp: Date.now() + expiresInMs, // Mặc định 30 phút
  });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;
    const parsed = JSON.parse(payload);
    if (Date.now() > parsed.exp) return null; // Đã hết hạn
    return parsed;
  } catch (e) {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Ký tự Bearer TOKEN
  if (!token) {
    res.status(401).json({ error: 'Chưa cung cấp token xác thực.' });
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  // Đồng bộ hóa trạng thái và vai trò với Cơ sở dữ liệu
  try {
    const [rows] = await pool.query('SELECT status, role FROM users WHERE email = ?', [user.email]);
    if ((rows as any[]).length === 0) {
      res.status(403).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }
    const dbUser = (rows as any[])[0];
    if (dbUser.status === 'Suspended') {
      res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
      return;
    }
    user.role = dbUser.role; // Cập nhật linh hoạt vai trò mới nhất
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xác thực đồng bộ trạng thái.' });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Chưa xác thực.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
      return;
    }
    next();
  };
}

export function normalizeRole(dbRole: string): 'student' | 'teacher' | 'admin' {
  if (!dbRole) return 'student';
  const r = dbRole.toLowerCase().trim();
  if (r === 'lecturer' || r === 'teacher') return 'teacher';
  if (r === 'admin') return 'admin';
  return 'student';
}
