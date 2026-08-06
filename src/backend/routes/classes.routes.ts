import express from 'express';
import { pool } from '../db';
import { authenticateToken, requireRole } from '../middleware';

const router = express.Router();

// GET all classes (with student count and department name)
router.get('/api/classes', authenticateToken, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT c.*, d.name as department_name,
          (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id) as student_count
        FROM classes c
        LEFT JOIN departments d ON c.department_id = d.id
        ORDER BY c.id DESC
      `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải danh sách lớp học.' });
  }
});

// POST create class
router.post('/api/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { department_id, class_code, class_name, course_year } = req.body;
    if (!department_id || !class_code || !class_name) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
    }

    const now = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const [result] = await pool.query(
      'INSERT INTO classes (department_id, class_code, class_name, course_year, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [department_id, class_code, class_name, course_year || '', 'Active', now, now],
    );

    const newId = (result as any).insertId;
    const [deptRows] = await pool.query('SELECT name FROM departments WHERE id = ?', [
      department_id,
    ]);
    const deptName = (deptRows as any[]).length > 0 ? (deptRows as any[])[0].name : '';

    res.status(201).json({
      id: newId,
      department_id,
      class_code,
      class_name,
      course_year: course_year || '',
      status: 'Active',
      student_count: 0,
      department_name: deptName,
      created_at: now,
      updated_at: now,
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Mã lớp đã tồn tại.' });
    }
    res.status(500).json({ error: 'Không thể tạo lớp học mới.' });
  }
});

// PUT update class
router.put('/api/classes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, class_code, class_name, course_year, status } = req.body;
    const now = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    await pool.query(
      'UPDATE classes SET department_id = ?, class_code = ?, class_name = ?, course_year = ?, status = ?, updated_at = ? WHERE id = ?',
      [department_id, class_code, class_name, course_year || '', status || 'Active', now, id],
    );

    const [deptRows] = await pool.query('SELECT name FROM departments WHERE id = ?', [
      department_id,
    ]);
    const deptName = (deptRows as any[]).length > 0 ? (deptRows as any[])[0].name : '';
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE class_id = ?', [
      id,
    ]);
    const studentCount = (countRows as any[])[0]?.cnt || 0;

    res.json({
      id: Number(id),
      department_id,
      class_code,
      class_name,
      course_year,
      status: status || 'Active',
      updated_at: now,
      department_name: deptName,
      student_count: studentCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể cập nhật lớp học.' });
  }
});

// DELETE class
router.delete('/api/classes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    // Set class_id to null for users and exams assigned to this class
    await pool.query('UPDATE users SET class_id = NULL WHERE class_id = ?', [id]);
    await pool.query('UPDATE active_exams SET class_id = NULL WHERE class_id = ?', [id]);
    await pool.query('DELETE FROM classes WHERE id = ?', [id]);
    res.json({ message: 'Deleted class successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể xóa lớp học.' });
  }
});

export default router;
