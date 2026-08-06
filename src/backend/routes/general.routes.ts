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

// --- CÁC ENDPOINT CHUNG ---

// GET lấy danh sách câu hỏi (kèm theo các bộ lọc nếu có)
router.get('/api/questions', authenticateToken, async (req: any, res) => {
  try {
    const { search, subject, difficulty, topic } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (content LIKE ? OR topic LIKE ? OR id LIKE ?)';
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike);
    }
    if (subject && subject !== 'all') {
      query += ' AND LOWER(subject) = LOWER(?)';
      params.push(subject);
    }
    if (difficulty && difficulty !== 'all') {
      query += ' AND LOWER(difficulty) = LOWER(?)';
      params.push(difficulty);
    }
    if (topic && topic !== 'all') {
      query += ' AND LOWER(topic) = LOWER(?)';
      params.push(topic);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    const parsed = (rows as any[]).map(row => {
      const item: any = {
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      };
      if (req.user && req.user.role === 'student') {
        delete item.correctAnswer;
      }
      return item;
    });
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Đã có lỗi xảy ra khi tải danh sách câu hỏi.' });
  }
});

// POST tạo mới câu hỏi
router.post(
  '/api/questions',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const q = req.body;
      await pool.query(
        'INSERT INTO questions (id, content, subject, difficulty, options, correctAnswer, topic, avgTime, errorRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          q.id,
          q.content,
          q.subject,
          q.difficulty,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.topic,
          q.avgTime,
          q.errorRate || 0,
        ],
      );
      res.status(201).json(q);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể thêm câu hỏi mới vào hệ thống.' });
    }
  },
);

// PUT cập nhật câu hỏi
router.put(
  '/api/questions/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const q = req.body;

      if (req.user.role === 'teacher') {
        const [qRows] = await pool.query('SELECT subject FROM questions WHERE id = ?', [id]);
        if ((qRows as any[]).length === 0)
          return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
        const oldSubject = (qRows as any[])[0].subject;

        const [oldValidSubs] = await pool.query(
          'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
          [oldSubject, req.user.department],
        );
        if ((oldValidSubs as any[]).length === 0) {
          return res.status(403).json({ error: 'Bạn không có quyền sửa câu hỏi thuộc khoa khác.' });
        }

        if (q.subject && q.subject !== oldSubject) {
          const [newValidSubs] = await pool.query(
            'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
            [q.subject, req.user.department],
          );
          if ((newValidSubs as any[]).length === 0) {
            return res
              .status(403)
              .json({ error: 'Bạn không được phép chuyển câu hỏi sang môn của khoa khác.' });
          }
        }
      }

      await pool.query(
        'UPDATE questions SET content = ?, subject = ?, difficulty = ?, options = ?, correctAnswer = ?, topic = ?, avgTime = ?, errorRate = ? WHERE id = ?',
        [
          q.content,
          q.subject,
          q.difficulty,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.topic,
          q.avgTime || '02:00',
          q.errorRate || 0,
          id,
        ],
      );
      res.json(q);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật câu hỏi.' });
    }
  },
);

// DELETE xóa câu hỏi
router.delete(
  '/api/questions/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req: any, res) => {
    try {
      const { id } = req.params;

      if (req.user.role === 'teacher') {
        const [qRows] = await pool.query('SELECT subject FROM questions WHERE id = ?', [id]);
        if ((qRows as any[]).length === 0)
          return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
        const subjectName = (qRows as any[])[0].subject;

        const [validSubs] = await pool.query(
          'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
          [subjectName, req.user.department],
        );
        if ((validSubs as any[]).length === 0) {
          return res.status(403).json({ error: 'Bạn không có quyền xóa câu hỏi thuộc khoa khác.' });
        }
      }

      await pool.query('DELETE FROM questions WHERE id = ?', [id]);
      res.json({ message: 'Question deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa câu hỏi.' });
    }
  },
);

// GET danh sách đề thi đang hoạt động (có bộ lọc, học sinh chỉ xem đề thi của lớp mình)
router.get('/api/exams', authenticateToken, async (req: any, res) => {
  try {
    const { search, subject, category } = req.query;
    let query =
      'SELECT e.*, c.class_name, c.class_code FROM active_exams e LEFT JOIN classes c ON e.class_id = c.id WHERE 1=1';
    const params: any[] = [];

    // Sinh viên chỉ xem được các đề thi dành cho lớp của mình hoặc không chỉ định lớp, VÀ các đề thi chưa nộp
    if (req.user.role === 'student') {
      if (req.user.class_id) {
        query += ' AND (e.class_id = ? OR e.class_id IS NULL)';
        params.push(req.user.class_id);
      }
      query +=
        ' AND e.id NOT IN (SELECT examId FROM exam_history WHERE userEmail = ? AND examId IS NOT NULL)';
      params.push(req.user.email);
    }

    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.id LIKE ?)';
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike);
    }
    if (subject && subject !== 'all') {
      query += ' AND e.subject = ?';
      params.push(subject);
    }
    if (category && category !== 'all') {
      query += ' AND e.category = ?';
      params.push(category);
    }

    query += ' ORDER BY e.id DESC';

    const [rows] = await pool.query(query, params);
    const parsed = (rows as any[]).map(row => ({
      ...row,
      difficultyDistribution:
        typeof row.difficultyDistribution === 'string'
          ? JSON.parse(row.difficultyDistribution)
          : row.difficultyDistribution,
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Đã có lỗi xảy ra khi tải danh sách đề thi.' });
  }
});

// POST tạo mới đề thi - kiểm tra số lượng câu hỏi và bốc ngẫu nhiên câu hỏi theo cấu hình độ khó
router.post('/api/exams', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const exam = req.body;
    const { title, subject, duration, questionCount, class_id, difficultyDistribution } = exam;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề đề thi không được để trống.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Môn học không được để trống.' });
    }
    if (typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ error: 'Thời lượng thi phải là số lớn hơn 0.' });
    }
    if (typeof questionCount !== 'number' || questionCount <= 0) {
      return res.status(400).json({ error: 'Số lượng câu hỏi phải lớn hơn 0.' });
    }

    // Xác thực: kiểm tra tổng số lượng câu hỏi có sẵn cho môn học này
    const [availableRows] = await pool.query(
      'SELECT id, difficulty FROM questions WHERE subject = ?',
      [subject],
    );
    const available = availableRows as any[];

    if (available.length < questionCount) {
      return res.status(400).json({
        error: `Ngân hàng câu hỏi môn "${subject}" chỉ có ${available.length} câu, không đủ ${questionCount} câu yêu cầu.`,
      });
    }

    let selected: any[] = [];
    if (
      difficultyDistribution &&
      (difficultyDistribution.easy || difficultyDistribution.medium || difficultyDistribution.hard)
    ) {
      const easyPool = available.filter(
        q =>
          (q.difficulty || '').toLowerCase() === 'dễ' ||
          (q.difficulty || '').toLowerCase() === 'easy',
      );
      const mediumPool = available.filter(
        q =>
          (q.difficulty || '').toLowerCase() === 'trung bình' ||
          (q.difficulty || '').toLowerCase() === 'medium',
      );
      const hardPool = available.filter(
        q =>
          (q.difficulty || '').toLowerCase() === 'khó' ||
          (q.difficulty || '').toLowerCase() === 'hard',
      );

      const easyTarget = Math.round((questionCount * (difficultyDistribution.easy || 0)) / 100);
      const mediumTarget = Math.round((questionCount * (difficultyDistribution.medium || 0)) / 100);
      let hardTarget = questionCount - easyTarget - mediumTarget;
      if (hardTarget < 0) hardTarget = 0;

      const pickRandom = (pool: any[], count: number) => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      };

      const pickedEasy = pickRandom(easyPool, easyTarget);
      const pickedMedium = pickRandom(mediumPool, mediumTarget);
      const pickedHard = pickRandom(hardPool, hardTarget);

      const pickedSet = new Set([...pickedEasy, ...pickedMedium, ...pickedHard].map(q => q.id));
      selected = [...pickedEasy, ...pickedMedium, ...pickedHard];

      // Nếu thiếu số lượng câu hỏi do làm tròn hoặc do kho thiếu câu hỏi độ khó tương ứng, lấy bù ngẫu nhiên từ kho còn lại
      if (selected.length < questionCount) {
        const remaining = available
          .filter(q => !pickedSet.has(q.id))
          .sort(() => Math.random() - 0.5);
        selected = [...selected, ...remaining.slice(0, questionCount - selected.length)];
      }
    } else {
      const shuffled = available.sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, questionCount);
    }

    const questionIds = JSON.stringify(selected.map((q: any) => q.id));
    const distJson = JSON.stringify(difficultyDistribution || null);

    await pool.query(
      'INSERT INTO active_exams (id, title, subject, duration, questionCount, description, iconName, category, class_id, questionIds, difficultyDistribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        exam.id,
        exam.title,
        exam.subject,
        exam.duration,
        exam.questionCount,
        exam.description,
        exam.iconName,
        exam.category,
        class_id || null,
        questionIds,
        distJson,
      ],
    );
    res
      .status(201)
      .json({ ...exam, questionIds, class_id: class_id || null, difficultyDistribution });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể xuất bản đề thi mới.' });
  }
});

// PUT cập nhật đề thi
router.put(
  '/api/exams/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const exam = req.body;
      const distJson = JSON.stringify(exam.difficultyDistribution || null);
      await pool.query(
        'UPDATE active_exams SET title = ?, subject = ?, duration = ?, questionCount = ?, description = ?, iconName = ?, category = ?, class_id = ?, difficultyDistribution = ? WHERE id = ?',
        [
          exam.title,
          exam.subject,
          exam.duration,
          exam.questionCount,
          exam.description,
          exam.iconName,
          exam.category,
          exam.class_id || null,
          distJson,
          id,
        ],
      );
      res.json(exam);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật đề thi.' });
    }
  },
);

// DELETE xóa đề thi
router.delete(
  '/api/exams/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM active_exams WHERE id = ?', [id]);
      res.json({ message: 'Exam deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa đề thi.' });
    }
  },
);

// GET lấy lịch sử làm bài thi (Lọc động: sinh viên lấy của chính mình; giảng viên/admin lấy toàn bộ)
router.get('/api/history', authenticateToken, async (req: any, res) => {
  try {
    let rows;
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query(
        'SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email WHERE h.userEmail = ? ORDER BY h.id DESC',
        [req.user.email],
      );
      rows = studentRows;
    } else {
      const [allRows] = await pool.query(
        'SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email ORDER BY h.id DESC',
      );
      rows = allRows;
    }
    const parsed = (rows as any[]).map(row => ({
      ...row,
      questionsDetail:
        typeof row.questionsDetail === 'string'
          ? JSON.parse(row.questionsDetail)
          : row.questionsDetail,
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể tải lịch sử kiểm tra.' });
  }
});

// POST tạo mới lịch sử thi (Gắn kết an toàn userEmail từ Token đã được xác thực)
router.post('/api/history', authenticateToken, async (req: any, res) => {
  try {
    const h = req.body;
    const userEmail = req.user.email;

    let correctCount = 0;
    let verifiedDetails = h.questionsDetail;
    let finalScoreStr = h.score;
    let finalResultStr = h.result;

    if (!h.examId) {
      return res.status(400).json({ error: 'Mã đề thi không hợp lệ.' });
    }

    // Ngăn chặn nộp bài trùng lặp
    if (req.user.role === 'student') {
      const [existing] = await pool.query(
        'SELECT id FROM exam_history WHERE userEmail = ? AND examId = ?',
        [userEmail, h.examId],
      );
      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'Bạn đã hoàn thành bài thi này trước đó.' });
      }
    }

    const [exams] = await pool.query(
      'SELECT class_id, questionIds FROM active_exams WHERE id = ?',
      [h.examId],
    );
    const activeExamRows = exams as any[];
    if (activeExamRows.length === 0) {
      return res.status(404).json({ error: 'Đề thi không tồn tại hoặc đã bị xóa.' });
    }

    const activeExam = activeExamRows[0];
    if (
      activeExam.class_id &&
      req.user.role === 'student' &&
      activeExam.class_id !== req.user.class_id
    ) {
      return res.status(403).json({ error: 'Bạn không có quyền nộp bài cho đề thi của lớp khác.' });
    }

    let totalExamQuestions = 0;
    try {
      const parsedQIds = JSON.parse(activeExam.questionIds || '[]');
      totalExamQuestions = Array.isArray(parsedQIds) ? parsedQIds.length : 0;
    } catch (e) {
      totalExamQuestions = Array.isArray(h.questionsDetail) ? h.questionsDetail.length : 0;
    }

    if (totalExamQuestions === 0) {
      totalExamQuestions = Array.isArray(h.questionsDetail) ? h.questionsDetail.length : 1;
    }

    if (Array.isArray(h.questionsDetail) && h.questionsDetail.length > 0) {
      const [dbQuestions] = await pool.query(
        'SELECT id, content, options, correctAnswer FROM questions',
      );
      const qMapById = new Map((dbQuestions as any[]).map(q => [q.id, q]));
      const qMapByContent = new Map((dbQuestions as any[]).map(q => [q.content, q]));

      verifiedDetails = h.questionsDetail.map((item: any) => {
        const qObj =
          (item.questionId && qMapById.get(item.questionId)) ||
          qMapByContent.get(item.questionText);
        if (qObj) {
          const opts =
            typeof qObj.options === 'string' ? JSON.parse(qObj.options) : qObj.options || [];
          const correctIdx = Number(qObj.correctAnswer);
          const userOptIdx =
            item.selectedOptionIndex !== undefined ? Number(item.selectedOptionIndex) : undefined;
          const isCorrect = userOptIdx !== undefined && userOptIdx === correctIdx;
          if (isCorrect) correctCount++;

          return {
            ...item,
            userAnswer:
              userOptIdx !== undefined && opts[userOptIdx] ? opts[userOptIdx] : item.userAnswer,
            correctAnswer: opts[correctIdx] || item.correctAnswer,
            isCorrect,
          };
        }
        return { ...item, isCorrect: false };
      });

      // Dùng tổng số câu hỏi gốc (totalExamQuestions) thay vì verifiedDetails.length để tránh việc thí sinh chỉ nộp 1 câu đúng được 10 điểm
      const finalScoreNum = (correctCount / totalExamQuestions) * 10;
      finalScoreStr = `${finalScoreNum.toFixed(1)}/10`;
      const pass = finalScoreNum >= 5;
      finalResultStr = pass ? 'Đạt' : 'Không đạt';
    }

    await pool.query(
      'INSERT INTO exam_history (id, title, department, userEmail, submitDate, score, result, iconName, questionsDetail, examId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        h.id,
        h.title,
        h.department,
        userEmail,
        h.submitDate,
        finalScoreStr,
        finalResultStr,
        h.iconName,
        JSON.stringify(verifiedDetails),
        h.examId,
      ],
    );
    res.status(201).json({
      ...h,
      score: finalScoreStr,
      result: finalResultStr,
      questionsDetail: verifiedDetails,
      userEmail,
      examId: h.examId,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Không thể nộp kết quả thi.' });
  }
});

// DELETE xóa lịch sử thi
router.delete(
  '/api/history/:id',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM exam_history WHERE id = ?', [id]);
      res.json({ message: 'Đã xóa lịch sử bài thi.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa lịch sử bài thi.' });
    }
  },
);

// POST chấm lại bài thi dựa trên đáp án mới nhất từ ngân hàng câu hỏi
router.post(
  '/api/history/:id/regrade',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const [historyRows] = await pool.query(
        'SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email WHERE h.id = ?',
        [id],
      );
      if ((historyRows as any[]).length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy bài thi cần chấm lại.' });
      }
      const item = (historyRows as any[])[0];
      const details =
        typeof item.questionsDetail === 'string'
          ? JSON.parse(item.questionsDetail)
          : item.questionsDetail || [];

      if (!Array.isArray(details) || details.length === 0) {
        return res
          .status(400)
          .json({ error: 'Bài thi không có chi tiết câu trả lời để chấm lại.' });
      }

      const [dbQuestions] = await pool.query(
        'SELECT id, content, options, correctAnswer FROM questions',
      );
      const qMapById = new Map((dbQuestions as any[]).map(q => [q.id, q]));
      const qMapByContent = new Map((dbQuestions as any[]).map(q => [q.content, q]));

      let correctCount = 0;
      const regradedDetails = details.map((d: any) => {
        const qObj =
          (d.questionId && qMapById.get(d.questionId)) || qMapByContent.get(d.questionText);
        if (qObj) {
          const opts =
            typeof qObj.options === 'string' ? JSON.parse(qObj.options) : qObj.options || [];
          const correctIdx = Number(qObj.correctAnswer);
          const userOptIdx =
            d.selectedOptionIndex !== undefined ? Number(d.selectedOptionIndex) : undefined;
          const isCorrect = userOptIdx !== undefined && userOptIdx === correctIdx;
          if (isCorrect) correctCount++;

          return {
            ...d,
            userAnswer:
              userOptIdx !== undefined && opts[userOptIdx] ? opts[userOptIdx] : d.userAnswer,
            correctAnswer: opts[correctIdx] || d.correctAnswer,
            isCorrect,
          };
        }
        if (d.isCorrect) correctCount++;
        return d;
      });

      const finalScoreNum = (correctCount / regradedDetails.length) * 10;
      const finalScoreStr = `${finalScoreNum.toFixed(1)}/10`;
      const pass = finalScoreNum >= 5;
      const finalResultStr = pass ? 'Đạt' : 'Không đạt';

      await pool.query(
        'UPDATE exam_history SET score = ?, result = ?, questionsDetail = ? WHERE id = ?',
        [finalScoreStr, finalResultStr, JSON.stringify(regradedDetails), id],
      );

      res.json({
        ...item,
        score: finalScoreStr,
        result: finalResultStr,
        questionsDetail: regradedDetails,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi chấm lại bài thi.' });
    }
  },
);



export default router;
