import React from 'react';
import { useAdminUsers } from './useAdminUsers';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';

export type { UserAccount } from '../../types';

export default function AdminUsers() {
  const {
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
  } = useAdminUsers();

  return (
    <div className="space-y-8" id="admin-users-root">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        id="admin-users-header"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#191c1d]">Quản lý người dùng & Tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng hợp thông tin học viên, giảng viên và quản trị viên của hệ thống khảo thí
            EduAssess.
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
        <div
          className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm"
          id="card-total-users"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tổng tài khoản</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#191c1d]">{totalUsers}</span>
            <span className="material-symbols-outlined text-gray-300 text-[32px]">group</span>
          </div>
        </div>
        <div
          className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm"
          id="card-total-teachers"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Giảng viên</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-[#0058be]">{totalTeachers}</span>
            <span className="material-symbols-outlined text-blue-100 text-[32px]">school</span>
          </div>
        </div>
        <div
          className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm"
          id="card-total-students"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            Thí sinh / Học viên
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-green-600">{totalStudents}</span>
            <span className="material-symbols-outlined text-green-100 text-[32px]">person</span>
          </div>
        </div>
        <div
          className="bg-white border border-[#c2c6d6] rounded-2xl p-5 shadow-sm"
          id="card-total-suspended"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            Tài khoản bị khóa
          </p>
          <div className="flex items-end justify-between mt-2">
            <span
              className={`text-3xl font-black ${totalSuspended > 0 ? 'text-red-600' : 'text-gray-400'}`}
            >
              {totalSuspended}
            </span>
            <span className="material-symbols-outlined text-red-100 text-[32px]">lock</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="bg-white border border-[#c2c6d6] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4"
        id="admin-users-filters"
      >
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] outline-none text-xs"
            placeholder="Tìm kiếm theo mã, họ tên, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Vai trò:</span>
            <select
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#0058be]"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
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
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Active">Hoạt động</option>
              <option value="Suspended">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UserTable
        filteredUsers={filteredUsers}
        currentUserRole={currentUserRole}
        toggleSuspend={toggleSuspend}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
      />

      {/* User Add/Edit Modal */}
      <UserFormModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        classes={classes}
      />
    </div>
  );
}
