import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import { confirmDialog } from './ConfirmDialog';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';
import { CLASSES, SUBJECTS } from '../constants';

// Panel penugasan guru mapel (khusus admin): guru mana mengajar mapel apa
// di kelas mana. Ditampilkan sebagai salah satu tab di halaman Jadwal & Penugasan.

export default function TeacherAssignmentsPanel({ notify }) {
  const [assignments, setAssignments] = useState([]);
  const assignmentPager = usePagination(assignments, 5, []);
  const [usersList, setUsersList] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    teacher_name: '',
    class_name: CLASSES[0],
    subject_name: SUBJECTS[0],
  });

  const fetchAssignments = async () => {
    try {
      const [assRes, uRes] = await Promise.all([api.getTeacherAssignments(), api.getUsers()]);
      const fetchedUsers = uRes.data.data || [];
      setAssignments(assRes.data.data || []);
      setUsersList(fetchedUsers);

      if (fetchedUsers.length > 0) {
        setNewAssignment((prev) => ({
          ...prev,
          user_id: prev.user_id || fetchedUsers[0].id,
          teacher_name: prev.teacher_name || fetchedUsers[0].name,
        }));
      }
    } catch (e) {
      console.error('Failed fetching assignments', e);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const selectedUserObj = usersList.find((u) => u.id === newAssignment.user_id);
      await api.createTeacherAssignment({
        ...newAssignment,
        teacher_name: selectedUserObj ? selectedUserObj.name : newAssignment.teacher_name,
      });
      notify && notify('success', 'Penugasan guru mapel berhasil disimpan.');
      fetchAssignments();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menambah penugasan guru.');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!(await confirmDialog({ message: 'Hapus penugasan guru ini?', confirmText: 'Ya, Hapus', danger: true }))) return;
    try {
      await api.deleteTeacherAssignment(id);
      notify && notify('success', 'Penugasan berhasil dihapus.');
      fetchAssignments();
    } catch (e) {
      notify && notify('error', 'Gagal menghapus penugasan.');
    }
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Assignment Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" /> Penugasan Guru Mapel
          </h3>

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Guru</label>
              <select
                value={newAssignment.user_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const u = usersList.find((usr) => usr.id === selectedId);
                  setNewAssignment({
                    ...newAssignment,
                    user_id: selectedId,
                    teacher_name: u ? u.name : '',
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Pilih Guru Terdaftar --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username} - {u.role})
                  </option>
                ))}
              </select>
            </div>

            {!newAssignment.user_id && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ketik Nama Guru (Manual)</label>
                <input
                  type="text"
                  required
                  value={newAssignment.teacher_name}
                  onChange={(e) => setNewAssignment({ ...newAssignment, teacher_name: e.target.value })}
                  placeholder="Contoh: Pak Budi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
              <select
                value={newAssignment.class_name}
                onChange={(e) => setNewAssignment({ ...newAssignment, class_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-2xl text-xs bg-slate-50 font-semibold"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Mata Pelajaran</label>
              <select
                value={newAssignment.subject_name}
                onChange={(e) => setNewAssignment({ ...newAssignment, subject_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-2xl text-xs bg-slate-50 font-semibold"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Simpan Penugasan
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Daftar Penugasan Guru Mapel ({assignments.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Guru</th>
                  <th className="px-6 py-4">Kelas Ampuan</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      Belum ada penugasan guru mapel.
                    </td>
                  </tr>
                ) : (
                  assignmentPager.pageItems.map((ass) => (
                    <tr key={ass.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{ass.teacher_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-xl font-bold">
                          {ass.class_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-xl font-bold">
                          {ass.subject_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(ass.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {assignments.length > 0 && (
            <PaginationBar page={assignmentPager.page} totalPages={assignmentPager.totalPages} total={assignmentPager.total} perPage={assignmentPager.perPage} onPageChange={assignmentPager.setPage} />
          )}
        </div>
      </div>
  );
}
