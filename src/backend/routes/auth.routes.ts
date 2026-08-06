import express from 'express';
import { pool } from '../db';
import { authenticateToken, requireRole, generateToken, normalizeRole } from '../middleware';
import bcrypt from 'bcrypt';
import crypto from 'crypto';


function legacyHashPassword(password: string, email: string): string {
  const systemSalt = 'EduAssessSystemSalt2026#';
  return crypto
    .createHash('sha256')
    .update(password + email.toLowerCase().trim() + systemSalt)
    .digest('hex');
}

async function hashPasswordAsync(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}


const router = express.Router();

// --- CÁC ENDPOINT LIÊN QUAN ĐẾN XÁC THỰC (AUTHENTICATION) ---

const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const loginRateLimiter = (req: any, res: any, next: any) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now > record.resetTime) {
      loginAttempts.set(ip, { count: 0, resetTime: now + 15 * 60 * 1000 });
      return next();
    }
    if (record.count >= 5) {
      return res
        .status(429)
        .json({ error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' });
    }
  } else {
    loginAttempts.set(ip, { count: 0, resetTime: now + 15 * 60 * 1000 });
  }
  next();
};

// POST đăng nhập (login)
router.post('/api/auth/login', loginRateLimiter, async (req: any, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    const [users] = await pool.query(
      'SELECT name, role, studentId, status, class_id, password FROM users WHERE email = ?',
      [email],
    );

    if ((users as any[]).length === 0) {
      const record = loginAttempts.get(ip);
      if (record) record.count++;
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = (users as any[])[0];

    let isValid = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      const hashed = legacyHashPassword(password, email);
      isValid = hashed === user.password;
      if (isValid) {
        const newHash = await hashPasswordAsync(password);
        await pool.query('UPDATE users SET password = ? WHERE email = ?', [newHash, email]);
      }
    }

    if (!isValid) {
      const record = loginAttempts.get(ip);
      if (record) record.count++;
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    loginAttempts.delete(ip);

    // Kiểm tra xem tài khoản có bị khóa hay không
    if (user.status === 'Suspended') {
      return res
        .status(403)
        .json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    const tokenUser = {
      email,
      role: user.role,
      name: user.name,
      studentId: user.studentId || '',
      class_id: user.class_id || null,
    };
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 ngày

    await pool.query('INSERT INTO refresh_tokens (token, email, expiresAt) VALUES (?, ?, ?)', [
      refreshToken,
      email,
      refreshExpiresAt,
    ]);

    res.json({
      message: 'Đăng nhập thành công.',
      token: generateToken(tokenUser), // Mặc định 30 phút
      refreshToken,
      user: {
        email,
        name: user.name,
        role: normalizeRole(user.role),
        studentId: user.studentId,
        class_id: user.class_id || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi đăng nhập hệ thống.' });
  }
});

// POST làm mới token (refresh token)
router.post('/api/auth/refresh', async (req: any, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Không tìm thấy refresh token.' });
    }

    const [rows] = await pool.query('SELECT email, expiresAt FROM refresh_tokens WHERE token = ?', [
      refreshToken,
    ]);
    if ((rows as any[]).length === 0) {
      return res.status(403).json({ error: 'Refresh token không hợp lệ.' });
    }

    const tokenData = (rows as any[])[0];
    if (Date.now() > tokenData.expiresAt) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      return res.status(403).json({ error: 'Refresh token đã hết hạn.' });
    }

    // Lấy thông tin user hiện tại
    const [userRows] = await pool.query(
      'SELECT name, role, studentId, status, class_id FROM users WHERE email = ?',
      [tokenData.email],
    );
    if ((userRows as any[]).length === 0) {
      return res.status(403).json({ error: 'Người dùng không tồn tại.' });
    }

    const user = (userRows as any[])[0];
    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa.' });
    }

    const tokenUser = {
      email: tokenData.email,
      role: user.role,
      name: user.name,
      studentId: user.studentId || '',
      class_id: user.class_id || null,
    };
    const newToken = generateToken(tokenUser); // Lại có 30 phút

    res.json({ token: newToken });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi cấp mới token.' });
  }
});

// POST đăng xuất (logout)
router.post('/api/auth/logout', async (req: any, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    res.json({ message: 'Đăng xuất thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Lỗi đăng xuất.' });
  }
});



export default router;
