export type Role = 'student' | 'teacher' | 'admin';

export interface Question {
  id: string; // ví dụ: '#Q-89021'
  content: string;
  subject: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  options?: string[]; // A, B, C, D
  correctAnswer?: number; // chỉ số của mảng options (0-3)
  topic?: string;
  avgTime?: string;
  errorRate?: number; // ví dụ: 82.4
}

export interface ExamHistory {
  id: string;
  examId?: string;
  title: string;
  department: string;
  submitDate: string;
  score: string;
  result: 'Đạt' | 'Không đạt';
  iconName: string; // ví dụ: functions, code, psychology, biotech
  userEmail?: string;
  userName?: string;
  questionsDetail?: {
    questionId?: string;
    selectedOptionIndex?: number;
    questionNum: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface ActiveExam {
  id: string;
  title: string;
  subject: string;
  duration: number; // tính bằng phút
  questionCount: number;
  description: string;
  iconName: string;
  category: string;
  class_id?: number | null;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionIds?: string; // mảng JSON chứa danh sách ID câu hỏi, được chọn tại thời điểm tạo đề thi
  className?: string; // tên lớp học hiển thị
  class_name?: string; // tên lớp học (từ SQL)
  class_code?: string; // mã lớp học (từ SQL)
}

export interface NewExamConfig {
  subject: string;
  questionCount: number;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  duration: number;
  totalPoints: number;
}

export interface ClassItem {
  id: number;
  department_id: string;
  class_code: string;
  class_name: string;
  course_year: string;
  status: string;
  student_count?: number;
  department_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  class_id?: number | null;
  class_name?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  status: 'Active' | 'Suspended';
  class_id: number | null;
}
