import React, { useState, useEffect } from 'react';
import { authFetch } from '../../api';
import { UserAccount, ClassItem } from '../../types';

export function useAdminUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    department: 'Khoa CNTT',
    status: 'Active' as 'Active' | 'Suspended',
    class_id: null as number | null,
  });

  // Classes for dropdown
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const currentUserRole = localStorage.getItem('userRole') || 'admin';

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    authFetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách tài khoản.');
        return res.json();
      })
      .then((data: any[]) => {
        const mapped = data.map(u => ({
          ...u,
          id: String(u.id),
        }));
        setUsers(mapped);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
    authFetch('/api/classes')
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
      })
      .catch(() => {});
  }, []);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'class_id' ? (value ? Number(value) : null) : value,
    }));
  };

  // Open modal for add
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: 'Khoa CNTT',
      status: 'Active',
      class_id: null,
    });
    setEditingUser(null);
    setShowAddModal(true);
  };

  // Open modal for edit
  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      status: user.status,
      class_id: user.class_id ?? null,
    });
    setShowAddModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    setError(null);
    if (editingUser) {
      // Edit mode: only include password if user typed a new one
      const payload = formData.password ? formData : (({ password, ...rest }) => rest)(formData);
      authFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Không thể cập nhật tài khoản.');
          return data;
        })
        .then(data => {
          setUsers(prev =>
            prev.map(u =>
              u.id === editingUser.id ? { ...u, ...data, id: String(data.id || u.id) } : u,
            ),
          );
          setShowAddModal(false);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      // Add mode: if empty, backend will auto-generate secure password
      const payload = formData.password ? formData : (({ password, ...rest }) => rest)(formData);
      authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Không thể tạo tài khoản mới.');
          return data;
        })
        .then(data => {
          const newUser: UserAccount = {
            ...data,
            id: String(data.id),
          };
          setUsers(prev => [newUser, ...prev]);
          setShowAddModal(false);
          setLoading(false);
          if (data.initialPassword) {
            alert(
              `Tài khoản "${data.email}" đã được tạo thành công!\nMật khẩu khởi tạo an toàn tự động: ${data.initialPassword}\nVui lòng lưu lại để gửi cho người dùng.`,
            );
          }
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  // Delete Handler
  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setLoading(true);
      setError(null);
      authFetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể xóa tài khoản.');
          setUsers(prev => prev.filter(u => u.id !== id));
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  // Suspend Toggle Handler
  const toggleSuspend = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';

    setLoading(true);
    setError(null);
    authFetch(`/api/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể thay đổi trạng thái.');
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, status: newStatus } : u)));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Quick stats
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalSuspended = users.filter(u => u.status === 'Suspended').length;

  return {
    users,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    showAddModal,
    setShowAddModal,
    editingUser,
    formData,
    setFormData,
    classes,
    currentUserRole,
    handleInputChange,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    toggleSuspend,
    filteredUsers,
    totalUsers,
    totalStudents,
    totalTeachers,
    totalSuspended,
  };
}
