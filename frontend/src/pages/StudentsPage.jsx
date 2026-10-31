import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Trash2, Printer, FileSpreadsheet, GraduationCap, ArrowRight, X, Eye, BookOpen
} from 'lucide-react';
import * as api from '../services/api';
import { CLASSES } from '../constants';

// Kolom biodata lengkap dari migrasi halaman detail; dipakai untuk lencana status kelengkapan.
const BIODATA_FIELDS = [
  'nisn', 'nik', 'no_kk', 'birth_place', 'birth_date', 'religion', 'address',
  'child_order', 'siblings_count', 'father_name', 'father_job', 'mother_name',
  'mother_job', 'guardian_name', 'parent_phone', 'previous_school', 'enrollment_year',
];
import ImportStudentsModal from '../components/ImportStudentsModal';
import StudentPrintGrid from '../components/StudentPrintGrid';
import ClassPromotionModal from '../components/ClassPromotionModal';
import StudentCardModal from '../components/StudentCardModal';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';

export default function StudentsPage({ notify }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [cardStudent, setCardStudent] = useState(null);
  const studentPager = usePagination(students, 5, [selectedClass, searchQuery]);

  const [newStudent, setNewStudent] = useState({
    nis: '',
    name: '',
    class_name: CLASSES[0],
    gender: 'L',
    photo_url: '',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({ class_name: selectedClass, search: searchQuery });
      setStudents(res.data || []);
    } catch (e) {
      console.error('Failed fetching students', e);
      notify && notify('error', 'Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, searchQuery]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.createStudent(newStudent);
      notify && notify('success', `Siswa ${newStudent.name} berhasil ditambahkan.`);
      setShowAddModal(false);
      setNewStudent({ nis: '', name: '', class_name: CLASSES[0], gender: 'L', photo_url: '' });
      fetchStudents();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menambahkan siswa.');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Hapus siswa ${name}? Data presensi terkait juga akan terhapus.`)) return;
    try {
      await api.deleteStudent(id);
      notify && notify('success', 'Siswa berhasil dihapus.');
      fetchStudents();
    } catch (e) {
      notify && notify('error', 'Gagal menghapus siswa.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Action Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Data Siswa</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Kelola data siswa, QR Code, dan nilai akademik</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel/CSV
          </button>

          <button
            onClick={() => setShowBatchPrint(true)}
            disabled={students.length === 0}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Cetak QR Kelas
          </button>

          <button
            onClick={() => setShowPromotionModal(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" /> Kenaikan Kelas
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>

        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, atau QR..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Semua Kelas">Semua Kelas</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-[12%]">NIS</th>
                <th className="px-6 py-4 w-[32%]">Nama Siswa</th>
                <th className="px-6 py-4 w-[16%]">Kelas</th>
                <th className="px-6 py-4 w-[18%]">Biodata</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? 'Memuat data siswa...' : 'Tidak ada data siswa ditemukan.'}
                  </td>
                </tr>
              ) : (
                studentPager.pageItems.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{st.nis}</td>
                    <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${st.id}`)}
                          className="font-bold text-slate-900 hover:text-marine-deep underline-offset-2 hover:underline text-left"
                        >
                          {st.name}
                        </button>
                      </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-xl font-bold text-slate-700">
                        {st.class_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const filled = BIODATA_FIELDS.filter((f) => st[f] !== null && st[f] !== undefined && st[f] !== '').length;
                        const total = BIODATA_FIELDS.length;
                        const badge =
                          filled === total
                            ? 'bg-hadir/10 text-hadir'
                            : filled === 0
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-butter/30 text-telat';
                        const label = filled === total ? 'Lengkap' : filled === 0 ? 'Belum diisi' : `${filled}/${total} terisi`;
                        return (
                          <button
                            type="button"
                            onClick={() => navigate(`/students/${st.id}`)}
                            title="Buka halaman detail untuk melengkapi biodata"
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition hover:brightness-95 ${badge}`}
                          >
                            {label}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setCardStudent(st)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-marine/10 hover:bg-marine/15 text-marine-deep rounded-full font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                      <button
                        onClick={() => navigate(`/students/${st.id}/nilai`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-tang/10 hover:bg-tang/15 text-tang-dark rounded-full font-bold text-[11px] transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Nilai
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Hapus Siswa"
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
        {students.length > 0 && (
          <PaginationBar page={studentPager.page} totalPages={studentPager.totalPages} total={studentPager.total} perPage={studentPager.perPage} onPageChange={studentPager.setPage} />
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Siswa Baru</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIS</label>
                <input
                  type="text"
                  required
                  value={newStudent.nis}
                  onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                  placeholder="Contoh: 2024001"
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Nama Siswa"
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={newStudent.class_name}
                    onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportStudentsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={fetchStudents}
        notify={notify}
      />

      {/* Student card popout: the card only, centred */}
      {cardStudent && (
        <StudentCardModal student={cardStudent} onClose={() => setCardStudent(null)} />
      )}

      {/* Grade detail popout: separate window */}

      {/* Class Promotion Modal */}
      <ClassPromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onPromotionSuccess={fetchStudents}
        notify={notify}
      />

      {/* Batch Print Component */}
      {showBatchPrint && (
        <StudentPrintGrid
          students={students}
          className={selectedClass}
          onClose={() => setShowBatchPrint(false)}
        />
      )}
    </div>
  );
}
