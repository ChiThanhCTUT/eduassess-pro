
import generalRoutes from './src/backend/routes/general.routes';
import authRoutes from './src/backend/routes/auth.routes';
import usersRoutes from './src/backend/routes/users.routes';
import departmentsRoutes from './src/backend/routes/departments.routes';
import classesRoutes from './src/backend/routes/classes.routes';

import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initialQuestions, initialActiveExams, initialExamHistory } from './src/data';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

export let pool: any;

import bcrypt from 'bcrypt';

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

function generateToken(
  user: { email: string; role: string; name: string; studentId: string; class_id?: number | null },
  expiresInMs: number = 30 * 60 * 1000,
): string {
  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name,
    studentId: user.studentId,
    class_id: user.class_id || null,
    exp: Date.now() + expiresInMs, // Default 30 minutes
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

app.use('/', generalRoutes);
app.use('/', authRoutes);
app.use('/', usersRoutes);
app.use('/', departmentsRoutes);
app.use('/', classesRoutes);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

const dbName = process.env.DB_NAME || 'eduassess_pro';

pool = mysql.createPool({
  ...dbConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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

export { app };
