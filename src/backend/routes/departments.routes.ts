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

// --- DEPARTMENT & SUBJECT CRUD ENDPOINTS ---

// GET all departments (with their subjects joined and teacher counts computed dynamically)
router.get('/api/departments', authenticateToken, async (_req, res) => {
  try {
    const [depts] = await pool.query('SELECT * FROM departments');
    const [subs] = await pool.query('SELECT * FROM subjects');

    // Calculate dynamic teacher count per department from users table
    const [teacherCounts] = await pool.query(`
        SELECT department, COUNT(*) as count 
        FROM users 
        WHERE role = 'teacher' 
        GROUP BY department
      `);
    const teacherMap: Record<string, number> = {};
    (teacherCounts as any[]).forEach(row => {
      if (row.department) {
        teacherMap[row.department.toLowerCase().trim()] = row.count;
      }
    });

    // Calculate dynamic question count per subject from questions table
    const [questionCounts] = await pool.query(`
        SELECT subject, COUNT(*) as count 
        FROM questions 
        GROUP BY subject
      `);
    const questionMap: Record<string, number> = {};
    (questionCounts as any[]).forEach(row => {
      if (row.subject) {
        questionMap[row.subject.toLowerCase().trim()] = row.count;
      }
    });

    const mapped = (depts as any[]).map(d => {
      const deptNameNormalized = d.name.toLowerCase().trim();
      const deptSubjects = (subs as any[])
        .filter(s => s.deptId === d.id)
        .map(s => {
          const subNameNormalized = s.name.toLowerCase().trim();
          return {
            ...s,
            questionCount: questionMap[subNameNormalized] || 0,
          };
        });
      return {
        ...d,
        teacherCount: teacherMap[deptNameNormalized] || 0,
        subjects: deptSubjects,
      };
    });

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải danh sách khoa.' });
  }
});

// GET all subjects
router.get('/api/subjects', authenticateToken, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects');
    // Calculate dynamic question count per subject
    const [questionCounts] = await pool.query(`
        SELECT subject, COUNT(*) as count 
        FROM questions 
        GROUP BY subject
      `);
    const questionMap: Record<string, number> = {};
    (questionCounts as any[]).forEach(row => {
      if (row.subject) {
        questionMap[row.subject.toLowerCase().trim()] = row.count;
      }
    });

    const mapped = (rows as any[]).map(s => ({
      ...s,
      questionCount: questionMap[s.name.toLowerCase().trim()] || 0,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải danh sách bộ môn.' });
  }
});

// POST create department
router.post('/api/departments', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id, name, head, teacherCount } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Thiếu mã khoa hoặc tên khoa.' });
    }

    await pool.query('INSERT INTO departments (id, name, head, teacherCount) VALUES (?, ?, ?, ?)', [
      id,
      name,
      head || 'Chưa phân công',
      teacherCount || 0,
    ]);

    res.status(201).json({
      id,
      name,
      head: head || 'Chưa phân công',
      teacherCount: teacherCount || 0,
      subjects: [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tạo khoa mới.' });
  }
});

// DELETE department
router.delete('/api/departments/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: 'Deleted department successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể xóa khoa.' });
  }
});

// POST create subject
router.post('/api/subjects', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code, name, credits, questionCount, deptId } = req.body;
    if (!code || !name || !credits || !deptId) {
      return res.status(400).json({ error: 'Thiếu thông tin môn học bắt buộc.' });
    }

    await pool.query(
      'INSERT INTO subjects (code, name, credits, questionCount, deptId) VALUES (?, ?, ?, ?, ?)',
      [code.toUpperCase(), name, credits, questionCount || 0, deptId],
    );

    res
      .status(201)
      .json({ code: code.toUpperCase(), name, credits, questionCount: questionCount || 0, deptId });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tạo môn học mới.' });
  }
});

// DELETE subject
router.delete('/api/subjects/:code', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code } = req.params;
    await pool.query('DELETE FROM subjects WHERE code = ?', [code]);
    res.json({ message: 'Deleted subject successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể xóa môn học.' });
  }
});

// PUT update department
router.put('/api/departments/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, head, teacherCount } = req.body;
    await pool.query('UPDATE departments SET name = ?, head = ?, teacherCount = ? WHERE id = ?', [
      name,
      head || 'Chưa phân công',
      teacherCount || 0,
      id,
    ]);
    res.json({ id, name, head: head || 'Chưa phân công', teacherCount: teacherCount || 0 });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể cập nhật khoa.' });
  }
});

// PUT update subject
router.put('/api/subjects/:code', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code } = req.params;
    const { name, credits, questionCount, deptId } = req.body;
    await pool.query(
      'UPDATE subjects SET name = ?, credits = ?, questionCount = ?, deptId = ? WHERE code = ?',
      [name, credits, questionCount || 0, deptId, code],
    );
    res.json({ code, name, credits, questionCount: questionCount || 0, deptId });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể cập nhật bộ môn.' });
  }
});



export default router;
