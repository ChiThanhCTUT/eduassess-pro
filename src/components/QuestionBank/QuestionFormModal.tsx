import React from 'react';
import { Question } from '../../types';
import { Subject } from './useQuestionBank';

interface QuestionFormModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingQuestion: Question | null;
  subjects: Subject[];
  formSubject: string;
  setFormSubject: (subject: string) => void;
  formDifficulty: 'Dễ' | 'Trung bình' | 'Khó';
  setFormDifficulty: (difficulty: 'Dễ' | 'Trung bình' | 'Khó') => void;
  formTopic: string;
  setFormTopic: (topic: string) => void;
  formContent: string;
  setFormContent: (content: string) => void;
  formOptions: string[];
  handleOptionChange: (index: number, value: string) => void;
  correctAnswerIndex: number;
  setCorrectAnswerIndex: (index: number) => void;
  handleSave: (e: React.FormEvent) => void;
}

export default function QuestionFormModal({
  isModalOpen,
  setIsModalOpen,
  editingQuestion,
  subjects,
  formSubject,
  setFormSubject,
  formDifficulty,
  setFormDifficulty,
  formTopic,
  setFormTopic,
  formContent,
  setFormContent,
  formOptions,
  handleOptionChange,
  correctAnswerIndex,
  setCorrectAnswerIndex,
  handleSave,
}: QuestionFormModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsModalOpen(false)}
      ></div>
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Môn học
              </label>
              <select
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Độ khó
              </label>
              <select
                className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
                value={formDifficulty}
                onChange={e => setFormDifficulty(e.target.value as 'Dễ' | 'Trung bình' | 'Khó')}
              >
                <option>Dễ</option>
                <option>Trung bình</option>
                <option>Khó</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Chủ đề bài giảng / Chương
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm"
              placeholder="Ví dụ: Quy hoạch động, Giải tích I,..."
              value={formTopic}
              onChange={e => setFormTopic(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Nội dung câu hỏi
            </label>
            <textarea
              className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl outline-none focus:ring-2 focus:ring-[#0058be] text-sm resize-none"
              placeholder="Nhập nội dung câu hỏi tại đây..."
              rows={4}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              required
            />
          </div>

          {/* MCQ Options */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Các phương án (Chọn 1 phương án đúng làm đáp án chính thức)
            </label>

            {[0, 1, 2, 3].map(idx => {
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
                      onChange={e => handleOptionChange(idx, e.target.value)}
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
  );
}
