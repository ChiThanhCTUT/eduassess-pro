import { useState, useEffect, useCallback } from 'react';
import { Role } from '../types';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('userRole') as Role) || 'student';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('studentId') || '';
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const savedRole = localStorage.getItem('userRole') as Role;
    if (savedRole === 'student') return 'dashboard';
    if (savedRole === 'teacher') return 'questions';
    if (savedRole === 'admin') return 'users';
    return 'dashboard';
  });

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsLoggedIn(false);
      alert('Phiên làm việc (Token) của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleLogin = useCallback((
    userRole: Role,
    name: string,
    sid?: string,
    token?: string,
    refreshToken?: string,
  ) => {
    if (!token) {
      alert('Lỗi xác thực Token: Không thể đăng nhập vào hệ thống mà không có token hợp lệ.');
      return;
    }
    setRole(userRole);
    setUserName(name);
    setStudentId(sid || '');
    setIsLoggedIn(true);

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userName', name);
    localStorage.setItem('studentId', sid || '');
    localStorage.setItem('userToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    if (userRole === 'student') setCurrentTab('dashboard');
    else if (userRole === 'teacher') setCurrentTab('questions');
    else setCurrentTab('users');
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(console.error);
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('studentId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
  }, []);

  return {
    isLoggedIn,
    role,
    userName,
    studentId,
    currentTab,
    setCurrentTab,
    handleLogin,
    handleLogout
  };
}
