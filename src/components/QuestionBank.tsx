import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { authFetch } from '../api';

interface QuestionBankProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

interface Subject {
  code: string;
  name: string;
}

export default function QuestionBank({ questions, onAddQuestion, onEditQuestion, onDeleteQuestion }: QuestionBankProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả môn học');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Tất cả độ khó');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form Fields
  const [formSubject, setFormSubject] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Trung bình');
  const [formContent, setFormContent] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [formTopic, setFormTopic] = useState('Đại số tuyến tính');

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
            setFormSubject(data[0].name);
          }
        }
      })
      .catch(err => console.error('Error fetching subjects:', err));
  }, []);

  const openAddModal = () => {
    setEditingQuestion(null);
    setFormSubject(subjects[0]?.name || '');
    setFormDifficulty('Trung bình');
    setFormContent('');
    setFormOptions(['', '', '', '']);
    setCorrectAnswerIndex(0);
    setFormTopic('Đại số');
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormSubject(q.subject);
    setFormDifficulty(q.difficulty);
    setFormContent(q.content);
    setFormOptions(q.options || ['', '', '', '']);
    setCorrectAnswerIndex(q.correctAnswer || 0);
    setFormTopic(q.topic || 'Chưa phân loại');
    setIsModalOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...formOptions];
    updated[index] = value;
    setFormOptions(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    if (editingQuestion) {
      // Edit mode
      const updatedQuestion: Question = {
        ...editingQuestion,
        subject: formSubject,
        difficulty: formDifficulty,
        content: formContent,
        options: formOptions,
        correctAnswer: correctAnswerIndex,
        topic: formTopic
      };
      onEditQuestion(updatedQuestion);
    } else {
      // Add mode
      const randomId = `#Q-${Math.floor(10000 + Math.random() * 90000)}`;
      const newQuestion: Question = {
        id: randomId,
        subject: formSubject,
        difficulty: formDifficulty,
        content: formContent,
        options: formOptions,
        correctAnswer: correctAnswerIndex,
        topic: formTopic,
        avgTime: '02:00',
        errorRate: 35.0
      };
      onAddQuestion(newQuestion);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa câu hỏi ${id} khỏi ngân hàng câu hỏi?`)) {
      onDeleteQuestion(id);
    }
  };

  // Filtering Logic
  const filteredQuestions = questions.filter(q => {
    const matchSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) || q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = selectedSubject === 'Tất cả môn học' || q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchDifficulty = selectedDifficulty === 'Tất cả độ khó' || q.difficulty === selectedDifficulty;
    return matchSearch && matchSubject && matchDifficulty;
  });

  return (
    <div className="space-y-8">
      {/* Page Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý Ngân hàng Câu hỏi</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và tổ chức kho lưu trữ câu hỏi thi học thuật của bạn.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#0058be] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm câu hỏi mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#c2c6d6] rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs focus:ring-2 focus:ring-[#0058be]/20 focus:border-[#0058be] outline-none transition-all"
            placeholder="Tìm kiếm câu hỏi hoặc mã..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs font-semibold outline-none appearance-none cursor-pointer pr-10 relative text-[#191c1d]"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option>Tất cả môn học</option>
          {subjects.map(s => (
            <option key={s.code} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          className="px-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs font-semibold outline-none appearance-none cursor-pointer pr-10 text-[#191c1d]"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option>Tất cả độ khó</option>
          <option>Dễ</option>
          <option>Trung bình</option>
          <option>Khó</option>
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setSelectedSubject('Tất cả môn học'); setSelectedDifficulty('Tất cả độ khó'); }}
          className="flex items-center justify-center p-2 text-[#0058be] hover:bg-blue-50 rounded-xl transition-colors text-xs font-semibold"
          title="Đặt lại bộ lọc"
        >
          <span className="material-symbols-outlined text-lg">filter_list_off</span>
        </button>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-[#c2c6d6] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f3f4f5] border-b border-[#c2c6d6]">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã câu hỏi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung câu hỏi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Môn học</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Độ khó</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d6]">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-[#f3f4f5]/40 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">{q.id}</td>
                    <td className="px-6 py-4 text-sm text-[#191c1d] max-w-md truncate" title={q.content}>
                      {q.content}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">{q.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        q.difficulty === 'Dễ' 
                          ? 'bg-green-100 text-green-700' 
                          : q.difficulty === 'Trung bình'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 text-gray-500 hover:text-[#0058be] hover:bg-blue-50 rounded-lg transition-all"
                          title="Sửa câu hỏi"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa câu hỏi"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer meta */}
        <div className="px-6 py-4 bg-[#f3f4f5]/60 border-t border-[#c2c6d6] flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">
            Hiển thị 1 đến {filteredQuestions.length} trong tổng số {filteredQuestions.length} câu hỏi phù hợp
          </p>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 border border-[#c2c6d6] bg-white rounded hover:bg-gray-50 disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-7 h-7 flex items-center justify-center bg-[#0058be] text-white rounded text-xs font-bold">1</button>
            <button className="p-1.5 border border-[#c2c6d6] bg-white rounded hover:bg-gray-50 disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
              <h2 className="text-lg font-bold text-[#191c1d]">
                {editingQuestion ? 'Sửa thông tin câu hỏi' : 'Thêm câu hỏi mới vào kho lưu trữ'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Môn học</label>
                  <select
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  >
                    {subjects.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Độ khó</label>
                  <select
                    className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as 'Dễ' | 'Trung bình' | 'Khó')}
                  >
                    <option>Dễ</option>
                    <option>Trung bình</option>
                    <option>Khó</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Chủ đề bài giảng / Chương</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                  placeholder="Ví dụ: Quy hoạch động, Giải tích I,..."
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nội dung câu hỏi</label>
                <textarea
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm resize-none"
                  placeholder="Nhập nội dung câu hỏi tại đây..."
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              {/* MCQ Options */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Các phương án (Chọn 1 phương án đúng làm đáp án chính thức)
                </label>

                {[0, 1, 2, 3].map((idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#0058be] transition-colors bg-white"
                    >
                      <input
                        type="radio"
                        name="correct-option-radio"
                        checked={correctAnswerIndex === idx}
                        onChange={() => setCorrectAnswerIndex(idx)}
                        className="w-4 h-4 text-[#0058be] focus:ring-[#0058be]"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formOptions[idx]}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
                          placeholder={`Nhập phương án ${letter}`}
                          required
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-400">{letter}</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0058be] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  {editingQuestion ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
