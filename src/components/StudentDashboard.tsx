import React from 'react';
import { ActiveExam, ExamHistory } from '../types';

interface StudentDashboardProps {
  userName: string;
  activeExams: ActiveExam[];
  onStartExam: (exam: ActiveExam) => void;
  completedExamsCount: number;
  examHistory: ExamHistory[];
}

export default function StudentDashboard({
  userName,
  activeExams,
  onStartExam,
  completedExamsCount,
  examHistory,
}: StudentDashboardProps) {
  // Extract simple first name
  const firstName = userName.split(' ').pop() || userName;

  // Calculate dynamic GPA
  const calculateGPA = () => {
    if (!examHistory || examHistory.length === 0) return { gpa: '0.0', text: 'Chưa có điểm thi' };
    let totalNormalized = 0;
    let count = 0;
    examHistory.forEach(h => {
      if (!h.score) return;
      const match = h.score.match(/^([\d.]+)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (h.score.includes('%')) {
          totalNormalized += (val / 100) * 4.0;
        } else if (h.score.includes('/10')) {
          totalNormalized += (val / 10) * 4.0;
        } else if (val <= 10) {
          totalNormalized += (val / 10) * 4.0;
        } else if (val <= 100) {
          totalNormalized += (val / 100) * 4.0;
        }
        count++;
      }
    });
    if (count === 0) return { gpa: '0.0', text: 'Chưa có điểm thi' };
    const avg = totalNormalized / count;
    return { gpa: avg.toFixed(2), text: `Tính từ ${count} kỳ thi` };
  };

  const gpaInfo = calculateGPA();

  // Calculate dynamic study hours from completed exams + preparation estimate
  const calculateStudyHours = () => {
    if (!examHistory || examHistory.length === 0) return '0.0 giờ';
    const totalMinutes = examHistory.reduce((sum, h) => {
      const qCount = h.questionsDetail ? h.questionsDetail.length : 30;
      return sum + qCount * 1.5;
    }, 0);
    const hours = (totalMinutes * 1.5) / 60;
    return `${hours.toFixed(1)} giờ`;
  };

  // Calculate dynamic subject progress from active and completed exams
  const calculateSubjectProgress = () => {
    const subjectsMap: { [key: string]: { total: number; completed: number } } = {};
    activeExams.forEach(e => {
      const sub = e.subject || 'Kiểm tra chung';
      if (!subjectsMap[sub]) subjectsMap[sub] = { total: 0, completed: 0 };
      subjectsMap[sub].total += 1;
    });
    examHistory.forEach(h => {
      const sub = h.department || (h.title ? h.title.split('-')[0].trim() : 'Kiểm tra chung');
      if (!subjectsMap[sub]) subjectsMap[sub] = { total: 0, completed: 0 };
      subjectsMap[sub].completed += 1;
      if (subjectsMap[sub].total < subjectsMap[sub].completed) {
        subjectsMap[sub].total = subjectsMap[sub].completed;
      }
    });

    const entries = Object.entries(subjectsMap);
    if (entries.length === 0) {
      return [{ name: 'Học phần Đại cương', percent: 0 }];
    }
    return entries.slice(0, 4).map(([name, stats]) => {
      const pct =
        stats.total > 0
          ? Math.round(
              (stats.completed / (stats.total + (stats.completed === stats.total ? 0 : 1))) * 100,
            )
          : 0;
      return { name, percent: Math.min(100, Math.max(10, pct)) };
    });
  };

  const studyHours = calculateStudyHours();
  const subjectProgressList = calculateSubjectProgress();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Chào mừng trở lại, {firstName}!</h1>
          <p className="text-base text-gray-500 mt-1">
            Bạn có <span className="font-semibold text-[#0058be]">{activeExams.length} kỳ thi</span>{' '}
            sắp tới trong tuần này.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              alert('Đang đồng bộ hóa lịch trình từ Microsoft Outlook / Google Calendar...')
            }
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c2c6d6] text-[#191c1d] font-semibold text-xs rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Xem lịch trình học tập
          </button>
        </div>
      </section>

      {/* Quick Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 p-6 bg-[#0058be] text-white rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wider text-[#adc6ff] font-semibold">
              Điểm trung bình tích lũy (GPA)
            </p>
            <h3 className="text-4xl font-extrabold mt-2">{gpaInfo.gpa} / 4.0</h3>
            <p className="text-xs text-[#adc6ff] mt-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              {gpaInfo.text}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[120px]">auto_graph</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-[#c2c6d6] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#d6e0f3] flex items-center justify-center text-[#0058be] mb-4">
              <span className="material-symbols-outlined">timer</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Số giờ tự học
            </p>
          </div>
          <h3 className="text-2xl font-bold text-[#191c1d] mt-2">
            {studyHours} <span className="text-xs font-normal text-gray-400">tích lũy</span>
          </h3>
        </div>

        <div className="p-6 bg-white border border-[#c2c6d6] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#dce2f3] flex items-center justify-center text-gray-600 mb-4">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Kỳ thi đã làm xong
            </p>
          </div>
          <h3 className="text-2xl font-bold text-[#191c1d] mt-2">
            {completedExamsCount}{' '}
            <span className="text-xs font-normal text-gray-400">tổng cộng</span>
          </h3>
        </div>
      </section>

      {/* Available Exams Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#191c1d]">Kỳ thi hiện có</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
              Đang diễn ra
            </span>
          </div>
          <button
            onClick={() => alert('Bạn đang xem toàn bộ kỳ thi được chỉ định cho lớp của mình.')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0058be] font-bold transition-colors"
          >
            <span>Xem tất cả</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Exam Card List */}
        <div className="space-y-4">
          {activeExams.map(exam => (
            <div
              key={exam.id}
              className="group bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-[#0058be]/30 transition-all duration-300 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-[#0058be] border border-blue-100 flex-shrink-0">
                <span className="material-symbols-outlined text-[32px]">
                  {exam.iconName === 'functions'
                    ? 'functions'
                    : exam.iconName === 'biotech'
                      ? 'biotech'
                      : 'code'}
                </span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#0058be] uppercase tracking-wider">
                    {exam.subject}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">
                    {exam.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#191c1d] mt-1">{exam.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{exam.description}</p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-1 px-6 border-x border-gray-100 hidden lg:flex">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="material-symbols-outlined text-[18px] text-gray-400">
                    schedule
                  </span>
                  <span className="text-xs font-semibold">{exam.duration} Phút</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 mt-1">
                  <span className="material-symbols-outlined text-[18px] text-gray-400">quiz</span>
                  <span className="text-xs font-semibold">{exam.questionCount} Câu hỏi</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={() => onStartExam(exam)}
                  className="w-full md:w-auto bg-[#0058be] text-white px-6 py-3 rounded-xl font-semibold text-xs shadow-md shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Bắt đầu làm bài
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Information Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications/Feed */}
        <div className="lg:col-span-2 bg-white border border-[#c2c6d6] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-base font-bold text-[#191c1d]">Thông báo mới nhất</h3>
            <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-gray-600">
              more_vert
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-6 flex gap-4 hover:bg-gray-50/30 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center text-[#2170e4] flex-shrink-0">
                <span className="material-symbols-outlined">info</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-[#191c1d]">Bảo trì hệ thống định kỳ</p>
                <p className="text-xs text-gray-500 mt-1">
                  Cổng thông tin thi trực tuyến sẽ tạm đóng trong 2 giờ vào Thứ Bảy tuần này từ lúc
                  2:00 sáng để nâng cấp bảo mật.
                </p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">
                  2 giờ trước
                </p>
              </div>
            </div>
            <div className="p-6 flex gap-4 hover:bg-gray-50/30 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center text-gray-600 flex-shrink-0">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-[#191c1d]">
                  Tài liệu học tập mới được tải lên
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Giảng viên môn Giải tích III vừa đăng tải hướng dẫn ôn tập chương 4: Hệ thống tích
                  phân Stokes.
                </p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Hôm qua</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress sidebar */}
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#191c1d] mb-6">Tiến độ khóa học</h3>
          <div className="space-y-6">
            {subjectProgressList.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-[#191c1d] truncate max-w-[180px]">{item.name}</span>
                  <span className="text-[#0058be] font-bold">{item.percent}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0058be] rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border border-gray-100">
              <span className="material-symbols-outlined text-[#0058be] text-xl">
                tips_and_updates
              </span>
              <div>
                <p className="text-xs font-bold text-[#191c1d]">Mẹo học tập hiệu quả</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  Những sinh viên chủ động xem lại lời giải chi tiết và câu trả lời sai trong phần{' '}
                  <strong>'Lịch sử'</strong> thường tăng kết quả thi thực tế thêm 15%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
