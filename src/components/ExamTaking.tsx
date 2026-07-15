import React, { useState, useEffect } from 'react';
import { ActiveExam, Question, ExamHistory } from '../types';

interface ExamTakingProps {
  exam: ActiveExam;
  questions: Question[];
  onFinishExam: (historyItem: ExamHistory) => void;
}

export default function ExamTaking({ exam, questions, onFinishExam }: ExamTakingProps) {
  // Use specific question IDs if provided, otherwise filter by subject
  let examQuestions: Question[];
  if (exam.questionIds && exam.questionIds.trim() !== '') {
    try {
      const ids: string[] = JSON.parse(exam.questionIds);
      examQuestions = ids
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => q !== undefined);
    } catch {
      examQuestions = [];
    }
  } else {
    const filtered = questions.filter(
      q => q.subject.toLowerCase() === exam.subject.toLowerCase()
    );
    examQuestions = filtered.slice(0, exam.questionCount || 10);
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionIndex -> optionIndex selected
  const [flagged, setFlagged] = useState<Record<number, boolean>>({}); // questionIndex -> boolean flag
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60 - 15); // in seconds
  const [showToast, setShowToast] = useState(false);

  // Active countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = examQuestions[currentIndex] || examQuestions[0];

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
    // Show quick autosafe toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const handleSubmit = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài? Kết quả của bạn sẽ được chấm điểm ngay lập tức.')) {
      // Calculate grade
      let correctCount = 0;
      const detailsList = examQuestions.map((q, idx) => {
        const userOptIdx = answers[idx];
        const isCorrect = userOptIdx !== undefined && userOptIdx === q.correctAnswer;
        if (isCorrect) correctCount++;

        return {
          questionNum: idx + 1,
          questionText: q.content,
          userAnswer: userOptIdx !== undefined && q.options ? q.options[userOptIdx] : 'Không trả lời',
          correctAnswer: q.options && q.correctAnswer !== undefined ? q.options[q.correctAnswer] : 'Chưa cập nhật',
          isCorrect
        };
      });

      const finalScoreNum = (correctCount / examQuestions.length) * 10;
      const finalScoreStr = `${finalScoreNum.toFixed(1)}/10`;
      const pass = finalScoreNum >= 5;

      const dateStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const newHistoryItem: ExamHistory = {
        id: `HIST-${Math.floor(Math.random() * 90000) + 10000}`,
        title: exam.title,
        department: `Khoa ${exam.subject}`,
        submitDate: dateStr,
        score: finalScoreStr,
        result: pass ? 'Đạt' : 'Không đạt',
        iconName: exam.iconName,
        questionsDetail: detailsList
      };

      onFinishExam(newHistoryItem);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white border-b border-[#c2c6d6] shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold text-xl text-[#0058be]">EduAssess Pro</span>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase">{exam.title}</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium">Đang tự động lưu...</span>
          </div>

          <div className={`flex items-center gap-3 px-6 py-1.5 rounded-lg font-bold text-sm ${
            timeLeft < 300 ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-[#d8e2ff] text-[#001a42]'
          }`}>
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="font-mono text-base tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#d8e2ff] overflow-hidden border border-[#c2c6d6]">
            <img
              className="w-full h-full object-cover"
              alt="Avatar sinh viên"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6FRFJhX4pMb3V9j_jQ652Q7KdyDCO3WQbzLdsitVwJVyBhZW5lXCOss2FN--jKOYkK8faZ18FAbnkf3X72hMP04ZalSq4YjgO7GxAWSfl3X8KKGwPrnOtuANxGXg9mI9PL1J9Cb1kF_O2v2Of-hyCbybIYzXFRh9s3oHSF2MNNrFdBMyB6xPlXnowJmROF9cqRqEwVZ_Q_B3GtMQyjVSZTJGJxBEVz57nln9RRnVbI9MPaaniBmnJKMCYgALZnOZWuKtuc6SUr2dr"
            />
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="pt-24 pb-32 px-8 min-h-screen flex gap-6 max-w-[1280px] mx-auto">
        {/* Left/Center Content: Question Panel */}
        <section className="flex-1">
          <div className="bg-white rounded-2xl p-8 border border-[#c2c6d6] shadow-sm">
            {/* Header / Meta info */}
            <div className="flex justify-between items-center mb-8">
              <span className="px-4 py-1 bg-[#d6e0f3] text-[#001a42] rounded-full font-semibold text-xs uppercase tracking-wider">
                Câu hỏi {currentIndex + 1} / {examQuestions.length}
              </span>
              <span className="text-xs font-semibold text-gray-500">Điểm số định mức: 2.0</span>
            </div>

            {/* Question Body */}
            <div className="mb-8">
              <h2 className="text-xl font-bold leading-relaxed text-[#191c1d] mb-6">
                {currentQuestion.content}
              </h2>

              {/* Graphical illustration for math */}
              {exam.iconName === 'functions' && (
                <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 h-64 w-full relative bg-gray-50 flex items-center justify-center">
                  <img
                    className="w-full h-full object-contain p-2"
                    alt="Biểu đồ toán học"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfv_Db8iU0zrkMeDSaMHvo-HIyd_ylyDQQuI8RG9GRIbfIEVIJmVOYQduz7iBgjRj2IODbQbOfmEf9JOV-CYNV8waxx8ZTXjKxGii-197wbtE9VD1cabq03nHD0zzxD0JieEIKPTn-YzyuEkisSsqU4nIxYpqDX5352e08QrLOTNA5YruCxgPE9aBiNH8lTqYJypLYW2XqoWOa6ZW1xzQrhXD2XUlKzU3fePy-jeXum9GXFlCXd1eAqE7qdiKniGFpOf_oo4IYlze-"
                  />
                </div>
              )}
            </div>

            {/* MCQ Options Radio Buttons */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {currentQuestion.options?.map((option, idx) => {
                const labelLetter = String.fromCharCode(65 + idx); // A, B, C, D
                const isChecked = answers[currentIndex] === idx;

                return (
                  <div key={idx} className="relative">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left flex items-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-[#0058be] bg-[#d8e2ff]'
                          : 'border-gray-200 hover:border-[#0058be] hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-4 transition-colors ${
                        isChecked ? 'bg-[#0058be] text-white' : 'bg-gray-100 text-[#191c1d]'
                      }`}>
                        {labelLetter}
                      </span>
                      <span className="text-sm font-semibold text-[#191c1d]">{option}</span>
                    </button>
                  </div>
                );
              })}
            </form>
          </div>
        </section>

        {/* Right Sidebar: Navigation Grid */}
        <aside className="w-80 flex flex-col gap-6 flex-shrink-0">
          <div className="bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base text-[#191c1d]">Tiến trình</h3>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-semibold">
                {Object.keys(answers).length} / {examQuestions.length} Đã chọn
              </span>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-5 gap-3">
              {examQuestions.map((_, idx) => {
                const isSelected = currentIndex === idx;
                const isAnswered = answers[idx] !== undefined;
                const isFlagged = flagged[idx];

                let btnStyle = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                if (isAnswered) {
                  btnStyle = 'bg-[#0058be] text-white hover:bg-blue-700';
                }
                if (isFlagged) {
                  btnStyle = 'bg-[#ba1a1a] text-white hover:bg-red-800';
                }
                if (isSelected) {
                  btnStyle += ' ring-4 ring-blue-200 border border-[#0058be]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm cursor-pointer transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend guide */}
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#0058be]"></span>
                <span className="text-xs text-gray-500 font-semibold">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gray-100"></span>
                <span className="text-xs text-gray-500 font-semibold">Chưa làm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full border border-[#0058be]"></span>
                <span className="text-xs text-gray-500 font-semibold">Câu hiện tại</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
                <span className="text-xs text-gray-500 font-semibold">Đã đánh dấu xem lại</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleFlag}
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 font-bold transition-colors ${
              flagged[currentIndex]
                ? 'bg-red-50 border-[#ba1a1a] text-[#ba1a1a]'
                : 'border-red-600 text-red-600 hover:bg-red-50'
            }`}
          >
            <span className="material-symbols-outlined">flag</span>
            {flagged[currentIndex] ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại'}
          </button>
        </aside>
      </main>

      {/* Sticky Bottom Actions Bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-[#c2c6d6] p-4 z-50 shadow-lg">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Câu trước
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
              disabled={currentIndex === examQuestions.length - 1}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              Câu tiếp theo
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="px-10 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
          >
            Nộp bài thi
            <span className="material-symbols-outlined text-sm">done_all</span>
          </button>
        </div>
      </footer>

      {/* Auto-save success toast */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-6 py-3 rounded-full shadow-xl transition-all duration-300 pointer-events-none z-50 ${
        showToast ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
      }`}>
        Lựa chọn của bạn đã được tự động lưu thành công.
      </div>
    </div>
  );
}
