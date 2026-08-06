import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { authFetch } from '../../api';

export interface Subject {
  code: string;
  name: string;
}

interface UseQuestionBankProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export function useQuestionBank({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: UseQuestionBankProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả môn học');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Tất cả độ khó');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    try {
      if (editingQuestion) {
        // Edit mode
        const updatedQuestion: Question = {
          ...editingQuestion,
          subject: formSubject,
          difficulty: formDifficulty,
          content: formContent,
          options: formOptions,
          correctAnswer: correctAnswerIndex,
          topic: formTopic,
        };
        await onEditQuestion(updatedQuestion);
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
          errorRate: 35.0,
        };
        await onAddQuestion(newQuestion);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi lưu câu hỏi.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa câu hỏi ${id} khỏi ngân hàng câu hỏi?`)) {
      onDeleteQuestion(id);
    }
  };

  // Filtering Logic
  const filteredQuestions = questions.filter(q => {
    const matchSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject =
      selectedSubject === 'Tất cả môn học' ||
      (q.subject || '').toLowerCase() === selectedSubject.toLowerCase();
    const diff = (q.difficulty || '').toLowerCase();
    const matchDifficulty =
      selectedDifficulty === 'Tất cả độ khó' ||
      diff === selectedDifficulty.toLowerCase() ||
      (selectedDifficulty === 'Dễ' && diff === 'easy') ||
      (selectedDifficulty === 'Trung bình' && diff === 'medium') ||
      (selectedDifficulty === 'Khó' && diff === 'hard');
    return matchSearch && matchSubject && matchDifficulty;
  });

  // eslint-disable-next-line
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedDifficulty]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return {
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
  };
}
