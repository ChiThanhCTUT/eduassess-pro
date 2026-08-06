import React from 'react';
import { UserAccount, ClassItem } from '../../types';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  status: 'Active' | 'Suspended';
  class_id: number | null;
}

interface UserFormModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  editingUser: UserAccount | null;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  classes: ClassItem[];
}

export default function UserFormModal({
  showAddModal,
  setShowAddModal,
  editingUser,
  formData,
  setFormData,
  handleInputChange,
  handleSubmit,
  classes,
}: UserFormModalProps) {
  if (!showAddModal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      id="modal-user-form"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowAddModal(false)}
      ></div>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600">
              Mật khẩu{' '}
              {editingUser
                ? '(Để trống nếu không thay đổi)'
                : '(Để trống để tự tạo mật khẩu ngẫu nhiên an toàn)'}
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-xs"
              placeholder={
                editingUser ? '••••••••' : 'Nhập mật khẩu >= 8 ký tự hoặc để trống...'
              }
              value={formData.password}
              onChange={handleInputChange}
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
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    class_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">-- Chưa phân lớp --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} ({c.class_code})
                  </option>
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
  );
}
