import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, Shield, Lock, X } from 'lucide-react';
import * as api from '../services/api';
import { confirmDialog } from '../components/ConfirmDialog';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';

export default function UsersPage({ user, notify }) {
  const [usersList, setUsersList] = useState([]);
  const userPager = usePagination(usersList, 5);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'guru',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsersList(res.data.data || []);
    } catch (e) {
      console.error('Failed fetching users', e);
      notify && notify('error', 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      notify && notify('success', `Pengguna ${newUser.name} berhasil ditambahkan.`);
      setShowAddUserModal(false);
      setNewUser({ name: '', username: '', password: '', role: 'guru' });
      fetchUsers();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal membuat pengguna.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!(await confirmDialog({ message: `Hapus pengguna ${name}?`, confirmText: 'Ya, Hapus', danger: true }))) return;
    try {
      await api.deleteUser(id);
      notify && notify('success', 'Pengguna berhasil dihapus.');
      fetchUsers();
    } catch (e) {
      notify && notify('error', e.response?.data?.message || 'Gagal menghapus pengguna.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Pengguna & Akun Guru</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Kelola otorisasi akun admin, guru mapel, & guru piket</p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Pengguna Baru
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role Akses</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    {loading ? 'Memuat data pengguna...' : 'Belum ada pengguna terdaftar.'}
                  </td>
                </tr>
              ) : (
                userPager.pageItems.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">{u.username}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'kepsek'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'guru_piket'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'guru'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {usersList.length > 0 && (
          <PaginationBar page={userPager.page} totalPages={userPager.totalPages} total={userPager.total} perPage={userPager.perPage} onPageChange={userPager.setPage} />
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-pop-in">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Akun Pengguna</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nama Pengguna / Guru"
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="username"
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Akses</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                >
                  <option value="guru">Guru Mapel</option>
                  <option value="guru_piket">Guru Piket</option>
                  <option value="kepsek">Kepala Sekolah</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
