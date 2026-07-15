import React, { useState, useEffect } from 'react';
import { authFetch } from '../api';

export interface SubjectItem {
  code: string;
  name: string;
  credits: number;
  questionCount: number;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  teacherCount: number;
  subjects: SubjectItem[];
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState<string | null>(null); // holds department id

  // Dept Form state
  const [deptForm, setDeptForm] = useState({
    name: '',
    head: '',
    teacherCount: 5
  });

  // Subject Form state
  const [subForm, setSubForm] = useState({
    code: '',
    name: '',
    credits: 3,
    questionCount: 50
  });

  const fetchDepartments = () => {
    setLoading(true);
    setError(null);
    authFetch('/api/departments')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải danh sách khoa & môn học.');
        return res.json();
      })
      .then(data => {
        setDepartments(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newId = `DEPT-${String(departments.length + 1).padStart(2, '0')}`;
    const newDept = {
      id: newId,
      name: deptForm.name,
      head: deptForm.head || 'Chưa phân công',
      teacherCount: Number(deptForm.teacherCount) || 0
    };

    authFetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDept)
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tạo khoa mới.');
        return res.json();
      })
      .then(data => {
        setDepartments(prev => [...prev, data]);
        setShowDeptModal(false);
        setDeptForm({ name: '', head: '', teacherCount: 5 });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubjectModal) return;
    setLoading(true);
    setError(null);

    const newSub = {
      code: subForm.code.toUpperCase(),
      name: subForm.name,
      credits: Number(subForm.credits),
      questionCount: Number(subForm.questionCount) || 0,
      deptId: showSubjectModal
    };

    authFetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể thêm bộ môn mới.');
        return res.json();
      })
      .then(data => {
        setDepartments(prev => prev.map(d => {
          if (d.id === showSubjectModal) {
            return {
              ...d,
              subjects: [...(d.subjects || []), data]
            };
          }
          return d;
        }));
        setShowSubjectModal(null);
        setSubForm({ code: '', name: '', credits: 3, questionCount: 50 });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const deleteDepartment = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoa này cùng toàn bộ bộ môn liên kết?')) {
      setLoading(true);
      setError(null);
      authFetch(`/api/departments/${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể xóa khoa.');
          setDepartments(prev => prev.filter(d => d.id !== id));
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  const deleteSubject = (deptId: string, subjectCode: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bộ môn này khỏi khoa?')) {
      setLoading(true);
      setError(null);
      authFetch(`/api/subjects/${subjectCode}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error('Không thể xóa bộ môn.');
          setDepartments(prev => prev.map(d => {
            if (d.id === deptId) {
              return {
                ...d,
                subjects: d.subjects.filter(s => s.code !== subjectCode)
              };
            }
            return d;
          }));
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-dept-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="admin-dept-header">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý Khoa & Bộ môn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập cơ cấu phòng ban, quản lý chương trình học tập và kiểm duyệt hệ thống học liệu.
          </p>
        </div>
        <button
          onClick={() => setShowDeptModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0058be] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg self-start md:self-auto cursor-pointer"
          id="btn-add-dept"
        >
          <span className="material-symbols-outlined">domain_add</span>
          Thêm khoa mới
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-red-700 text-lg">error</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading && departments.length === 0 && (
        <div className="text-center py-10 bg-white border border-[#c2c6d6] rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Đang tải cấu trúc khoa & môn học...</p>
        </div>
      )}

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="admin-dept-grid">
        {departments.map((dept) => {
          const totalQuestions = dept.subjects.reduce((acc, s) => acc + s.questionCount, 0);
          return (
            <div 
              key={dept.id} 
              className="bg-white border border-[#c2c6d6] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              id={`card-dept-${dept.id}`}
            >
              <div>
                {/* Title row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0058be]">
                      <span className="material-symbols-outlined">domain</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#191c1d]">{dept.name}</h2>
                      <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">{dept.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Giải thể khoa"
                    id={`btn-del-dept-${dept.id}`}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-3 gap-2 bg-[#f8f9fa] border border-gray-100 rounded-xl p-3 my-4 text-center">
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Trưởng Khoa</p>
                    <p className="text-xs font-bold text-gray-700 mt-1 truncate max-w-[120px] mx-auto">{dept.head}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Nhân Sự</p>
                    <p className="text-xs font-bold text-gray-700 mt-1">{dept.teacherCount} Giảng viên</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Ngân Hàng Câu</p>
                    <p className="text-xs font-bold text-blue-600 mt-1">{totalQuestions} câu hỏi</p>
                  </div>
                </div>

                {/* Subjects list */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Học phần liên kết ({dept.subjects.length})</span>
                    <button
                      onClick={() => setShowSubjectModal(dept.id)}
                      className="text-xs font-bold text-[#0058be] hover:underline flex items-center gap-0.5 cursor-pointer"
                      id={`btn-add-subject-to-${dept.id}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Thêm học phần
                    </button>
                  </div>

                  {dept.subjects.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-[160px] overflow-y-auto pr-1">
                      {dept.subjects.map((sub) => (
                        <div key={sub.code} className="py-2 flex items-center justify-between text-xs hover:bg-gray-50/50 px-1 rounded transition-colors">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{sub.code}</span>
                              <p className="font-semibold text-gray-800 truncate">{sub.name}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5 font-medium">
                              <span>Số tín chỉ: {sub.credits}</span>
                              <span>•</span>
                              <span>Ngân hàng: {sub.questionCount} câu hỏi</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSubject(dept.id, sub.code)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Xóa học phần"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center italic">Chưa liên kết học phần nào.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="modal-dept-form">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeptModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0058be] text-2xl">domain_add</span>
                <h2 className="text-lg font-bold text-[#191c1d]">Thành lập Khoa mới</h2>
              </div>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Tên Khoa thành lập</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                  placeholder="Ví dụ: Khoa Sinh học & Công nghệ Sinh học"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Trưởng Khoa đảm nhiệm</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                    placeholder="Ví dụ: PGS.TS. Nguyễn Văn A"
                    value={deptForm.head}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, head: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Số lượng Giảng viên</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                    value={deptForm.teacherCount}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, teacherCount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-[#c2c6d6] text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0058be] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Thành lập Khoa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="modal-subject-form">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSubjectModal(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0058be] text-2xl">add_card</span>
                <h2 className="text-lg font-bold text-[#191c1d]">Thêm Học phần / Bộ môn</h2>
              </div>
              <button
                onClick={() => setShowSubjectModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Mã Học phần</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                    placeholder="CS-101"
                    value={subForm.code}
                    onChange={(e) => setSubForm(prev => ({ ...prev, code: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Tên Học phần</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                    placeholder="Ví dụ: Thiết kế hệ thống mạng"
                    value={subForm.name}
                    onChange={(e) => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Số tín chỉ</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs bg-white"
                    value={subForm.credits}
                    onChange={(e) => setSubForm(prev => ({ ...prev, credits: Number(e.target.value) }))}
                  >
                    <option value="1">1 Tín chỉ</option>
                    <option value="2">2 Tín chỉ</option>
                    <option value="3">3 Tín chỉ</option>
                    <option value="4">4 Tín chỉ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Khởi tạo số câu hỏi</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
                    value={subForm.questionCount}
                    onChange={(e) => setSubForm(prev => ({ ...prev, questionCount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(null)}
                  className="px-4 py-2 border border-[#c2c6d6] text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0058be] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Thêm học phần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
