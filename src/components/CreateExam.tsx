import React, { useState, useEffect } from 'react';
import { ActiveExam, ClassItem } from '../types';

import { authFetch } from '../api';

interface CreateExamProps {
  onCreateExam: (newExam: ActiveExam) => void;
}

export default function CreateExam({ onCreateExam }: CreateExamProps) {
  const [examTitle, setExamTitle] = useState('Đánh giá năng lực Đại số tuyến tính nâng cao');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(90);
  const [questionCount, setQuestionCount] = useState(20);
  const [category, setCategory] = useState('ĐẠI SỐ TUYẾN TÍNH');
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    authFetch('/api/subjects')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách môn học');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSubjects(data);
          if (data.length > 0) {
            setSubject(data[0].name);
          }
        }
      })
      .catch(err => console.error('Error fetching subjects:', err));

    authFetch('/api/classes')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách lớp học');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
        }
      })
      .catch(err => console.error('Error fetching classes:', err));
  }, []);

  // Sliders for difficulty
  const [easyPercent, setEasyPercent] = useState(40);
  const [mediumPercent, setMediumPercent] = useState(40);
  const [hardPercent, setHardPercent] = useState(20);

  const [description, setDescription] = useState(
    'Kỳ thi đánh giá năng lực nâng cao cho sinh viên kỹ thuật về giải thuật ma trận, không gian Euclid.'
  );

  const totalPercent = easyPercent + mediumPercent + hardPercent;

  // Real-time calculation of question count per tier
  const easyCount = Math.round((questionCount * easyPercent) / 100);
  const mediumCount = Math.round((questionCount * mediumPercent) / 100);
  const hardCount = questionCount - easyCount - mediumCount;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!examTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài thi.');
      return;
    }

    if (totalPercent !== 100) {
      alert(`Tổng tỷ lệ phần trăm phân bổ độ khó phải bằng 100%. Hiện tại đang là ${totalPercent}%.`);
      return;
    }

    const randomId = `EXAM-${Math.floor(100 + Math.random() * 900)}`;
    const iconNameMap: Record<string, string> = {
      'Toán học': 'functions',
      'Vật lý lượng tử': 'biotech',
      'Sinh học': 'biotech',
      'Vật lý': 'biotech',
      'Khoa học máy tính': 'code'
    };

    const newExam: ActiveExam = {
      id: randomId,
      title: examTitle,
      subject: subject,
      duration: Number(duration),
      questionCount: Number(questionCount),
      description: description,
      iconName: iconNameMap[subject] || 'code',
      category: category.toUpperCase() || 'CHƯA PHÂN LOẠI',
      class_id: selectedClassId
    };

    onCreateExam(newExam);
    alert(`Đề thi "${examTitle}" đã được tạo thành công và xuất bản đến thí sinh!`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#191c1d]">Tạo đề thi mới</h1>
        <p className="text-sm text-gray-500 mt-1">Cấu hình đề thi tự động từ kho dữ liệu câu hỏi thông minh.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Controls - 2 cols */}
        <div className="lg:col-span-2 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tiêu đề đề thi</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm font-semibold"
                placeholder="Ví dụ: Kiểm tra giữa học kỳ Giải tích"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Môn học chủ trì</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map(s => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Phân mục học thuật</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                  placeholder="Ví dụ: ĐẠI SỐ TUYẾN TÍNH"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Lớp học áp dụng</label>
              <select
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                value={selectedClassId ?? ''}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Tất cả lớp (không giới hạn) --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Thời gian làm bài (Phút)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tổng số lượng câu hỏi</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mô tả tóm tắt kỳ thi</label>
              <textarea
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm resize-none"
                placeholder="Mô tả tóm tắt về đề thi để thí sinh dễ dàng ôn tập và chuẩn bị tâm lý..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Interactive sliders for difficulty ratio */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Cấu hình Tỷ lệ phân bổ độ khó (%)
                </label>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  totalPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-bounce'
                }`}>
                  Tổng: {totalPercent}% / 100%
                </span>
              </div>

              <div className="space-y-4">
                {/* Dễ */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Phân khúc Dễ</span>
                    <span className="text-[#0058be]">{easyPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full accent-[#0058be] h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                    value={easyPercent}
                    onChange={(e) => setEasyPercent(Number(e.target.value))}
                  />
                </div>

                {/* Trung bình */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Phân khúc Trung bình</span>
                    <span className="text-[#0058be]">{mediumPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full accent-[#0058be] h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                    value={mediumPercent}
                    onChange={(e) => setMediumPercent(Number(e.target.value))}
                  />
                </div>

                {/* Khó */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Phân khúc Khó</span>
                    <span className="text-[#0058be]">{hardPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full accent-[#0058be] h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                    value={hardPercent}
                    onChange={(e) => setHardPercent(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => alert('Đã lưu đề thi vào kho lưu trữ nháp.')}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-[#191c1d] text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Lưu làm bản nháp
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0058be] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
              >
                Tạo và Xuất bản đề thi
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Preview - 1 col */}
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="font-bold text-base text-[#191c1d] mb-4">Xem trước thống kê đề thi</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Hệ thống sẽ tự động quét và lựa chọn ngẫu nhiên các câu hỏi từ ngân hàng dựa trên cấu hình phân bổ bên cạnh.
            </p>

            {/* Structure analysis */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-[#191c1d]">Số câu hỏi Dễ</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Thời gian đề xuất: 1 phút / câu</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#0058be] text-base">{easyCount} câu</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{easyPercent}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-[#191c1d]">Số câu hỏi Trung bình</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Thời gian đề xuất: 2.5 phút / câu</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#0058be] text-base">{mediumCount} câu</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{mediumPercent}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-[#191c1d]">Số câu hỏi Khó</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Thời gian đề xuất: 4.5 phút / câu</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#0058be] text-base">{hardCount} câu</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{hardPercent}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058be]">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#191c1d]">Thuật toán phân tích</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Đề thi được cấu hình đảm bảo độ bao phủ nội dung 100% chương trình.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
