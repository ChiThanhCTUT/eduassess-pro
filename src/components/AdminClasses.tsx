import React, { useState, useEffect } from 'react';
import { ClassItem } from '../types';
import { authFetch } from '../api';

interface DepartmentOption {
  id: string;
  name: string;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    department_id: '',
    class_code: '',
    class_name: '',
    course_year: new Date().getFullYear().toString()
  });

  const fetchClasses = () => {
    setLoading(true);
    setError(null);
    authFetch('/api/classes')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách lớp học.');
        return res.json();
      })
      .then((data: ClassItem[]) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchDepartments = () => {
    authFetch('/api/departments')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách khoa.');
        return res.json();
      })
      .then((data: any[]) => {
        setDepartments(data.map(d => ({ id: String(d.id), name: d.name })));
      })
      .catch(err => console.error('Error fetching departments:', err));
  };

  useEffect(() => {
    fetchClasses();
    fetchDepartments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setFormData({
      department_id: departments.length > 0 ? departments[0].id : '',
      class_code: '',
      class_name: '',
      course_year: new Date().getFullYear().toString()
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    authFetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tạo lớp học mới.');
        return res.json();
      })
      .then(data => {
        setClasses(prev => [data, ...prev]);
        setShowAddModal(false);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      setLoading(true);
      setError(null);
      authFetch(`/api/classes/${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể xóa lớp học.');
          setClasses(prev => prev.filter(c => c.id !== id));
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  // Filtered classes
  const filteredClasses = classes.filter(cls => {
    const q = searchQuery.toLowerCase();
    return (
      cls.class_name.toLowerCase().includes(q) ||
      cls.class_code.toLowerCase().includes(q) ||
      (cls.department_name || '').toLowerCase().includes(q)
    );
  });

  // Quick stats
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const uniqueDepts = new Set(classes.map(c => c.department_id)).size;

  return (
    <div className="space-y-8 animate-fade-in" id="admin-classes-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="admin-classes-header">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý lớp học</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập và quản lý danh sách các lớp học, phân bổ sinh viên theo khoa và niên khóa.
          </p>
        </div>
        <button
          id="btn-add-class"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0058be] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          Thêm lớp học mới
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-red-700 text-lg">error</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading && classes.length === 0 && (
        <div className="text-center py-10 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Đang tải danh sách lớp học...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" id="admin-classes-stats">
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tổng lớp học</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#191c1d]">{totalClasses}</span>
            <span className="material-symbols-outlined text-gray-300 text-[32px]">class</span>
          </div>
        </div>
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tổng sinh viên</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#0058be]">{totalStudents}</span>
            <span className="material-symbols-outlined text-blue-100 text-[32px]">group</span>
          </div>
        </div>
        <div className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Khoa liên kết</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-green-600">{uniqueDepts}</span>
            <span className="material-symbols-outlined text-green-100 text-[32px]">domain</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#c2c6d6] rounded-2xl p-4 shadow-sm flex items-center gap-4" id="admin-classes-search">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
            placeholder="Tìm kiếm theo tên lớp, mã lớp, hoặc khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white border border-[#c2c6d6] rounded-2xl shadow-sm overflow-hidden" id="admin-classes-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Mã lớp</th>
                <th className="py-4 px-6">Tên lớp</th>
                <th className="py-4 px-6">Khoa</th>
                <th className="py-4 px-6">Niên khóa</th>
                <th className="py-4 px-6">Số sinh viên</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/40 transition-colors text-xs" id={`row-class-${cls.id}`}>
                    <td className="py-4 px-6 font-mono text-gray-500 font-semibold">{cls.id}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {cls.class_code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-sm text-[#191c1d]">{cls.class_name}</p>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-semibold">{cls.department_name || '—'}</td>
                    <td className="py-4 px-6 text-gray-500">{cls.course_year}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-gray-400 text-sm">group</span>
                        <span className="font-bold text-[#191c1d]">{cls.student_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa lớp học"
                        id={`btn-delete-class-${cls.id}`}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Không tìm thấy lớp học nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="modal-class-form">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0058be] text-2xl">add</span>
                <h2 className="text-lg font-bold text-[#191c1d]">Thêm lớp học mới</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                id="btn-close-class-modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Khoa</label>
                <select
                  name="department_id"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs bg-white"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Chọn khoa --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Mã lớp</label>
                  <input
                    type="text"
                    name="class_code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
                    placeholder="Ví dụ: CNTT-K48A"
                    value={formData.class_code}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Niên khóa</label>
                  <input
                    type="text"
                    name="course_year"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
                    placeholder="Ví dụ: 2024"
                    value={formData.course_year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Tên lớp</label>
                <input
                  type="text"
                  name="class_name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
                  placeholder="Ví dụ: Công nghệ thông tin K48 - Nhóm A"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

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
                  id="btn-save-class"
                >
                  Thêm lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
