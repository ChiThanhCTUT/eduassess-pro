import express from 'express';
import { pool } from '../db';
import { authenticateToken, requireRole, generateToken, normalizeRole } from '../middleware';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

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

const loginRateLimiter = (req: any, res: any, next: any) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const record = loginAttempts.get(ip);
  if (record) {
    if (Date.now() < record.lockedUntil) {
      return res.status(429).json({ error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.' });
    }
    if (record.count >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000;
      record.count = 0;
      return res.status(429).json({ error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.' });
    }
  } else {
    loginAttempts.set(ip, { count: 0, lockedUntil: 0 });
  }
  next();
};

const router = express.Router();

// --- USER CRUD ENDPOINTS ---

// GET all users
router.get('/api/users', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { role, status, search, sortBy = 'id', sortOrder = 'DESC' } = req.query;
    let query =
      'SELECT u.id, u.email, u.name, u.role, u.studentId, u.department, u.status, u.createdAt, u.class_id, c.class_name, c.class_code FROM users u LEFT JOIN classes c ON u.class_id = c.id WHERE 1=1';
    const params: any[] = [];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR CAST(id AS CHAR) LIKE ?)';
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike);
    }

    const allowedCols = ['id', 'name', 'email', 'role', 'department', 'status', 'createdAt'];
    const finalSortBy = allowedCols.includes(sortBy as string) ? sortBy : 'id';
    const finalSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    const [rows] = await pool.query(query, params);
    const parsed = (rows as any[]).map(row => ({
      ...row,
      role: normalizeRole(row.role),
      class_name: row.class_name || null,
      class_code: row.class_code || null,
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải thông tin tài khoản.' });
  }
});

// POST create user
router.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, name, role, department, status, class_id } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (Email, Họ tên, Vai trò).' });
    }

    if (password && password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Mật khẩu phải có ít nhất 8 ký tự để đảm bảo an toàn.' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((exists as any[]).length > 0) {
      return res.status(400).json({ error: 'Email này đã được sử dụng.' });
    }

    // Auto-generate studentId for students based on class_code
    let studentId = '';
    if (normalizeRole(role) === 'student' && class_id) {
      const [classRows] = await pool.query('SELECT class_code FROM classes WHERE id = ?', [
        class_id,
      ]);
      if ((classRows as any[]).length > 0) {
        const classCode = (classRows as any[])[0].class_code;
        // Count existing students in this class to generate next number
        const [countRows] = await pool.query(
          'SELECT COUNT(*) as cnt FROM users WHERE class_id = ?',
          [class_id],
        );
        const nextNum = ((countRows as any[])[0].cnt || 0) + 1;
        studentId = `${classCode}-${String(nextNum).padStart(3, '0')}`;
      }
    }

    const finalPassword = password || `Edu@${crypto.randomBytes(4).toString('hex')}!`;
    const hashed = await hashPasswordAsync(finalPassword);
    const createdAt = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, role, studentId, department, status, createdAt, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email,
        hashed,
        name,
        role,
        studentId,
        department || 'Khoa CNTT',
        status || 'Active',
        createdAt,
        class_id || null,
      ],
    );

    const newId = (result as any).insertId;

    // Get class info for response
    let class_name = null;
    let class_code = null;
    if (class_id) {
      const [cls] = await pool.query('SELECT class_name, class_code FROM classes WHERE id = ?', [
        class_id,
      ]);
      if ((cls as any[]).length > 0) {
        class_name = (cls as any[])[0].class_name;
        class_code = (cls as any[])[0].class_code;
      }
    }

    res.status(201).json({
      id: newId,
      email,
      name,
      role: normalizeRole(role),
      studentId,
      department: department || 'Khoa CNTT',
      status: status || 'Active',
      createdAt,
      class_id: class_id || null,
      class_name,
      class_code,
      initialPassword: password ? undefined : finalPassword,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tạo tài khoản mới.' });
  }
});

// PUT update user
router.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, studentId, department, status, password, class_id } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
    }

    if (password && password.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu cập nhật phải có ít nhất 8 ký tự.' });
    }

    let query =
      'UPDATE users SET name = ?, email = ?, role = ?, studentId = ?, department = ?, status = ?, class_id = ?';
    const params = [
      name,
      email,
      role,
      studentId || '',
      department || 'Khoa CNTT',
      status || 'Active',
      class_id || null,
    ];

    if (password) {
      query += ', password = ?';
      params.push(await hashPasswordAsync(password));
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    let class_name = null;
    let class_code = null;
    if (class_id) {
      const [cls] = await pool.query('SELECT class_name, class_code FROM classes WHERE id = ?', [
        class_id,
      ]);
      if ((cls as any[]).length > 0) {
        class_name = (cls as any[])[0].class_name;
        class_code = (cls as any[])[0].class_code;
      }
    }

    res.json({
      id,
      name,
      email,
      role: normalizeRole(role),
      studentId: studentId || '',
      department: department || 'Khoa CNTT',
      status: status || 'Active',
      class_id: class_id || null,
      class_name,
      class_code,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể cập nhật tài khoản.' });
  }
});

// DELETE user
router.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể xóa tài khoản.' });
  }
});

// PUT toggle suspend status
router.put('/api/users/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Thiếu trạng thái.' });
    }
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ id, status });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể thay đổi trạng thái tài khoản.' });
  }
});



export default router;
