import React from 'react';
import { Question } from '../../types';

interface QuestionTableProps {
  paginatedQuestions: Question[];
  filteredQuestions: Question[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  openEditModal: (q: Question) => void;
  handleDelete: (id: string) => void;
}

export default function QuestionTable({
  paginatedQuestions,
  filteredQuestions,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  openEditModal,
  handleDelete,
}: QuestionTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#c2c6d6] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f3f4f5] border-b border-[#c2c6d6]">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Mã câu hỏi
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nội dung câu hỏi
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Môn học
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Độ khó
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c2c6d6]">
            {paginatedQuestions.length > 0 ? (
              paginatedQuestions.map(q => (
                <tr key={q.id} className="hover:bg-[#f3f4f5]/40 transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">{q.id}</td>
                  <td
                    className="px-6 py-4 text-sm text-[#191c1d] max-w-md truncate"
                    title={q.content}
                  >
                    {q.content}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-600">{q.subject}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        q.difficulty === 'Dễ'
                          ? 'bg-green-100 text-green-700'
                          : q.difficulty === 'Trung bình'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
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
          Hiển thị {paginatedQuestions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}{' '}
          đến {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} trong tổng số{' '}
          {filteredQuestions.length} câu hỏi phù hợp
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-[#c2c6d6] bg-white rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                currentPage === page
                  ? 'bg-[#0058be] text-white shadow-sm'
                  : 'border border-[#c2c6d6] bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 border border-[#c2c6d6] bg-white rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
