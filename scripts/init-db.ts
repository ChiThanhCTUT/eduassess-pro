import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { initialQuestions, initialActiveExams, initialExamHistory } from '../src/data.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

const dbName = process.env.DB_NAME || 'eduassess_pro';

function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export async function initializeDatabase() {
  let connection;
  try {
    // 1. Connect without database to create it if it doesn't exist
    connection = await mysql.createConnection(dbConfig);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(
      `ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database '${dbName}' verified/created.`);
  } catch (err) {
    console.error('Error creating database:', err);
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // 2. Create connection pool using the database
  const pool = mysql.createPool({
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
        difficultyDistribution TEXT DEFAULT NULL,
        startTime VARCHAR(100) DEFAULT NULL,
        endTime VARCHAR(100) DEFAULT NULL
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
        questionsDetail TEXT NOT NULL,
        examId VARCHAR(50) DEFAULT NULL
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
        createdAt VARCHAR(50),
        class_id INT DEFAULT NULL
      )
    `);

    // Indexes
    try {
      await pool.query('CREATE INDEX idx_users_role ON users (role)');
    } catch (e) {}
    try {
      await pool.query('CREATE INDEX idx_questions_subject ON questions (subject)');
    } catch (e) {}
    try {
      await pool.query('CREATE INDEX idx_exams_subject ON active_exams (subject)');
    } catch (e) {}
    try {
      await pool.query('CREATE INDEX idx_history_user_email ON exam_history (userEmail)');
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

    // Refresh Tokens Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(100) NOT NULL,
        expiresAt BIGINT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
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
      'classes',
    ];
    for (const table of tablesToAlter) {
      try {
        await pool.query(
          `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
        );
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
          [
            q.id,
            q.content,
            q.subject,
            q.difficulty,
            JSON.stringify(q.options),
            q.correctAnswer,
            q.topic,
            q.avgTime,
            q.errorRate,
          ],
        );
      } else {
        await pool.query(
          'UPDATE questions SET content = ?, subject = ?, difficulty = ?, options = ?, correctAnswer = ?, topic = ?, avgTime = ?, errorRate = ? WHERE id = ?',
          [
            q.content,
            q.subject,
            q.difficulty,
            JSON.stringify(q.options),
            q.correctAnswer,
            q.topic,
            q.avgTime,
            q.errorRate,
            q.id,
          ],
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
          [
            exam.id,
            exam.title,
            exam.subject,
            exam.duration,
            exam.questionCount,
            exam.description,
            exam.iconName,
            exam.category,
          ],
        );
      } else {
        await pool.query(
          'UPDATE active_exams SET title = ?, subject = ?, duration = ?, questionCount = ?, description = ?, iconName = ?, category = ? WHERE id = ?',
          [
            exam.title,
            exam.subject,
            exam.duration,
            exam.questionCount,
            exam.description,
            exam.iconName,
            exam.category,
            exam.id,
          ],
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
          [
            h.id,
            h.title,
            h.department,
            'alex.johnson@university.edu.vn',
            h.submitDate,
            h.score,
            h.result,
            h.iconName,
            JSON.stringify(h.questionsDetail),
          ],
        );
      } else {
        await pool.query(
          'UPDATE exam_history SET title = ?, department = ?, userEmail = ?, submitDate = ?, score = ?, result = ?, iconName = ?, questionsDetail = ? WHERE id = ?',
          [
            h.title,
            h.department,
            'alex.johnson@university.edu.vn',
            h.submitDate,
            h.score,
            h.result,
            h.iconName,
            JSON.stringify(h.questionsDetail),
            h.id,
          ],
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
        createdAt: '12 Th08, 2023',
      },
      {
        email: 'giangvien.nguyen@university.edu.vn',
        plainPass: '12345678',
        name: 'Giảng viên Nguyễn Văn A',
        role: 'teacher',
        studentId: '',
        department: 'Khoa Toán học',
        status: 'Active',
        createdAt: '01 Th05, 2022',
      },
      {
        email: 'tranvanb@university.edu.vn',
        plainPass: '12345678',
        name: 'PGS.TS. Trần Văn B',
        role: 'teacher',
        studentId: '',
        department: 'Khoa CNTT',
        status: 'Active',
        createdAt: '15 Th02, 2020',
      },
      {
        email: 'nguyenthic@university.edu.vn',
        plainPass: '12345678',
        name: 'ThS. Nguyễn Thị C',
        role: 'teacher',
        studentId: '',
        department: 'Khoa Ngoại ngữ',
        status: 'Active',
        createdAt: '22 Th11, 2021',
      },
      {
        email: 'leminhd@university.edu.vn',
        plainPass: '12345678',
        name: 'Lê Minh D',
        role: 'student',
        studentId: '99021',
        department: 'Khoa Vật lý',
        status: 'Suspended',
        createdAt: '18 Th09, 2023',
      },
      {
        email: 'admin.eduassess@university.edu.vn',
        plainPass: '12345678',
        name: 'Quản trị viên Hệ thống',
        role: 'admin',
        studentId: '',
        department: 'Phòng Đào tạo',
        status: 'Active',
        createdAt: '01 Th01, 2020',
      },
    ];
    for (const user of defaultUsers) {
      const hashedPass = hashPasswordSync(user.plainPass);
      const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
      if ((exists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO users (email, password, name, role, studentId, department, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            user.email,
            hashedPass,
            user.name,
            user.role,
            user.studentId,
            user.department,
            user.status,
            user.createdAt,
          ],
        );
      } else {
        await pool.query(
          'UPDATE users SET name = ?, role = ?, studentId = ?, department = ?, status = ?, password = ? WHERE email = ?',
          [
            user.name,
            user.role,
            user.studentId,
            user.department,
            user.status,
            hashedPass,
            user.email,
          ],
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
          { code: 'CS-401', name: 'Trí tuệ nhân tạo & Học máy', credits: 4, questionCount: 110 },
        ],
      },
      {
        id: 'DEPT-02',
        name: 'Khoa Toán học',
        head: 'PGS.TS. Nguyễn Minh Triết',
        teacherCount: 12,
        subjects: [
          { code: 'MATH-101', name: 'Giải tích I & II', credits: 4, questionCount: 180 },
          { code: 'MATH-202', name: 'Đại số tuyến tính', credits: 3, questionCount: 125 },
          { code: 'MATH-303', name: 'Xác suất thống kê ứng dụng', credits: 3, questionCount: 88 },
        ],
      },
      {
        id: 'DEPT-03',
        name: 'Khoa Vật lý',
        head: 'GS.TS. Cao Văn Sơn',
        teacherCount: 9,
        subjects: [
          { code: 'PHYS-101', name: 'Vật lý đại cương', credits: 3, questionCount: 95 },
          { code: 'PHYS-205', name: 'Vật lý lượng tử cơ bản', credits: 4, questionCount: 64 },
        ],
      },
      {
        id: 'DEPT-04',
        name: 'Khoa Ngoại ngữ',
        head: 'ThS. Nguyễn Thị C',
        teacherCount: 15,
        subjects: [
          { code: 'ENG-101', name: 'Tiếng Anh chuyên ngành I', credits: 3, questionCount: 210 },
          { code: 'ENG-202', name: 'Luyện thi IELTS Học thuật', credits: 4, questionCount: 155 },
        ],
      },
    ];

    for (const dept of initialDepts) {
      const [deptExists] = await pool.query('SELECT id FROM departments WHERE id = ?', [dept.id]);
      if ((deptExists as any[]).length === 0) {
        await pool.query(
          'INSERT INTO departments (id, name, head, teacherCount) VALUES (?, ?, ?, ?)',
          [dept.id, dept.name, dept.head, dept.teacherCount],
        );
      } else {
        await pool.query(
          'UPDATE departments SET name = ?, head = ?, teacherCount = ? WHERE id = ?',
          [dept.name, dept.head, dept.teacherCount, dept.id],
        );
      }
      for (const sub of dept.subjects) {
        const [subExists] = await pool.query('SELECT code FROM subjects WHERE code = ?', [
          sub.code,
        ]);
        if ((subExists as any[]).length === 0) {
          await pool.query(
            'INSERT INTO subjects (code, name, credits, questionCount, deptId) VALUES (?, ?, ?, ?, ?)',
            [sub.code, sub.name, sub.credits, sub.questionCount, dept.id],
          );
        } else {
          await pool.query(
            'UPDATE subjects SET name = ?, credits = ?, questionCount = ?, deptId = ? WHERE code = ?',
            [sub.name, sub.credits, sub.questionCount, dept.id, sub.code],
          );
        }
      }
    }
    console.log('Seeded departments and subjects successfully.');

    // Seed initial classes
    console.log('Verifying classes seeding...');
    const initialClasses = [
      {
        department_id: 'DEPT-01',
        class_code: 'CTK45A',
        class_name: 'Công nghệ thông tin K45 - Nhóm A',
        course_year: 'K45 (2021-2025)',
      },
      {
        department_id: 'DEPT-01',
        class_code: 'CTK45B',
        class_name: 'Công nghệ thông tin K45 - Nhóm B',
        course_year: 'K45 (2021-2025)',
      },
      {
        department_id: 'DEPT-02',
        class_code: 'TK45A',
        class_name: 'Toán học K45 - Nhóm A',
        course_year: 'K45 (2021-2025)',
      },
      {
        department_id: 'DEPT-03',
        class_code: 'VLK45A',
        class_name: 'Vật lý K45 - Nhóm A',
        course_year: 'K45 (2021-2025)',
      },
      {
        department_id: 'DEPT-04',
        class_code: 'NNK45A',
        class_name: 'Ngoại ngữ K45 - Nhóm A',
        course_year: 'K45 (2021-2025)',
      },
    ];
    for (const cls of initialClasses) {
      const [exists] = await pool.query('SELECT id FROM classes WHERE class_code = ?', [
        cls.class_code,
      ]);
      if ((exists as any[]).length === 0) {
        const now = new Date().toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        await pool.query(
          'INSERT INTO classes (department_id, class_code, class_name, course_year, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cls.department_id, cls.class_code, cls.class_name, cls.course_year, 'Active', now, now],
        );
      }
    }
    // Update default student Alex Johnson to belong to class CTK45A
    try {
      const [classRows] = await pool.query("SELECT id FROM classes WHERE class_code = 'CTK45A'");
      if ((classRows as any[]).length > 0) {
        const classId = (classRows as any[])[0].id;
        await pool.query(
          "UPDATE users SET class_id = ? WHERE email = 'alex.johnson@university.edu.vn'",
          [classId],
        );
      }
    } catch (e) {}
    console.log('Seeded classes successfully.');

    console.log('Database seeding verified.');
  } catch (err) {
    console.error('Error creating tables or seeding data:', err);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].includes('init-db')) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Initialization failed:', err);
      process.exit(1);
    });
}
