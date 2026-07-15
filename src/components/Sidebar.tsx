import React from 'react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  role: 'student' | 'teacher' | 'admin';
  onLogout: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, role, onLogout }: SidebarProps) {
  // Navigation lists depending on roles
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col p-4 bg-[#f3f4f5] dark:bg-[#ffffff] border-r border-[#c2c6d6] z-40">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-lg bg-[#2170e4] flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-white">
            {role === 'student' ? 'school' : role === 'teacher' ? 'shield' : 'admin_panel_settings'}
          </span>
        </div>
        <div>
          <div className="font-semibold text-[#191c1d] text-sm leading-tight">
            {role === 'student' ? 'Kiểm soát học tập' : role === 'teacher' ? 'Kiểm soát kỳ thi' : 'Hệ thống Quản trị'}
          </div>
          <div className="text-xs text-[#424754]">
            {role === 'student' ? 'Cổng học viên' : role === 'teacher' ? 'Cổng giảng viên' : 'Bảng quản trị viên'}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {role === 'student' && (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'dashboard'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">assignment</span>
              <span className="text-sm">Kỳ thi hiện có</span>
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'history'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm">Lịch sử thi</span>
            </button>
          </>
        )}

        {role === 'teacher' && (
          <>
            <button
              onClick={() => setCurrentTab('questions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'questions'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">database</span>
              <span className="text-sm">Ngân hàng câu hỏi</span>
            </button>
            <button
              onClick={() => setCurrentTab('create')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'create'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-sm">Tạo đề thi</span>
            </button>
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'analytics'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span className="text-sm">Phân tích thống kê</span>
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'history'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm">Lịch sử & Báo cáo</span>
            </button>
            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'users'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm">Quản lý người dùng</span>
            </button>
          </>
        )}

        {role === 'admin' && (
          <>
            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'users'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm">Quản lý người dùng</span>
            </button>
            <button
              onClick={() => setCurrentTab('departments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'departments'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">domain</span>
              <span className="text-sm">Quản lý môn & khoa</span>
            </button>
            <button
              onClick={() => setCurrentTab('classes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                currentTab === 'classes'
                  ? 'bg-[#d6e0f3] text-[#001a42] font-semibold'
                  : 'text-[#424754] hover:bg-[#e7e8e9]'
              }`}
            >
              <span className="material-symbols-outlined">class</span>
              <span className="text-sm">Quản lý lớp học</span>
            </button>
          </>
        )}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[#c2c6d6] pt-4">
        <a
          href="#help"
          onClick={(e) => {
            e.preventDefault();
            alert('Hệ thống hỗ trợ EduAssess Pro: Vui lòng liên hệ quản trị viên qua email support@eduassess.edu.vn.');
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-[#424754] hover:bg-[#e7e8e9] transition-all duration-200 rounded-lg"
        >
          <span className="material-symbols-outlined">support_agent</span>
          <span className="text-sm">Hỗ trợ</span>
        </a>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
