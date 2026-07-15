import { Question, ExamHistory, ActiveExam } from './types';

export const initialQuestions: Question[] = [
  {
    id: '#Q-89021',
    content: 'Đạo hàm của hàm số f(x) = sin(x^2) sử dụng quy tắc chuỗi là gì?',
    subject: 'Toán học',
    difficulty: 'Trung bình',
    options: [
      '2x * cos(x^2)',
      'cos(x^2)',
      '2 * sin(x) * cos(x)',
      '-2x * cos(x^2)'
    ],
    correctAnswer: 0,
    topic: 'Giải tích I',
    avgTime: '02:15',
    errorRate: 35.5
  },
  {
    id: '#Q-89022',
    content: 'Giải thích Nguyên lý Bất định Heisenberg về vị trí và động lượng.',
    subject: 'Vật lý lượng tử',
    difficulty: 'Khó',
    options: [
      'Không thể xác định chính xác đồng thời cả vị trí và động lượng của hạt.',
      'Năng lượng của một hạt luôn luôn được bảo toàn.',
      'Hạt luôn di chuyển theo một quỹ đạo hình tròn cố định.',
      'Sự thay đổi trạng thái của hạt không ảnh hưởng đến động lượng.'
    ],
    correctAnswer: 0,
    topic: 'Vật lý lượng tử',
    avgTime: '04:30',
    errorRate: 68.2
  },
  {
    id: '#Q-89023',
    content: 'Nguyên tố nào sau đây có độ âm điện cao nhất?',
    subject: 'Hóa hữu cơ',
    difficulty: 'Dễ',
    options: [
      'Fluor (F)',
      'Oxy (O)',
      'Clo (Cl)',
      'Cacbon (C)'
    ],
    correctAnswer: 0,
    topic: 'Liên kết phân tử',
    avgTime: '01:05',
    errorRate: 15.4
  },
  {
    id: '#Q-89024',
    content: 'Định nghĩa định luật thứ hai của nhiệt động lực học và ý nghĩa của nó đối với entropy.',
    subject: 'Vật lý',
    difficulty: 'Trung bình',
    options: [
      'Entropy của một hệ thống cô lập luôn tăng theo thời gian.',
      'Năng lượng không tự nhiên sinh ra hay mất đi.',
      'Nhiệt độ không bao giờ có thể đạt tới độ không tuyệt đối.',
      'Entropy luôn bằng không trong mọi quá trình tuần hoàn.'
    ],
    correctAnswer: 0,
    topic: 'Nhiệt động lực học',
    avgTime: '03:10',
    errorRate: 42.1
  },
  {
    id: '#Q-89025',
    content: 'Độ phức tạp thời gian của bài toán Knapsack (Balo) sử dụng quy hoạch động là gì?',
    subject: 'Toán học',
    difficulty: 'Khó',
    options: [
      'O(N * W) với N là số đồ vật, W là trọng lượng tối đa',
      'O(2^N) trong mọi trường hợp',
      'O(N^2)',
      'O(N * log N)'
    ],
    correctAnswer: 0,
    topic: 'Quy hoạch động',
    avgTime: '04:12',
    errorRate: 82.4
  },
  {
    id: '#Q-89026',
    content: 'Xác định chu trình trong đồ thị có hướng bằng giải thuật tìm kiếm theo chiều sâu (DFS) dựa trên yếu tố nào?',
    subject: 'Toán học',
    difficulty: 'Khó',
    options: [
      'Phát hiện cạnh ngược (Back edge) khi duyệt DFS',
      'Sự tồn tại của nút lá cô đơn',
      'Đồ thị có số cạnh lớn hơn số đỉnh',
      'Duyệt hết toàn bộ các đỉnh trong một lượt duy nhất'
    ],
    correctAnswer: 0,
    topic: 'Lý thuyết đồ thị',
    avgTime: '03:45',
    errorRate: 67.1
  },
  {
    id: '#Q-89027',
    content: 'Logic tái cân bằng khi xóa nút lá trong cây tìm kiếm nhị phân B-Tree tuân thủ nguyên tắc gì?',
    subject: 'Toán học',
    difficulty: 'Khó',
    options: [
      'Mượn khóa từ anh em kề cận hoặc gộp nút với anh em',
      'Xoay trái hoặc xoay phải giống cây AVL',
      'Chèn trực tiếp khóa mới vào gốc',
      'Hạ bậc toàn bộ cây xuống 1 mức'
    ],
    correctAnswer: 0,
    topic: 'B-Trees',
    avgTime: '02:58',
    errorRate: 59.8
  },
  {
    id: '#Q-89028',
    content: 'Trường hợp tốt nhất so với tệ nhất cho chaining trong bảng băm (Hash Maps) lần lượt là gì?',
    subject: 'Toán học',
    difficulty: 'Khó',
    options: [
      'Tốt nhất O(1), tệ nhất O(N) khi xảy ra xung đột hoàn toàn',
      'Tốt nhất O(log N), tệ nhất O(N^2)',
      'Tốt nhất O(1), tệ nhất O(log N)',
      'Tốt nhất O(N), tệ nhất O(N * log N)'
    ],
    correctAnswer: 0,
    topic: 'Hash Maps',
    avgTime: '01:20',
    errorRate: 52.4
  }
];

export const initialExamHistory: ExamHistory[] = [
  {
    id: 'HIST-001',
    title: 'Advanced Calculus III',
    department: 'Khoa Toán học',
    submitDate: '24 Th10, 2023',
    score: '8.5/10',
    result: 'Đạt',
    iconName: 'functions',
    questionsDetail: [
      {
        questionNum: 1,
        questionText: 'Định lý nào sau đây mô tả mối quan hệ giữa các cạnh của một tam giác vuông?',
        userAnswer: 'Định lý Pythagoras (Câu trả lời của bạn)',
        correctAnswer: 'Định lý Pythagoras',
        isCorrect: true
      },
      {
        questionNum: 2,
        questionText: 'Đạo hàm của sin(x) là gì?',
        userAnswer: '-cos(x) (Câu trả lời của bạn)',
        correctAnswer: 'cos(x) (Câu trả lời đúng)',
        isCorrect: false
      },
      {
        questionNum: 3,
        questionText: 'Giải x: 2x + 5 = 15.',
        userAnswer: 'x = 5 (Câu trả lời của bạn)',
        correctAnswer: 'x = 5',
        isCorrect: true
      }
    ]
  },
  {
    id: 'HIST-002',
    title: 'Data Structures & Algorithms',
    department: 'Khoa CNTT',
    submitDate: '18 Th10, 2023',
    score: '9.2/10',
    result: 'Đạt',
    iconName: 'code',
    questionsDetail: [
      {
        questionNum: 1,
        questionText: 'Độ phức tạp thời gian trung bình của tìm kiếm nhị phân là gì?',
        userAnswer: 'O(log N) (Câu trả lời của bạn)',
        correctAnswer: 'O(log N)',
        isCorrect: true
      },
      {
        questionNum: 2,
        questionText: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In First Out)?',
        userAnswer: 'Stack (Câu trả lời của bạn)',
        correctAnswer: 'Stack',
        isCorrect: true
      }
    ]
  },
  {
    id: 'HIST-003',
    title: 'Introduction to Philosophy',
    department: 'Khoa Nhân văn',
    submitDate: '12 Th10, 2023',
    score: '4.5/10',
    result: 'Không đạt',
    iconName: 'psychology',
    questionsDetail: [
      {
        questionNum: 1,
        questionText: 'Ai là tác giả của câu nói nổi tiếng "Tôi tư duy, nên tôi tồn tại"?',
        userAnswer: 'Immanuel Kant (Câu trả lời của bạn)',
        correctAnswer: 'René Descartes (Câu trả lời đúng)',
        isCorrect: false
      }
    ]
  },
  {
    id: 'HIST-004',
    title: 'Molecular Biology Midterm',
    department: 'Khoa Khoa học Tự nhiên',
    submitDate: '05 Th10, 2023',
    score: '7.8/10',
    result: 'Đạt',
    iconName: 'biotech',
    questionsDetail: [
      {
        questionNum: 1,
        questionText: 'Quá trình phiên mã tạo ra phân tử nào sau đây?',
        userAnswer: 'mRNA (Câu trả lời của bạn)',
        correctAnswer: 'mRNA',
        isCorrect: true
      }
    ]
  }
];

export const initialActiveExams: ActiveExam[] = [
  {
    id: 'EXAM-001',
    title: 'Kiểm tra giữa kỳ Giải tích tích phân nâng cao',
    subject: 'Toán học',
    duration: 90,
    questionCount: 45,
    description: 'Tập trung vào tích phân bội ba, trường vector và định lý Stokes.',
    iconName: 'functions',
    category: 'GIẢI TÍCH III'
  },
  {
    id: 'EXAM-002',
    title: 'Bài kiểm tra cuối kỳ Di truyền phân tử',
    subject: 'Sinh học',
    duration: 45,
    questionCount: 20,
    description: 'Ôn tập toàn diện về nhân đôi DNA và cơ chế CRISPR-Cas9.',
    iconName: 'biotech',
    category: 'SINH HỌC TẾ BÀO'
  },
  {
    id: 'EXAM-003',
    title: 'Đánh giá năng lực Thuật toán & Cấu trúc dữ liệu',
    subject: 'Khoa học máy tính',
    duration: 120,
    questionCount: 15,
    description: 'Đánh giá thực hành về bảng băm, cây tìm kiếm nhị phân và độ phức tạp.',
    iconName: 'code',
    category: 'LÕI CS'
  }
];
