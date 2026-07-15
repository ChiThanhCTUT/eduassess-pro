import React from 'react';
import { Role } from '../types';

interface NavbarProps {
  role: Role;
  userName: string;
  studentId?: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Navbar({ role, userName, studentId, currentTab, setCurrentTab }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white border-b border-[#c2c6d6] shadow-sm">
      <div className="flex items-center gap-8">
        <span 
          onClick={() => {
            if (role === 'student') setCurrentTab('dashboard');
            else if (role === 'teacher') setCurrentTab('questions');
            else setCurrentTab('users');
          }}
          className="font-bold text-2xl text-[#0058be] cursor-pointer hover:opacity-80 transition-opacity"
        >
          EduAssess Pro
        </span>
        <nav className="hidden md:flex gap-6">
          {role === 'student' && (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'dashboard'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Bảng điều khiển
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'history'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Báo cáo & Lịch sử
              </button>
            </>
          )}

          {role === 'teacher' && (
            <>
              <button
                onClick={() => setCurrentTab('questions')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'questions'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Ngân hàng câu hỏi
              </button>
              <button
                onClick={() => setCurrentTab('create')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'create'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Tạo đề thi
              </button>
              <button
                onClick={() => setCurrentTab('analytics')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'analytics'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Thống kê & Thống kê nâng cao
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'history'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Lịch sử & Báo cáo
              </button>
              <button
                onClick={() => setCurrentTab('users')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'users'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Quản lý người dùng
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => setCurrentTab('users')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'users'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Quản lý người dùng
              </button>
              <button
                onClick={() => setCurrentTab('departments')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'departments'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Quản lý môn & khoa
              </button>
              <button
                onClick={() => setCurrentTab('classes')}
                className={`text-sm py-1 transition-colors ${
                  currentTab === 'classes'
                    ? 'text-[#0058be] font-bold border-b-2 border-[#0058be]'
                    : 'text-[#424754] hover:text-[#0058be]'
                }`}
              >
                Quản lý lớp học
              </button>
            </>
          )}
          

        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* System Search Bar */}
        <div className="hidden sm:flex items-center relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            className="pl-9 pr-4 py-1.5 bg-[#f3f4f5] border border-[#c2c6d6] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#005ac2]/50 w-48 transition-all"
            placeholder="Tìm kiếm hệ thống..."
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                alert(`Tìm kiếm hệ thống cho: "${(e.target as HTMLInputElement).value}"`);
              }
            }}
          />
        </div>

        <button 
          onClick={() => alert('Thông báo mới nhất: Bạn có 3 lịch thi sắp tới trong tuần này.')}
          className="material-symbols-outlined text-[#424754] hover:bg-gray-100 p-2 rounded-full cursor-pointer transition-colors relative"
        >
          notifications
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#ba1a1a]"></span>
        </button>

        <button 
          onClick={() => alert('Chào mừng bạn đến với EduAssess Pro! Bạn có thể thực hiện kiểm tra các tính năng thi cử trực tuyến theo đúng vai trò được phân quyền.')}
          className="material-symbols-outlined text-[#424754] hover:bg-gray-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          help
        </button>

        <div className="flex items-center gap-3 ml-2 border-l border-[#c2c6d6] pl-4">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-xs text-[#191c1d]">{userName}</p>
            {studentId && <p className="text-[10px] text-gray-500 uppercase tracking-wider">Mã SV: {studentId}</p>}
          </div>
          <div className="w-8 h-8 rounded-full bg-[#d8e2ff] flex items-center justify-center overflow-hidden border border-[#c2c6d6]">
            <img
              className="w-full h-full object-cover"
              alt="Ảnh chân dung"
              src={role === 'student' 
                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuB6FRFJhX4pMb3V9j_jQ652Q7KdyDCO3WQbzLdsitVwJVyBhZW5lXCOss2FN--jKOYkK8faZ18FAbnkf3X72hMP04ZalSq4YjgO7GxAWSfl3X8KKGwPrnOtuANxGXg9mI9PL1J9Cb1kF_O2v2Of-hyCbybIYzXFRh9s3oHSF2MNNrFdBMyB6xPlXnowJmROF9cqRqEwVZ_Q_B3GtMQyjVSZTJGJxBEVz57nln9RRnVbI9MPaaniBmnJKMCYgALZnOZWuKtuc6SUr2dr"
                : "https://lh3.googleusercontent.com/aida-public/AB6AXuCvUHdvy4q5EEgIrCbRj7c0HutYc2_eTLtjxbSKzcu-UYySTEbg0dZwsQKTvmfDUwnY6MKJZ0By2zY9BAhKPNdMJf_ypO-XQZdZcU2xpCFaXWUfk6yLyECycN8Wfl2PlPjBVxwdpYbHA-RsDE7ZTZBcOOQro4QqpjdsKwal_hX7Aum-7J9uyfcS3Uw93D1kj97ojOpyCGizNeS_qXrTbEJByQLt6LrEfDRI8_sDPTsw-qOYH-6_J7N8VBsKyA1hC_EN2sn-d3arlAYJ"
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
