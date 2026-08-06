import React, { useState } from 'react';
import { Role, Question, ExamHistory, ActiveExam } from './types';

// Khai báo các Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/StudentDashboard';
import ExamTaking from './components/ExamTaking';
import QuestionBank from './components/QuestionBank';
import CreateExam from './components/CreateExam';
import ExamAnalytics from './components/ExamAnalytics';
import HistoryExams from './components/HistoryExams';
import AdminUsers from './components/AdminUsers';
import AdminDepartments from './components/AdminDepartments';
import AdminClasses from './components/AdminClasses';



import { authFetch, handleResponse } from './api';
export { authFetch };

import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';

export default function App() {
  const {
    isLoggedIn, role, userName, studentId, currentTab, setCurrentTab, handleLogin, handleLogout
  } = useAuth();

  const {
    questions, setQuestions,
    examHistory, setExamHistory,
    activeExams, setActiveExams,
    isLoading, refreshAppData
  } = useAppData(isLoggedIn);

  // Trạng thái đang thi
  const [takingExam, setTakingExam] = useState<ActiveExam | null>(null);

  // Luồng xử lý thi
  const handleStartExam = (exam: ActiveExam) => {
    setTakingExam(exam);
  };

  const handleFinishExam = (newHistoryItem: ExamHistory) => {
    authFetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHistoryItem),
    })
      .then(handleResponse)
      .then(data => {
        setExamHistory(prev => [data, ...prev]);
        setActiveExams(prev => prev.filter(e => e.id !== newHistoryItem.examId));
        setTakingExam(null);
        setCurrentTab('history');
      })
      .catch(err => console.error('Error saving exam history:', err));
  };

  const handleDeleteHistory = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thi này khỏi lịch sử?')) return;
    authFetch(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(handleResponse)
      .then(() => {
        setExamHistory(prev => prev.filter(h => h.id !== id));
      })
      .catch(err => console.error('Error deleting history item:', err));
  };

  const handleRegradeHistory = async (id: string): Promise<ExamHistory | void> => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn chấm lại bài thi này theo đáp án mới nhất trong ngân hàng câu hỏi?',
      )
    )
      return;
    try {
      const res = await authFetch(`/api/history/${encodeURIComponent(id)}/regrade`, {
        method: 'POST',
      });
      const data = await handleResponse(res);
      setExamHistory(prev => prev.map(h => (h.id === data.id ? data : h)));
      alert(`Đã chấm lại bài thi thành công. Điểm mới: ${data.score} (${data.result})`);
      return data;
    } catch (err) {
      console.error('Error regrading history item:', err);
      alert('Không thể chấm lại bài thi.');
    }
  };

  // Luồng xử lý Ngân hàng câu hỏi
  const handleAddQuestion = (newQ: Question) => {
    return authFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ),
    })
      .then(handleResponse)
      .then(data => {
        setQuestions(prev => [data, ...prev]);
        return data;
      })
      .catch(err => {
        console.error('Error adding question:', err);
        throw err;
      });
  };

  const handleEditQuestion = (updatedQ: Question) => {
    return authFetch(`/api/questions/${encodeURIComponent(updatedQ.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedQ),
    })
      .then(handleResponse)
      .then(data => {
        setQuestions(prev => prev.map(q => (q.id === data.id ? data : q)));
        return data;
      })
      .catch(err => {
        console.error('Error editing question:', err);
        throw err;
      });
  };

  const handleDeleteQuestion = (id: string) => {
    authFetch(`/api/questions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      })
      .then(() => {
        setQuestions(prev => prev.filter(q => q.id !== id));
      })
      .catch(err => console.error('Error deleting question:', err));
  };

  // Luồng xử lý Tạo đề thi
  const handleCreateExam = async (newExam: ActiveExam): Promise<boolean> => {
    try {
      const res = await authFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
      });
      const data = await handleResponse(res);
      setActiveExams(prev => [data, ...prev]);
      setCurrentTab('dashboard'); // quay về trang chủ để sinh viên có thể xem
      return true;
    } catch (err: any) {
      alert(err.message || 'Lỗi không thể xuất bản đề thi.');
      console.error('Error creating exam:', err);
      return false;
    }
  };

  // Hiển thị giao diện thi toàn màn hình
  if (isLoggedIn && takingExam) {
    return <ExamTaking exam={takingExam} questions={questions} onFinishExam={handleFinishExam} />;
  }

  // Hiển thị giao diện Đăng nhập
  if (!isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Hiển thị trạng thái đang tải toàn hệ thống
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[#0058be] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#001a42] font-semibold text-sm animate-pulse">
          Đang đồng bộ dữ liệu hệ thống...
        </p>
      </div>
    );
  }

  // Khung giao diện chính với Topbar và Sidebar
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#f3f4f6]">
      {/* Thanh Header cố định toàn cục */}
      <Navbar
        role={role}
        userName={userName}
        studentId={role === 'student' ? studentId : undefined}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Thanh Sidebar trôi nổi */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={role}
        onLogout={handleLogout}
      />

      {/* Khu vực nội dung chính */}
      <div className="pl-64 pt-16 min-h-[calc(100vh-64px)]">
        <main className="p-8 max-w-[1200px] mx-auto transition-all duration-300">
          {currentTab === 'dashboard' && role === 'student' && (
            <StudentDashboard
              userName={userName}
              activeExams={activeExams}
              onStartExam={handleStartExam}
              completedExamsCount={examHistory.length}
              examHistory={examHistory}
            />
          )}

          {currentTab === 'questions' && role === 'teacher' && (
            <QuestionBank
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
          )}

          {currentTab === 'create' && role === 'teacher' && (
            <CreateExam onCreateExam={handleCreateExam} />
          )}

          {currentTab === 'analytics' && role === 'teacher' && (
            <ExamAnalytics questions={questions} history={examHistory} />
          )}

          {currentTab === 'history' &&
            (role === 'student' || role === 'teacher' || role === 'admin') && (
              <HistoryExams
                history={examHistory}
                role={role}
                onDeleteHistory={handleDeleteHistory}
                onRegradeHistory={handleRegradeHistory}
              />
            )}

          {/* Các Tab quản lý của Admin & Giảng viên */}
          {currentTab === 'users' && (role === 'admin' || role === 'teacher') && <AdminUsers />}

          {currentTab === 'departments' && role === 'admin' && <AdminDepartments />}

          {currentTab === 'classes' && role === 'admin' && <AdminClasses />}

          {/* Xử lý Tab dự phòng khi chuyển đổi vai trò */}
          {currentTab === 'dashboard' && role !== 'student' && (
            <div className="text-center py-20 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
              <span className="material-symbols-outlined text-[64px] text-gray-300">shield</span>
              <h2 className="text-lg font-bold text-[#191c1d] mt-4">Khu vực kiểm soát thí sinh</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Vui lòng đổi vai trò sang <strong>'Thí sinh'</strong> ở thanh điều hướng phía trên
                để xem bảng điều khiển làm bài thi thử.
              </p>
            </div>
          )}

          {(currentTab === 'questions' || currentTab === 'create' || currentTab === 'analytics') &&
            role !== 'teacher' && (
              <div className="text-center py-20 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
                <span className="material-symbols-outlined text-[64px] text-gray-300">school</span>
                <h2 className="text-lg font-bold text-[#191c1d] mt-4">
                  Khu vực kiểm soát Giảng viên
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Vui lòng đổi vai trò sang <strong>'Giảng viên'</strong> ở thanh điều hướng phía
                  trên để truy cập học liệu và cấu hình phòng thi.
                </p>
              </div>
            )}

          {currentTab === 'users' && role !== 'admin' && role !== 'teacher' && (
            <div className="text-center py-20 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
              <span className="material-symbols-outlined text-[64px] text-gray-300">group</span>
              <h2 className="text-lg font-bold text-[#191c1d] mt-4">
                Khu vực kiểm soát Người dùng
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Vui lòng đổi vai trò sang <strong>'Quản trị viên'</strong> hoặc{' '}
                <strong>'Giảng viên'</strong> để truy cập danh sách người dùng.
              </p>
            </div>
          )}

          {(currentTab === 'departments' || currentTab === 'classes') && role !== 'admin' && (
            <div className="text-center py-20 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
              <span className="material-symbols-outlined text-[64px] text-gray-300">
                admin_panel_settings
              </span>
              <h2 className="text-lg font-bold text-[#191c1d] mt-4">
                Khu vực kiểm soát Quản trị viên
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Vui lòng đổi vai trò sang <strong>'Quản trị viên'</strong> ở thanh điều hướng phía
                trên để truy cập cài đặt hệ thống tổng thể.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
