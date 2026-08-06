import React from 'react';
import { Question } from '../../types';
import { useQuestionBank } from './useQuestionBank';
import QuestionTable from './QuestionTable';
import QuestionFormModal from './QuestionFormModal';

interface QuestionBankProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export default function QuestionBank(props: QuestionBankProps) {
  const {
    searchTerm,
    setSearchTerm,
    selectedSubject,
    setSelectedSubject,
    selectedDifficulty,
    setSelectedDifficulty,
    subjects,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    isModalOpen,
    setIsModalOpen,
    editingQuestion,
    formSubject,
    setFormSubject,
    formDifficulty,
    setFormDifficulty,
    formContent,
    setFormContent,
    formOptions,
    correctAnswerIndex,
    setCorrectAnswerIndex,
    formTopic,
    setFormTopic,
    openAddModal,
    openEditModal,
    handleOptionChange,
    handleSave,
    handleDelete,
    filteredQuestions,
    totalPages,
    paginatedQuestions,
  } = useQuestionBank(props);

  return (
    <div className="space-y-8">
      {/* Page Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý Ngân hàng Câu hỏi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và tổ chức kho lưu trữ câu hỏi thi học thuật của bạn.
          </p>
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs focus:ring-2 focus:ring-[#0058be]/20 focus:border-[#0058be] outline-none transition-all"
            placeholder="Tìm kiếm câu hỏi hoặc mã..."
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs font-semibold outline-none appearance-none cursor-pointer pr-10 relative text-[#191c1d]"
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
        >
          <option>Tất cả môn học</option>
          {subjects.map(s => (
            <option key={s.code} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 bg-[#f8f9fa] border border-[#c2c6d6] rounded-xl text-xs font-semibold outline-none appearance-none cursor-pointer pr-10 text-[#191c1d]"
          value={selectedDifficulty}
          onChange={e => setSelectedDifficulty(e.target.value)}
        >
          <option>Tất cả độ khó</option>
          <option>Dễ</option>
          <option>Trung bình</option>
          <option>Khó</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedSubject('Tất cả môn học');
            setSelectedDifficulty('Tất cả độ khó');
          }}
          className="flex items-center justify-center p-2 text-[#0058be] hover:bg-blue-50 rounded-xl transition-colors text-xs font-semibold"
          title="Đặt lại bộ lọc"
        >
          <span className="material-symbols-outlined text-lg">filter_list_off</span>
        </button>
      </div>

      {/* Data Table Card */}
      <QuestionTable
        paginatedQuestions={paginatedQuestions}
        filteredQuestions={filteredQuestions}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
      />

      {/* Add / Edit Question Modal */}
      <QuestionFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingQuestion={editingQuestion}
        subjects={subjects}
        formSubject={formSubject}
        setFormSubject={setFormSubject}
        formDifficulty={formDifficulty}
        setFormDifficulty={setFormDifficulty}
        formTopic={formTopic}
        setFormTopic={setFormTopic}
        formContent={formContent}
        setFormContent={setFormContent}
        formOptions={formOptions}
        handleOptionChange={handleOptionChange}
        correctAnswerIndex={correctAnswerIndex}
        setCorrectAnswerIndex={setCorrectAnswerIndex}
        handleSave={handleSave}
      />
    </div>
  );
}
