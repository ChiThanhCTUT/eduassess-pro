import React from 'react';
import { UserAccount } from '../../types';

interface UserTableProps {
  filteredUsers: UserAccount[];
  currentUserRole: string;
  toggleSuspend: (id: string) => void;
  openEditModal: (user: UserAccount) => void;
  handleDelete: (id: string) => void;
}

export default function UserTable({
  filteredUsers,
  currentUserRole,
  toggleSuspend,
  openEditModal,
  handleDelete,
}: UserTableProps) {
  return (
    <div
      className="bg-white border border-[#c2c6d6] rounded-2xl shadow-sm overflow-hidden"
      id="admin-users-table-container"
    >
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
              filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/40 transition-colors text-xs"
                  id={`row-${user.id}`}
                >
                  <td className="py-4 px-6 font-mono text-gray-500 font-semibold">{user.id}</td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-sm text-[#191c1d]">{user.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'teacher'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {user.role === 'admin'
                          ? 'admin_panel_settings'
                          : user.role === 'teacher'
                            ? 'school'
                            : 'person'}
                      </span>
                      {user.role === 'admin'
                        ? 'Quản trị'
                        : user.role === 'teacher'
                          ? 'Giảng viên'
                          : 'Thí sinh'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-semibold text-xs">
                    {(user as any).class_name || '—'}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-semibold">{user.department}</td>
                  <td className="py-4 px-6 text-gray-500">{user.createdAt}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
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
                          title={
                            user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
                          }
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
  );
}
