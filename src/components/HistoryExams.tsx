import React, { useState } from 'react';
import { ExamHistory } from '../types';

interface HistoryExamsProps {
  history: ExamHistory[];
  role: 'student' | 'teacher' | 'admin';
}

export default function HistoryExams({ history, role }: HistoryExamsProps) {
  const [selectedExam, setSelectedExam] = useState<ExamHistory | null>(null);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#191c1d]">
          {role === 'student' ? 'Lịch sử kỳ thi của bạn' : 'Lịch sử kiểm tra & Báo cáo'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'student' 
            ? 'Xem lại bảng điểm, thời gian nộp và rà soát kỹ lưỡng các lỗi trả lời sai.' 
            : 'Tổng hợp danh sách các kỳ thi đã hoàn thành bởi thí sinh toàn trường.'}
        </p>
      </div>

      {/* History Grid/List cards */}
      <section className="space-y-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-[#0058be]">
                <span className="material-symbols-outlined text-2xl">
                  {item.iconName === 'functions' ? 'functions' : item.iconName === 'biotech' ? 'biotech' : item.iconName === 'psychology' ? 'psychology' : 'code'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.department}</span>
                <h3 className="text-base font-bold text-[#191c1d] mt-0.5">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Đã nộp vào {item.submitDate}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Kết quả / Điểm</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                    item.result === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.result}
                  </span>
                  <span className="font-extrabold text-[#191c1d] text-base">{item.score}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedExam(item)}
                className="px-4 py-2 border border-[#c2c6d6] text-[#0058be] font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors"
              >
                Xem chi tiết bài thi
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Detail Analysis Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedExam(null)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0058be]">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#191c1d]">{selectedExam.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Báo cáo kiểm duyệt kết quả kiểm tra</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedExam(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {/* Score card overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-[#f8f9fa] border border-gray-200 rounded-2xl">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Điểm số thu hoạch</p>
                  <p className="text-2xl font-black text-[#191c1d] mt-1">{selectedExam.score}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trạng thái phê duyệt</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-2 ${
                    selectedExam.result === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedExam.result}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Thời điểm nộp bài</p>
                  <p className="text-sm font-semibold text-gray-700 mt-2">{selectedExam.submitDate}</p>
                </div>
              </div>

              {/* Questions review title */}
              <div>
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Danh sách câu hỏi & Rà soát bài thi</h3>
                <div className="space-y-4">
                  {selectedExam.questionsDetail && selectedExam.questionsDetail.length > 0 ? (
                    selectedExam.questionsDetail.map((q) => (
                      <div 
                        key={q.questionNum} 
                        className={`p-5 rounded-2xl border ${
                          q.isCorrect ? 'border-green-200 bg-green-50/10' : 'border-red-200 bg-red-50/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs flex-shrink-0 ${
                            q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {q.questionNum}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[#191c1d] leading-relaxed">{q.questionText}</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                              <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lựa chọn của bạn</p>
                                <p className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${
                                  q.isCorrect ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  <span className="material-symbols-outlined text-[16px]">
                                    {q.isCorrect ? 'check_circle' : 'cancel'}
                                  </span>
                                  {q.userAnswer}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đáp án chính xác</p>
                                <p className="text-xs font-semibold text-green-700 mt-1 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  {q.correctAnswer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Không có thông tin chi tiết các câu trả lời.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedExam(null)}
                className="px-6 py-2 bg-[#0058be] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
