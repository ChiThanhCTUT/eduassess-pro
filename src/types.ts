export type Role = 'student' | 'teacher' | 'admin';

export interface Question {
  id: string; // e.g. '#Q-89021'
  content: string;
  subject: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  options?: string[]; // A, B, C, D
  correctAnswer?: number; // index of options (0-3)
  topic?: string;
  avgTime?: string;
  errorRate?: number; // e.g. 82.4
}

export interface ExamHistory {
  id: string;
  title: string;
  department: string;
  submitDate: string;
  score: string;
  result: 'Đạt' | 'Không đạt';
  iconName: string; // e.g., functions, code, psychology, biotech
  questionsDetail?: {
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
  duration: number; // in minutes
  questionCount: number;
  description: string;
  iconName: string;
  category: string;
  class_id?: number | null;
  questionIds?: string; // JSON array of question IDs, selected at exam creation time
  className?: string; // joined class name for display
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
