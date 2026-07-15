import React, { useState, useEffect } from 'react';
import { authFetch } from '../api';
import { ClassItem } from '../types';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  class_id?: number | null;
  class_name?: string;
}

export default function AdminUsers() {
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
    role: 'student' as 'student' | 'teacher' | 'admin',
    department: 'Khoa CNTT',
    status: 'Active' as 'Active' | 'Suspended',
    class_id: null as number | null
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
          id: String(u.id)
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
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setClasses(data); })
      .catch(() => {});
  }, []);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open modal for add
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      department: 'Khoa CNTT',
      status: 'Active',
      class_id: null
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
      role: user.role,
      department: user.department,
      status: user.status,
      class_id: user.class_id ?? null
    });
    setShowAddModal(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editingUser) {
      // Edit mode
      authFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể cập nhật tài khoản.');
          return res.json();
        })
        .then(() => {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
          setShowAddModal(false);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      // Add mode
      const payload = {
        ...formData,
        password: '12345678'
      };
      authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể tạo tài khoản mới.');
          return res.json();
        })
        .then(data => {
          const newUser: UserAccount = {
            ...data,
            id: String(data.id)
          };
          setUsers(prev => [newUser, ...prev]);
          setShowAddModal(false);
          setLoading(false);
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
        method: 'DELETE'
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
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể thay đổi trạng thái.');
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
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

  return (
    <div className="space-y-8" id="admin-users-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="admin-users-header">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý người dùng & Tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng hợp thông tin học viên, giảng viên và quản trị viên của hệ thống khảo thí EduAssess.
          </p>
        </div>
        {currentUserRole === 'admin' && (
          <button
            id="btn-add-user"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0058be] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg self-start md:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined">person_add</span>
            Thêm người dùng mới
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-red-700 text-lg">error</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading && users.length === 0 && (
        <div className="text-center py-10 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Đang tải danh sách người dùng...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-users-stats">
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm" id="card-total-users">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tổng tài khoản</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#191c1d]">{totalUsers}</span>
            <span className="material-symbols-outlined text-gray-300 text-[32px]">group</span>
          </div>
        </div>
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm" id="card-total-teachers">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Giảng viên</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#0058be]">{totalTeachers}</span>
            <span className="material-symbols-outlined text-blue-100 text-[32px]">school</span>
          </div>
        </div>
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm" id="card-total-students">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Thí sinh / Học viên</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-green-600">{totalStudents}</span>
            <span className="material-symbols-outlined text-green-100 text-[32px]">person</span>
          </div>
        </div>
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm" id="card-total-suspended">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tài khoản bị khóa</p>
          <div className="flex items-end justify-between mt-2">
            <span className={`text-3xl font-black ${totalSuspended > 0 ? 'text-red-600' : 'text-gray-400'}`}>{totalSuspended}</span>
            <span className="material-symbols-outlined text-red-100 text-[32px]">lock</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#c2c6d6] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4" id="admin-users-filters">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
            placeholder="Tìm kiếm theo mã, họ tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Vai trò:</span>
            <select
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#0058be]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="student">Thí sinh</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Trạng thái:</span>
            <select
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#0058be]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Active">Hoạt động</option>
              <option value="Suspended">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#c2c6d6] rounded-2xl shadow-sm overflow-hidden" id="admin-users-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Thông tin cá nhân</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Lớp</th>
                <th className="py-4 px-6">Khoa / Đơn vị</th>
                <th className="py-4 px-6">Ngày tham gia</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40 transition-colors text-xs" id={`row-${user.id}`}>
                    <td className="py-4 px-6 font-mono text-gray-500 font-semibold">{user.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-sm text-[#191c1d]">{user.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : user.role === 'teacher' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                      }`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {user.role === 'admin' ? 'admin_panel_settings' : user.role === 'teacher' ? 'school' : 'person'}
                        </span>
                        {user.role === 'admin' ? 'Quản trị' : user.role === 'teacher' ? 'Giảng viên' : 'Thí sinh'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-semibold text-xs">{(user as any).class_name || '—'}</td>
                    <td className="py-4 px-6 text-gray-600 font-semibold">{user.department}</td>
                    <td className="py-4 px-6 text-gray-500">{user.createdAt}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {currentUserRole === 'admin' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleSuspend(user.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.status === 'Active' 
                                ? 'border-orange-200 text-orange-600 hover:bg-orange-50' 
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            id={`btn-suspend-${user.id}`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {user.status === 'Active' ? 'lock' : 'lock_open'}
                            </span>
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 border border-[#c2c6d6] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin"
                            id={`btn-edit-${user.id}`}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                            id={`btn-delete-${user.id}`}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                    Không tìm thấy tài khoản nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="modal-user-form">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0058be] text-2xl">
                  {editingUser ? 'manage_accounts' : 'person_add'}
                </span>
                <h2 className="text-lg font-bold text-[#191c1d]">
                  {editingUser ? 'Cập nhật thông tin tài khoản' : 'Thêm tài khoản mới'}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                id="btn-close-modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Họ và Tên</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
                  placeholder="Ví dụ: PGS.TS. Nguyễn Văn B"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Địa chỉ Email</label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
                  placeholder="name@university.edu.vn"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Vai trò</label>
                  <select
                    name="role"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs bg-white"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="student">Thí sinh</option>
                    <option value="teacher">Giảng viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Trạng thái</label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs bg-white"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Suspended">Đã khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Khoa / Đơn vị công tác</label>
                <select
                  name="department"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs bg-white"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="Khoa CNTT">Khoa CNTT</option>
                  <option value="Khoa Toán học">Khoa Toán học</option>
                  <option value="Khoa Vật lý">Khoa Vật lý</option>
                  <option value="Khoa Ngoại ngữ">Khoa Ngoại ngữ</option>
                  <option value="Phòng Đào tạo">Phòng Đào tạo</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Lớp học</label>
                  <select
                    name="class_id"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs bg-white"
                    value={formData.class_id ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value ? Number(e.target.value) : null }))}
                  >
                    <option value="">-- Chưa phân lớp --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#c2c6d6] text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0058be] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                  id="btn-save-user"
                >
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
