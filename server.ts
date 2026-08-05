import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initialQuestions, initialActiveExams, initialExamHistory } from './src/data';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

let pool: any;

import bcrypt from 'bcrypt';

function legacyHashPassword(password: string, email: string): string {
  const systemSalt = 'EduAssessSystemSalt2026#';
  return crypto.createHash('sha256').update(password + email.toLowerCase().trim() + systemSalt).digest('hex');
}

async function hashPasswordAsync(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function generateToken(user: { email: string; role: string; name: string; studentId: string; class_id?: number | null }): string {
  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name,
    studentId: user.studentId,
    class_id: user.class_id || null,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;
    const parsed = JSON.parse(payload);
    if (Date.now() > parsed.exp) return null; // Expired
    return parsed;
  } catch (e) {
    return null;
  }
}

async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({ error: 'Chưa cung cấp token xác thực.' });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }

  // Synchronize status and role with Database
  try {
    const [rows] = await pool.query('SELECT status, role FROM users WHERE email = ?', [user.email]);
    if ((rows as any[]).length === 0) {
      return res.status(403).json({ error: 'Tài khoản không tồn tại.' });
    }
    const dbUser = (rows as any[])[0];
    if (dbUser.status === 'Suspended') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
    }
    user.role = dbUser.role; // Update to latest role dynamically
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi xác thực đồng bộ trạng thái.' });
  }

  req.user = user;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
}

function normalizeRole(dbRole: string): 'student' | 'teacher' | 'admin' {
  if (!dbRole) return 'student';
  const r = dbRole.toLowerCase().trim();
  if (r === 'lecturer' || r === 'teacher') return 'teacher';
  if (r === 'admin') return 'admin';
  return 'student';
}

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4'
};

const dbName = process.env.DB_NAME || 'eduassess_pro';

async function initializeDatabase() {
  let connection;
  try {
    // 1. Connect without database to create it if it doesn't exist
    connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${dbName}' verified/created.`);
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // 2. Create connection pool using the database
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // 3. Create tables if they don't exist
  try {
    // Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(50) PRIMARY KEY,
        content TEXT NOT NULL,
        subject VARCHAR(100),
        difficulty VARCHAR(50),
        options TEXT NOT NULL,
        correctAnswer INT NOT NULL,
        topic VARCHAR(100),
        avgTime VARCHAR(50),
        errorRate FLOAT
      )
    `);

    // Active Exams Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_exams (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(100),
        duration INT NOT NULL,
        questionCount INT NOT NULL,
        description TEXT,
        iconName VARCHAR(100),
        category VARCHAR(100),
        class_id INT DEFAULT NULL,
        questionIds TEXT DEFAULT NULL,
        difficultyDistribution TEXT DEFAULT NULL
      )
    `);

    // Exam History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_history (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        userEmail VARCHAR(150) NOT NULL,
        submitDate VARCHAR(100),
        score VARCHAR(50),
        result VARCHAR(50),
        iconName VARCHAR(100),
        questionsDetail TEXT NOT NULL
      )
    `);

    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        studentId VARCHAR(50),
        department VARCHAR(100) DEFAULT 'Khoa CNTT',
        status VARCHAR(50) DEFAULT 'Active',
        createdAt VARCHAR(50)
      )
    `);

    // Ensure columns exist on already created table
    try {
      await pool.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT 'Khoa CNTT'");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'Active'");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE users ADD COLUMN createdAt VARCHAR(50)");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE users ADD COLUMN class_id INT DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE active_exams ADD COLUMN class_id INT DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE active_exams ADD COLUMN questionIds TEXT DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE active_exams ADD COLUMN difficultyDistribution TEXT DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE active_exams ADD COLUMN startTime VARCHAR(100) DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE active_exams ADD COLUMN endTime VARCHAR(100) DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE exam_history ADD COLUMN userEmail VARCHAR(150) NOT NULL");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE exam_history ADD COLUMN examId VARCHAR(50) DEFAULT NULL");
    } catch (e) {}
    try {
      await pool.query("CREATE INDEX idx_users_role ON users (role)");
    } catch (e) {}
    try {
      await pool.query("CREATE INDEX idx_questions_subject ON questions (subject)");
    } catch (e) {}
    try {
      await pool.query("CREATE INDEX idx_exams_subject ON active_exams (subject)");
    } catch (e) {}
    try {
      await pool.query("CREATE INDEX idx_history_user_email ON exam_history (userEmail)");
    } catch (e) {}

    // Departments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        head VARCHAR(255),
        teacherCount INT DEFAULT 0
      )
    `);

    // Subjects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        code VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        credits INT NOT NULL,
        questionCount INT DEFAULT 0,
        deptId VARCHAR(50),
        FOREIGN KEY (deptId) REFERENCES departments(id) ON DELETE CASCADE
      )
    `);

    // Classes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id VARCHAR(50) NOT NULL,
        class_code VARCHAR(50) UNIQUE NOT NULL,
        class_name VARCHAR(255) NOT NULL,
        course_year VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        created_at VARCHAR(50),
        updated_at VARCHAR(50),
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      )
    `);

    // Drop system tables as module is removed
    try {
      await pool.query('DROP TABLE IF EXISTS system_settings, system_logs');
    } catch (err) {}

    console.log('Database tables verified/created.');

    // Convert tables to support UTF-8 if they were created with a different charset
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToAlter = [
      'questions',
      'active_exams',
      'exam_history',
      'users',
      'departments',
      'subjects',
      'classes'
    ];
    for (const table of tablesToAlter) {
      try {
        await pool.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      } catch (err) {
        console.warn(`Could not alter charset for table ${table}:`, err);
      }
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 4. Seed initial data if tables are empty
    // Seed questions
    console.log('Verifying questions seeding...');
    for (const q of initialQuestions) {
      const [exists] = await pool.query('SELECT id FROM questions WHERE id = ?', [q.id]);
      if ((exists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO questions (id, content, subject, difficulty, options, correctAnswer, topic, avgTime, errorRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [q.id, q.content, q.subject, q.difficulty, JSON.stringify(q.options), q.correctAnswer, q.topic, q.avgTime, q.errorRate]
        );
      } else {
        await pool.query(
          'UPDATE questions SET content = ?, subject = ?, difficulty = ?, options = ?, correctAnswer = ?, topic = ?, avgTime = ?, errorRate = ? WHERE id = ?',
          [q.content, q.subject, q.difficulty, JSON.stringify(q.options), q.correctAnswer, q.topic, q.avgTime, q.errorRate, q.id]
        );
      }
    }

    // Seed active exams
    console.log('Verifying active exams seeding...');
    for (const exam of initialActiveExams) {
      const [exists] = await pool.query('SELECT id FROM active_exams WHERE id = ?', [exam.id]);
      if ((exists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO active_exams (id, title, subject, duration, questionCount, description, iconName, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [exam.id, exam.title, exam.subject, exam.duration, exam.questionCount, exam.description, exam.iconName, exam.category]
        );
      } else {
        await pool.query(
          'UPDATE active_exams SET title = ?, subject = ?, duration = ?, questionCount = ?, description = ?, iconName = ?, category = ? WHERE id = ?',
          [exam.title, exam.subject, exam.duration, exam.questionCount, exam.description, exam.iconName, exam.category, exam.id]
        );
      }
    }

    // Seed exam history
    console.log('Verifying exam history seeding...');
    for (const h of initialExamHistory) {
      const [exists] = await pool.query('SELECT id FROM exam_history WHERE id = ?', [h.id]);
      if ((exists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO exam_history (id, title, department, userEmail, submitDate, score, result, iconName, questionsDetail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [h.id, h.title, h.department, 'alex.johnson@university.edu.vn', h.submitDate, h.score, h.result, h.iconName, JSON.stringify(h.questionsDetail)]
        );
      } else {
        await pool.query(
          'UPDATE exam_history SET title = ?, department = ?, userEmail = ?, submitDate = ?, score = ?, result = ?, iconName = ?, questionsDetail = ? WHERE id = ?',
          [h.title, h.department, 'alex.johnson@university.edu.vn', h.submitDate, h.score, h.result, h.iconName, JSON.stringify(h.questionsDetail), h.id]
        );
      }
    }

    // Seed default users
    console.log('Verifying users seeding...');
    const defaultUsers = [
      {
        email: 'alex.johnson@university.edu.vn',
        plainPass: '12345678',
        name: 'Alex Johnson',
        role: 'student',
        studentId: '48291',
        department: 'Khoa CNTT',
        status: 'Active',
        createdAt: '12 Th08, 2023'
      },
      {
        email: 'giangvien.nguyen@university.edu.vn',
        plainPass: '12345678',
        name: 'Giảng viên Nguyễn Văn A',
        role: 'teacher',
        studentId: '',
        department: 'Khoa Toán học',
        status: 'Active',
        createdAt: '01 Th05, 2022'
      },
      {
        email: 'tranvanb@university.edu.vn',
        plainPass: '12345678',
        name: 'PGS.TS. Trần Văn B',
        role: 'teacher',
        studentId: '',
        department: 'Khoa CNTT',
        status: 'Active',
        createdAt: '15 Th02, 2020'
      },
      {
        email: 'nguyenthic@university.edu.vn',
        plainPass: '12345678',
        name: 'ThS. Nguyễn Thị C',
        role: 'teacher',
        studentId: '',
        department: 'Khoa Ngoại ngữ',
        status: 'Active',
        createdAt: '22 Th11, 2021'
      },
      {
        email: 'leminhd@university.edu.vn',
        plainPass: '12345678',
        name: 'Lê Minh D',
        role: 'student',
        studentId: '99021',
        department: 'Khoa Vật lý',
        status: 'Suspended',
        createdAt: '18 Th09, 2023'
      },
      {
        email: 'admin.eduassess@university.edu.vn',
        plainPass: '12345678',
        name: 'Quản trị viên Hệ thống',
        role: 'admin',
        studentId: '',
        department: 'Phòng Đào tạo',
        status: 'Active',
        createdAt: '01 Th01, 2020'
      }
    ];
    for (const user of defaultUsers) {
      const hashedPass = hashPasswordSync(user.plainPass);
      const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
      if ((exists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO users (email, password, name, role, studentId, department, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [user.email, hashedPass, user.name, user.role, user.studentId, user.department, user.status, user.createdAt]
        );
      } else {
        await pool.query(
          'UPDATE users SET name = ?, role = ?, studentId = ?, department = ?, status = ?, password = ? WHERE email = ?',
          [user.name, user.role, user.studentId, user.department, user.status, hashedPass, user.email]
        );
      }
    }

    // Seed departments & subjects
    console.log('Verifying departments & subjects seeding...');
      const initialDepts = [
        {
          id: 'DEPT-01',
          name: 'Khoa Công nghệ Thông tin',
          head: 'PGS.TS. Trần Văn B',
          teacherCount: 18,
          subjects: [
            { code: 'CS-201', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 4, questionCount: 145 },
            { code: 'CS-302', name: 'Cơ sở dữ liệu nâng cao', credits: 3, questionCount: 92 },
            { code: 'CS-401', name: 'Trí tuệ nhân tạo & Học máy', credits: 4, questionCount: 110 }
          ]
        },
        {
          id: 'DEPT-02',
          name: 'Khoa Toán học',
          head: 'PGS.TS. Nguyễn Minh Triết',
          teacherCount: 12,
          subjects: [
            { code: 'MATH-101', name: 'Giải tích I & II', credits: 4, questionCount: 180 },
            { code: 'MATH-202', name: 'Đại số tuyến tính', credits: 3, questionCount: 125 },
            { code: 'MATH-303', name: 'Xác suất thống kê ứng dụng', credits: 3, questionCount: 88 }
          ]
        },
        {
          id: 'DEPT-03',
          name: 'Khoa Vật lý',
          head: 'GS.TS. Cao Văn Sơn',
          teacherCount: 9,
          subjects: [
            { code: 'PHYS-101', name: 'Vật lý đại cương', credits: 3, questionCount: 95 },
            { code: 'PHYS-205', name: 'Vật lý lượng tử cơ bản', credits: 4, questionCount: 64 }
          ]
        },
        {
          id: 'DEPT-04',
          name: 'Khoa Ngoại ngữ',
          head: 'ThS. Nguyễn Thị C',
          teacherCount: 15,
          subjects: [
            { code: 'ENG-101', name: 'Tiếng Anh chuyên ngành I', credits: 3, questionCount: 210 },
            { code: 'ENG-202', name: 'Luyện thi IELTS Học thuật', credits: 4, questionCount: 155 }
          ]
        }
      ];

      for (const dept of initialDepts) {
        const [deptExists] = await pool.query('SELECT id FROM departments WHERE id = ?', [dept.id]);
        if ((deptExists as any[]).length === 0) {
          await pool.query(
            'INSERT INTO departments (id, name, head, teacherCount) VALUES (?, ?, ?, ?)',
            [dept.id, dept.name, dept.head, dept.teacherCount]
          );
        } else {
          await pool.query(
            'UPDATE departments SET name = ?, head = ?, teacherCount = ? WHERE id = ?',
            [dept.name, dept.head, dept.teacherCount, dept.id]
          );
        }
        for (const sub of dept.subjects) {
          const [subExists] = await pool.query('SELECT code FROM subjects WHERE code = ?', [sub.code]);
          if ((subExists as any[]).length === 0) {
            await pool.query(
              'INSERT INTO subjects (code, name, credits, questionCount, deptId) VALUES (?, ?, ?, ?, ?)',
              [sub.code, sub.name, sub.credits, sub.questionCount, dept.id]
            );
          } else {
            await pool.query(
              'UPDATE subjects SET name = ?, credits = ?, questionCount = ?, deptId = ? WHERE code = ?',
              [sub.name, sub.credits, sub.questionCount, dept.id, sub.code]
            );
          }
        }
      }
      console.log('Seeded departments and subjects successfully.');

    // Seed initial classes
    console.log('Verifying classes seeding...');
    const initialClasses = [
      { department_id: 'DEPT-01', class_code: 'CTK45A', class_name: 'Công nghệ thông tin K45 - Nhóm A', course_year: 'K45 (2021-2025)' },
      { department_id: 'DEPT-01', class_code: 'CTK45B', class_name: 'Công nghệ thông tin K45 - Nhóm B', course_year: 'K45 (2021-2025)' },
      { department_id: 'DEPT-02', class_code: 'TK45A', class_name: 'Toán học K45 - Nhóm A', course_year: 'K45 (2021-2025)' },
      { department_id: 'DEPT-03', class_code: 'VLK45A', class_name: 'Vật lý K45 - Nhóm A', course_year: 'K45 (2021-2025)' },
      { department_id: 'DEPT-04', class_code: 'NNK45A', class_name: 'Ngoại ngữ K45 - Nhóm A', course_year: 'K45 (2021-2025)' },
    ];
    for (const cls of initialClasses) {
      const [exists] = await pool.query('SELECT id FROM classes WHERE class_code = ?', [cls.class_code]);
      if ((exists as any[]).length === 0) {
        const now = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
        await pool.query(
          'INSERT INTO classes (department_id, class_code, class_name, course_year, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cls.department_id, cls.class_code, cls.class_name, cls.course_year, 'Active', now, now]
        );
      }
    }
    // Update default student Alex Johnson to belong to class CTK45A
    try {
      const [classRows] = await pool.query("SELECT id FROM classes WHERE class_code = 'CTK45A'");
      if ((classRows as any[]).length > 0) {
        const classId = (classRows as any[])[0].id;
        await pool.query("UPDATE users SET class_id = ? WHERE email = 'alex.johnson@university.edu.vn'", [classId]);
      }
    } catch(e) {}
    console.log('Seeded classes successfully.');

    console.log('Database seeding verified.');
  } catch (err) {
    console.error('Error creating tables or seeding data:', err);
  }

  // --- API Endpoints ---

  // GET all questions (with optional filters)
  app.get('/api/questions', authenticateToken, async (req: any, res) => {
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
          options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
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

  // POST new question
  app.post('/api/questions', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
      const q = req.body;
      await pool.query(
        'INSERT INTO questions (id, content, subject, difficulty, options, correctAnswer, topic, avgTime, errorRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [q.id, q.content, q.subject, q.difficulty, JSON.stringify(q.options), q.correctAnswer, q.topic, q.avgTime, q.errorRate || 0]
      );
      res.status(201).json(q);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể thêm câu hỏi mới vào hệ thống.' });
    }
  });

  // PUT update question
  app.put('/api/questions/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const q = req.body;
      
      if (req.user.role === 'teacher') {
        const [qRows] = await pool.query('SELECT subject FROM questions WHERE id = ?', [id]);
        if ((qRows as any[]).length === 0) return res.status(404).json({error: 'Không tìm thấy câu hỏi.'});
        const oldSubject = (qRows as any[])[0].subject;

        const [oldValidSubs] = await pool.query(
          'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
          [oldSubject, req.user.department]
        );
        if ((oldValidSubs as any[]).length === 0) {
          return res.status(403).json({error: 'Bạn không có quyền sửa câu hỏi thuộc khoa khác.'});
        }

        if (q.subject && q.subject !== oldSubject) {
          const [newValidSubs] = await pool.query(
            'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
            [q.subject, req.user.department]
          );
          if ((newValidSubs as any[]).length === 0) {
            return res.status(403).json({error: 'Bạn không được phép chuyển câu hỏi sang môn của khoa khác.'});
          }
        }
      }

      await pool.query(
        'UPDATE questions SET content = ?, subject = ?, difficulty = ?, options = ?, correctAnswer = ?, topic = ?, avgTime = ?, errorRate = ? WHERE id = ?',
        [q.content, q.subject, q.difficulty, JSON.stringify(q.options), q.correctAnswer, q.topic, q.avgTime, q.errorRate, id]
      );
      res.json(q);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật câu hỏi.' });
    }
  });

  // DELETE question
  app.delete('/api/questions/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req: any, res) => {
    try {
      const { id } = req.params;

      if (req.user.role === 'teacher') {
        const [qRows] = await pool.query('SELECT subject FROM questions WHERE id = ?', [id]);
        if ((qRows as any[]).length === 0) return res.status(404).json({error: 'Không tìm thấy câu hỏi.'});
        const subjectName = (qRows as any[])[0].subject;

        const [validSubs] = await pool.query(
          'SELECT s.id FROM subjects s JOIN departments d ON s.deptId = d.id WHERE s.name = ? AND d.name = ?',
          [subjectName, req.user.department]
        );
        if ((validSubs as any[]).length === 0) {
          return res.status(403).json({error: 'Bạn không có quyền xóa câu hỏi thuộc khoa khác.'});
        }
      }

      await pool.query('DELETE FROM questions WHERE id = ?', [id]);
      res.json({ message: 'Question deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa câu hỏi.' });
    }
  });

  // GET all active exams (with filters, class-based for students)
  app.get('/api/exams', authenticateToken, async (req: any, res) => {
    try {
      const { search, subject, category } = req.query;
      let query = 'SELECT e.*, c.class_name, c.class_code FROM active_exams e LEFT JOIN classes c ON e.class_id = c.id WHERE 1=1';
      const params: any[] = [];

      // Students only see exams assigned to their class or exams with no class, AND exams they haven't submitted yet
      if (req.user.role === 'student') {
        if (req.user.class_id) {
          query += ' AND (e.class_id = ? OR e.class_id IS NULL)';
          params.push(req.user.class_id);
        }
        query += ' AND e.id NOT IN (SELECT examId FROM exam_history WHERE userEmail = ? AND examId IS NOT NULL)';
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
        difficultyDistribution: typeof row.difficultyDistribution === 'string' ? JSON.parse(row.difficultyDistribution) : row.difficultyDistribution
      }));
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: 'Đã có lỗi xảy ra khi tải danh sách đề thi.' });
    }
  });

  // POST new exam - validates question count and stores selected questionIds according to difficulty distribution
  app.post('/api/exams', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
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

      // Validate: count available questions for this subject
      const [availableRows] = await pool.query(
        'SELECT id, difficulty FROM questions WHERE subject = ?',
        [subject]
      );
      const available = (availableRows as any[]);

      if (available.length < questionCount) {
        return res.status(400).json({
          error: `Ngân hàng câu hỏi môn "${subject}" chỉ có ${available.length} câu, không đủ ${questionCount} câu yêu cầu.`
        });
      }

      let selected: any[] = [];
      if (difficultyDistribution && (difficultyDistribution.easy || difficultyDistribution.medium || difficultyDistribution.hard)) {
        const easyPool = available.filter(q => (q.difficulty || '').toLowerCase() === 'dễ' || (q.difficulty || '').toLowerCase() === 'easy');
        const mediumPool = available.filter(q => (q.difficulty || '').toLowerCase() === 'trung bình' || (q.difficulty || '').toLowerCase() === 'medium');
        const hardPool = available.filter(q => (q.difficulty || '').toLowerCase() === 'khó' || (q.difficulty || '').toLowerCase() === 'hard');

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

        // If not enough due to rounding or limited questions per difficulty, backfill randomly from remaining subject pool
        if (selected.length < questionCount) {
          const remaining = available.filter(q => !pickedSet.has(q.id)).sort(() => Math.random() - 0.5);
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
        [exam.id, exam.title, exam.subject, exam.duration, exam.questionCount, exam.description, exam.iconName, exam.category, class_id || null, questionIds, distJson]
      );
      res.status(201).json({ ...exam, questionIds, class_id: class_id || null, difficultyDistribution });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xuất bản đề thi mới.' });
    }
  });

  // PUT update exam
  app.put('/api/exams/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const exam = req.body;
      const distJson = JSON.stringify(exam.difficultyDistribution || null);
      await pool.query(
        'UPDATE active_exams SET title = ?, subject = ?, duration = ?, questionCount = ?, description = ?, iconName = ?, category = ?, class_id = ?, difficultyDistribution = ? WHERE id = ?',
        [exam.title, exam.subject, exam.duration, exam.questionCount, exam.description, exam.iconName, exam.category, exam.class_id || null, distJson, id]
      );
      res.json(exam);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật đề thi.' });
    }
  });

  // DELETE exam
  app.delete('/api/exams/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM active_exams WHERE id = ?', [id]);
      res.json({ message: 'Exam deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa đề thi.' });
    }
  });

  // GET all exam histories (Filtered dynamically: student gets own; teacher/admin gets all)
  app.get('/api/history', authenticateToken, async (req: any, res) => {
    try {
      let rows;
      if (req.user.role === 'student') {
        const [studentRows] = await pool.query('SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email WHERE h.userEmail = ? ORDER BY h.id DESC', [req.user.email]);
        rows = studentRows;
      } else {
        const [allRows] = await pool.query('SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email ORDER BY h.id DESC');
        rows = allRows;
      }
      const parsed = (rows as any[]).map(row => ({
        ...row,
        questionsDetail: typeof row.questionsDetail === 'string' ? JSON.parse(row.questionsDetail) : row.questionsDetail
      }));
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải lịch sử kiểm tra.' });
    }
  });

  // POST new exam history (Securely maps userEmail from the verified Token)
  app.post('/api/history', authenticateToken, async (req: any, res) => {
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

      // Prevent duplicate submissions
      if (req.user.role === 'student') {
        const [existing] = await pool.query('SELECT id FROM exam_history WHERE userEmail = ? AND examId = ?', [userEmail, h.examId]);
        if ((existing as any[]).length > 0) {
          return res.status(400).json({ error: 'Bạn đã hoàn thành bài thi này trước đó.' });
        }
      }

      const [exams] = await pool.query('SELECT class_id, questionIds FROM active_exams WHERE id = ?', [h.examId]);
      const activeExamRows = exams as any[];
      if (activeExamRows.length === 0) {
        return res.status(404).json({ error: 'Đề thi không tồn tại hoặc đã bị xóa.' });
      }
      
      const activeExam = activeExamRows[0];
      if (activeExam.class_id && req.user.role === 'student' && activeExam.class_id !== req.user.class_id) {
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
        const [dbQuestions] = await pool.query('SELECT id, content, options, correctAnswer FROM questions');
        const qMapById = new Map((dbQuestions as any[]).map(q => [q.id, q]));
        const qMapByContent = new Map((dbQuestions as any[]).map(q => [q.content, q]));

        verifiedDetails = h.questionsDetail.map((item: any) => {
          const qObj = (item.questionId && qMapById.get(item.questionId)) || qMapByContent.get(item.questionText);
          if (qObj) {
            const opts = typeof qObj.options === 'string' ? JSON.parse(qObj.options) : (qObj.options || []);
            const correctIdx = Number(qObj.correctAnswer);
            const userOptIdx = item.selectedOptionIndex !== undefined ? Number(item.selectedOptionIndex) : undefined;
            const isCorrect = userOptIdx !== undefined && userOptIdx === correctIdx;
            if (isCorrect) correctCount++;

            return {
              ...item,
              userAnswer: userOptIdx !== undefined && opts[userOptIdx] ? opts[userOptIdx] : item.userAnswer,
              correctAnswer: opts[correctIdx] || item.correctAnswer,
              isCorrect
            };
          }
          return { ...item, isCorrect: false };
        });

        // Use totalExamQuestions instead of verifiedDetails.length to prevent submitting only 1 question to get 10/10
        const finalScoreNum = (correctCount / totalExamQuestions) * 10;
        finalScoreStr = `${finalScoreNum.toFixed(1)}/10`;
        const pass = finalScoreNum >= 5;
        finalResultStr = pass ? 'Đạt' : 'Không đạt';
      }

      await pool.query(
        'INSERT INTO exam_history (id, title, department, userEmail, submitDate, score, result, iconName, questionsDetail, examId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [h.id, h.title, h.department, userEmail, h.submitDate, finalScoreStr, finalResultStr, h.iconName, JSON.stringify(verifiedDetails), h.examId]
      );
      res.status(201).json({ ...h, score: finalScoreStr, result: finalResultStr, questionsDetail: verifiedDetails, userEmail, examId: h.examId });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể nộp kết quả thi.' });
    }
  });

  // DELETE exam history
  app.delete('/api/history/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM exam_history WHERE id = ?', [id]);
      res.json({ message: 'Đã xóa lịch sử bài thi.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa lịch sử bài thi.' });
    }
  });

  // POST re-grade exam history against current question bank answers
  app.post('/api/history/:id/regrade', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const [historyRows] = await pool.query('SELECT h.*, u.name as userName FROM exam_history h LEFT JOIN users u ON h.userEmail = u.email WHERE h.id = ?', [id]);
      if ((historyRows as any[]).length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy bài thi cần chấm lại.' });
      }
      const item = (historyRows as any[])[0];
      const details = typeof item.questionsDetail === 'string' ? JSON.parse(item.questionsDetail) : (item.questionsDetail || []);

      if (!Array.isArray(details) || details.length === 0) {
        return res.status(400).json({ error: 'Bài thi không có chi tiết câu trả lời để chấm lại.' });
      }

      const [dbQuestions] = await pool.query('SELECT id, content, options, correctAnswer FROM questions');
      const qMapById = new Map((dbQuestions as any[]).map(q => [q.id, q]));
      const qMapByContent = new Map((dbQuestions as any[]).map(q => [q.content, q]));

      let correctCount = 0;
      const regradedDetails = details.map((d: any) => {
        const qObj = (d.questionId && qMapById.get(d.questionId)) || qMapByContent.get(d.questionText);
        if (qObj) {
          const opts = typeof qObj.options === 'string' ? JSON.parse(qObj.options) : (qObj.options || []);
          const correctIdx = Number(qObj.correctAnswer);
          const userOptIdx = d.selectedOptionIndex !== undefined ? Number(d.selectedOptionIndex) : undefined;
          const isCorrect = userOptIdx !== undefined && userOptIdx === correctIdx;
          if (isCorrect) correctCount++;

          return {
            ...d,
            userAnswer: userOptIdx !== undefined && opts[userOptIdx] ? opts[userOptIdx] : d.userAnswer,
            correctAnswer: opts[correctIdx] || d.correctAnswer,
            isCorrect
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
        [finalScoreStr, finalResultStr, JSON.stringify(regradedDetails), id]
      );

      res.json({
        ...item,
        score: finalScoreStr,
        result: finalResultStr,
        questionsDetail: regradedDetails
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi chấm lại bài thi.' });
    }
  });

  // --- AUTHENTICATION ENDPOINTS ---


  const loginAttempts = new Map<string, { count: number, resetTime: number }>();

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
        return res.status(429).json({ error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' });
      }
    } else {
      loginAttempts.set(ip, { count: 0, resetTime: now + 15 * 60 * 1000 });
    }
    next();
  };

  // POST login
  app.post('/api/auth/login', loginRateLimiter, async (req: any, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
      }

      const [users] = await pool.query(
        'SELECT name, role, studentId, status, class_id, password FROM users WHERE email = ?',
        [email]
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
        isValid = (hashed === user.password);
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

      // Check if account is suspended
      if (user.status === 'Suspended') {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
      }

      const tokenUser = { email, role: user.role, name: user.name, studentId: user.studentId || '', class_id: user.class_id || null };
      res.json({
        message: 'Đăng nhập thành công.',
        token: generateToken(tokenUser),
        user: {
          email,
          name: user.name,
          role: normalizeRole(user.role),
          studentId: user.studentId,
          class_id: user.class_id || null
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi đăng nhập hệ thống.' });
    }
  });

  // --- USER CRUD ENDPOINTS ---

  // GET all users
  app.get('/api/users', authenticateToken, requireRole(['admin', 'teacher']), async (req, res) => {
    try {
      const { role, status, search, sortBy = 'id', sortOrder = 'DESC' } = req.query;
      let query = 'SELECT u.id, u.email, u.name, u.role, u.studentId, u.department, u.status, u.createdAt, u.class_id, c.class_name, c.class_code FROM users u LEFT JOIN classes c ON u.class_id = c.id WHERE 1=1';
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
        class_code: row.class_code || null
      }));
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải thông tin tài khoản.' });
    }
  });

  // POST create user
  app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { email, password, name, role, department, status, class_id } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (Email, Họ tên, Vai trò).' });
      }

      if (password && password.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự để đảm bảo an toàn.' });
      }

      const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if ((exists as any[]).length > 0) {
        return res.status(400).json({ error: 'Email này đã được sử dụng.' });
      }

      // Auto-generate studentId for students based on class_code
      let studentId = '';
      if (normalizeRole(role) === 'student' && class_id) {
        const [classRows] = await pool.query('SELECT class_code FROM classes WHERE id = ?', [class_id]);
        if ((classRows as any[]).length > 0) {
          const classCode = (classRows as any[])[0].class_code;
          // Count existing students in this class to generate next number
          const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE class_id = ?', [class_id]);
          const nextNum = ((countRows as any[])[0].cnt || 0) + 1;
          studentId = `${classCode}-${String(nextNum).padStart(3, '0')}`;
        }
      }

      const finalPassword = password || `Edu@${crypto.randomBytes(4).toString('hex')}!`;
      const hashed = await hashPasswordAsync(finalPassword);
      const createdAt = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

      const [result] = await pool.query(
        'INSERT INTO users (email, password, name, role, studentId, department, status, createdAt, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [email, hashed, name, role, studentId, department || 'Khoa CNTT', status || 'Active', createdAt, class_id || null]
      );

      const newId = (result as any).insertId;

      // Get class info for response
      let class_name = null;
      let class_code = null;
      if (class_id) {
        const [cls] = await pool.query('SELECT class_name, class_code FROM classes WHERE id = ?', [class_id]);
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
        initialPassword: password ? undefined : finalPassword
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tạo tài khoản mới.' });
    }
  });

  // PUT update user
  app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, studentId, department, status, password, class_id } = req.body;

      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
      }

      if (password && password.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu cập nhật phải có ít nhất 8 ký tự.' });
      }

      let query = 'UPDATE users SET name = ?, email = ?, role = ?, studentId = ?, department = ?, status = ?, class_id = ?';
      const params = [name, email, role, studentId || '', department || 'Khoa CNTT', status || 'Active', class_id || null];

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
        const [cls] = await pool.query('SELECT class_name, class_code FROM classes WHERE id = ?', [class_id]);
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
        class_code
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật tài khoản.' });
    }
  });

  // DELETE user
  app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa tài khoản.' });
    }
  });

  // PUT toggle suspend status
  app.put('/api/users/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
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

  // --- DEPARTMENT & SUBJECT CRUD ENDPOINTS ---

  // GET all departments (with their subjects joined and teacher counts computed dynamically)
  app.get('/api/departments', authenticateToken, async (_req, res) => {
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
        const deptSubjects = (subs as any[]).filter(s => s.deptId === d.id).map(s => {
          const subNameNormalized = s.name.toLowerCase().trim();
          return {
            ...s,
            questionCount: questionMap[subNameNormalized] || 0
          };
        });
        return {
          ...d,
          teacherCount: teacherMap[deptNameNormalized] || 0,
          subjects: deptSubjects
        };
      });

      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách khoa.' });
    }
  });

  // GET all subjects
  app.get('/api/subjects', authenticateToken, async (_req, res) => {
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
        questionCount: questionMap[s.name.toLowerCase().trim()] || 0
      }));
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách bộ môn.' });
    }
  });

  // POST create department
  app.post('/api/departments', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id, name, head, teacherCount } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'Thiếu mã khoa hoặc tên khoa.' });
      }

      await pool.query(
        'INSERT INTO departments (id, name, head, teacherCount) VALUES (?, ?, ?, ?)',
        [id, name, head || 'Chưa phân công', teacherCount || 0]
      );

      res.status(201).json({ id, name, head: head || 'Chưa phân công', teacherCount: teacherCount || 0, subjects: [] });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tạo khoa mới.' });
    }
  });

  // DELETE department
  app.delete('/api/departments/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM departments WHERE id = ?', [id]);
      res.json({ message: 'Deleted department successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa khoa.' });
    }
  });

  // POST create subject
  app.post('/api/subjects', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { code, name, credits, questionCount, deptId } = req.body;
      if (!code || !name || !credits || !deptId) {
        return res.status(400).json({ error: 'Thiếu thông tin môn học bắt buộc.' });
      }

      await pool.query(
        'INSERT INTO subjects (code, name, credits, questionCount, deptId) VALUES (?, ?, ?, ?, ?)',
        [code.toUpperCase(), name, credits, questionCount || 0, deptId]
      );

      res.status(201).json({ code: code.toUpperCase(), name, credits, questionCount: questionCount || 0, deptId });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tạo môn học mới.' });
    }
  });

  // DELETE subject
  app.delete('/api/subjects/:code', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { code } = req.params;
      await pool.query('DELETE FROM subjects WHERE code = ?', [code]);
      res.json({ message: 'Deleted subject successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa môn học.' });
    }
  });

  // PUT update department
  app.put('/api/departments/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, head, teacherCount } = req.body;
      await pool.query(
        'UPDATE departments SET name = ?, head = ?, teacherCount = ? WHERE id = ?',
        [name, head || 'Chưa phân công', teacherCount || 0, id]
      );
      res.json({ id, name, head: head || 'Chưa phân công', teacherCount: teacherCount || 0 });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật khoa.' });
    }
  });

  // PUT update subject
  app.put('/api/subjects/:code', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { code } = req.params;
      const { name, credits, questionCount, deptId } = req.body;
      await pool.query(
        'UPDATE subjects SET name = ?, credits = ?, questionCount = ?, deptId = ? WHERE code = ?',
        [name, credits, questionCount || 0, deptId, code]
      );
      res.json({ code, name, credits, questionCount: questionCount || 0, deptId });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật bộ môn.' });
    }
  });


  // --- CLASS CRUD ENDPOINTS ---

  // GET all classes (with student count and department name)
  app.get('/api/classes', authenticateToken, async (_req, res) => {
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
  app.post('/api/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { department_id, class_code, class_name, course_year } = req.body;
      if (!department_id || !class_code || !class_name) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
      }

      const now = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
      const [result] = await pool.query(
        'INSERT INTO classes (department_id, class_code, class_name, course_year, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [department_id, class_code, class_name, course_year || '', 'Active', now, now]
      );

      const newId = (result as any).insertId;
      const [deptRows] = await pool.query('SELECT name FROM departments WHERE id = ?', [department_id]);
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
        updated_at: now
      });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Mã lớp đã tồn tại.' });
      }
      res.status(500).json({ error: 'Không thể tạo lớp học mới.' });
    }
  });

  // PUT update class
  app.put('/api/classes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { department_id, class_code, class_name, course_year, status } = req.body;
      const now = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
      await pool.query(
        'UPDATE classes SET department_id = ?, class_code = ?, class_name = ?, course_year = ?, status = ?, updated_at = ? WHERE id = ?',
        [department_id, class_code, class_name, course_year || '', status || 'Active', now, id]
      );

      const [deptRows] = await pool.query('SELECT name FROM departments WHERE id = ?', [department_id]);
      const deptName = (deptRows as any[]).length > 0 ? (deptRows as any[])[0].name : '';
      const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE class_id = ?', [id]);
      const studentCount = (countRows as any[])[0]?.cnt || 0;

      res.json({ id: Number(id), department_id, class_code, class_name, course_year, status: status || 'Active', updated_at: now, department_name: deptName, student_count: studentCount });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật lớp học.' });
    }
  });

  // DELETE class
  app.delete('/api/classes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
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

  // Phục vụ các file tĩnh trong thư mục dist (React Build)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, 'dist')));

  // Định tuyến mọi Request (không bắt đầu bằng /api) về file index.html của React
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });

  // Start the server
  const PORT = process.env.PORT || 5000;
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Express server running on port http://localhost:${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase();
}

export { app, initializeDatabase };
