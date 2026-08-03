import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, Users, LogOut, Plus, Search, Trash2, Printer, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, Camera, ArrowRight, Shield, BookOpen,
  Clock, Calendar, LogOutIcon, GraduationCap, FileSpreadsheet, ImagePlus,
  UserCog, Sun
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import * as api from './services/api';

const CLASSES = ['X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2', 'XII MIPA'];
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SUBJECTS = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'Ekonomi', 'PKN', 'Olahraga'];

export default function App() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('school_user');
    return s ? JSON.parse(s) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [piketList, setPiketList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentQR, setSelectedStudentQR] = useState(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddPiket, setShowAddPiket] = useState(false);

  const [scanResult, setScanResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanMode, setScanMode] = useState('masuk'); // masuk / pulang / mapel
  const [subjectScanConfig, setSubjectScanConfig] = useState({ subject_name: 'Matematika', period: 1, teacher_name: '' });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [newStudent, setNewStudent] = useState({ nis: '', name: '', class_name: 'X IPA 1', gender: 'L', photo_url: '' });
  const [newSchedule, setNewSchedule] = useState({ day: 'Senin', period: 1, class_name: 'X IPA 1', subject_name: 'Matematika', teacher_name: '', start_time: '07:30', end_time: '08:15', room: '' });
  const [newPiket, setNewPiket] = useState({ date: new Date().toISOString().split('T')[0], teacher_name: '', notes: '' });

  useEffect(() => {
    if (user) { fetchAll(); }
  }, [user, selectedClass, selectedDate, statusFilter]);

  const notify = (t, m) => { setNotification({ type: t, message: m }); setTimeout(() => setNotification(null), 3500); };

  const fetchAll = () => {
    fetchStudents(); fetchAttendance(); fetchStats(); fetchSchedules(); fetchPiket(); fetchSubjectAttendance();
  };

  const fetchStudents = async () => {
    try { const r = await api.getStudents({ class_name: selectedClass, search: searchQuery }); setStudents(r.data); } catch (e) {}
  };
  const fetchAttendance = async () => {
    try { const r = await api.getAttendance({ date: selectedDate, class_name: selectedClass, status: statusFilter }); setAttendance(r.data); } catch (e) {}
  };
  const fetchSubjectAttendance = async () => {
    try { const r = await api.getSubjectAttendance({ date: selectedDate, class_name: selectedClass }); setSubjectAttendance(r.data); } catch (e) {}
  };
  const fetchStats = async () => {
    try { const r = await api.getDashboardStats({ date: selectedDate }); setStats(r.data); } catch (e) {}
  };
  const fetchSchedules = async () => {
    try { const r = await api.getSchedules({ class_name: selectedClass }); setSchedules(r.data); } catch (e) {}
  };
  const fetchPiket = async () => {
    try { const r = await api.getGuruPiket(); setPiketList(r.data); } catch (e) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('');
    try {
      const r = await api.login(loginUsername, loginPassword);
      if (r.data.success) {
        const u = { name: r.data.name, role: r.data.role, token: r.data.token };
        setUser(u); localStorage.setItem('school_user', JSON.stringify(u));
        notify('success', `Selamat datang, ${r.data.name}!`);
      }
    } catch (e) { setLoginError(e.response?.data?.message || 'Login gagal.'); }
  };

  const handleDemoLogin = async (username, password) => {
    try {
      const r = await api.login(username, password);
      if (r.data.success) {
        const u = { name: r.data.name, role: r.data.role, token: r.data.token };
        setUser(u); localStorage.setItem('school_user', JSON.stringify(u));
        notify('success', `Login demo sebagai ${r.data.role.toUpperCase()} berhasil!`);
      }
    } catch (e) {
      setLoginError('Login demo gagal. Pastikan backend berjalan.');
    }
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('school_user'); };

  const handleSeedData = async () => {
    try { setLoading(true); const r = await api.seedDemo(); notify('success', r.data.message); fetchAll(); }
    catch { notify('error', 'Gagal seed data.'); } finally { setLoading(false); }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.createStudent(newStudent);
      notify('success', 'Siswa baru + QR unik berhasil ditambahkan!');
      setShowAddStudent(false); setNewStudent({ nis: '', name: '', class_name: 'X IPA 1', gender: 'L', photo_url: '' });
      fetchStudents(); fetchStats();
    } catch (e) { notify('error', e.response?.data?.message || 'Gagal.'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Hapus siswa ini?")) return;
    try { await api.deleteStudent(id); notify('success', 'Terhapus.'); fetchStudents(); fetchStats(); }
    catch { notify('error', 'Gagal.'); }
  };

  const handlePhotoUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewStudent({ ...newStudent, photo_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleScanSubmit = async (code) => {
    if (!code) return;
    try {
      if (scanMode === 'mapel') {
        const r = await api.scanSubjectAttendance({
          qr_code: code, nis: code,
          subject_name: subjectScanConfig.subject_name,
          period: subjectScanConfig.period,
          teacher_name: subjectScanConfig.teacher_name || user?.name || 'Guru Mapel'
        });
        setScanResult({ ...r.data, mode: 'mapel' });
        notify(r.data.already ? 'info' : 'success', r.data.message);
        fetchSubjectAttendance();
      } else {
        const r = await api.scanAttendance({
          qr_code: code, nis: code, mode: scanMode, recorded_by: user?.name || 'Guru Piket'
        });
        setScanResult({ ...r.data, mode: scanMode });
        notify(r.data.already ? 'info' : 'success', r.data.message);
        fetchAttendance(); fetchStats();
      }
      setManualCodeInput('');
    } catch (e) {
      const m = e.response?.data?.message || 'QR tidak valid.';
      notify('error', m); setScanResult({ success: false, message: m });
    }
  };

  const handleManualStatusUpdate = async (studentId, status) => {
    try {
      await api.manualAttendance({ student_id: studentId, date: selectedDate, status, recorded_by: user?.name });
      notify('success', `Status diperbarui: ${status}`); fetchAttendance(); fetchStats();
    } catch { notify('error', 'Gagal.'); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.createSchedule({ ...newSchedule, period: parseInt(newSchedule.period) });
      notify('success', 'Jadwal berhasil ditambahkan.');
      setShowAddSchedule(false); fetchSchedules();
    } catch { notify('error', 'Gagal tambah jadwal.'); }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Hapus jadwal ini?")) return;
    try { await api.deleteSchedule(id); notify('success', 'Terhapus.'); fetchSchedules(); }
    catch { notify('error', 'Gagal.'); }
  };

  const handleCreatePiket = async (e) => {
    e.preventDefault();
    try {
      await api.createGuruPiket(newPiket);
      notify('success', 'Guru piket ditambahkan.');
      setShowAddPiket(false); fetchPiket(); fetchStats();
    } catch { notify('error', 'Gagal.'); }
  };

  const handleDeletePiket = async (id) => {
    if (!window.confirm("Hapus data piket?")) return;
    try { await api.deleteGuruPiket(id); notify('success', 'Terhapus.'); fetchPiket(); }
    catch { notify('error', 'Gagal.'); }
  };

  const handleExportExcel = () => {
    const excelUrl = api.getExcelExport({
      date: selectedDate,
      class_name: selectedClass !== 'Semua Kelas' ? selectedClass : undefined,
    });
    window.open(excelUrl, '_blank');
    notify('success', 'Excel sedang di-download...');
  };

  const handleExportPDF = () => {
    window.print();
  };

  // ==== HTML5 QR Scanner ====
  const html5QrCodeRef = useRef(null);
  useEffect(() => {
    if (activeTab === 'scanner' && scannerActive) {
      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => handleScanSubmit(decoded),
        () => {}
      ).catch(() => {
        notify('error', 'Gagal akses kamera. Pakai input manual.');
        setScannerActive(false);
      });
      return () => { if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().catch(() => {}); };
    }
  }, [activeTab, scannerActive, scanMode, subjectScanConfig]);

  const stopScanner = () => {
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().then(() => setScannerActive(false)).catch(() => {});
    else setScannerActive(false);
  };

  // ============ LOGIN VIEW ============
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-lg mb-4">
              <QrCode className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sistem Absensi Sekolah</h1>
            <p className="text-slate-500 text-sm mt-1">QR Scan · Absen Pulang · Jadwal · Laporan</p>
          </div>
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />{loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Username</label>
              <input type="text" data-testid="login-username-input" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                placeholder="admin atau guru" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
              <input type="password" data-testid="login-password-input" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </div>
            <button type="submit" data-testid="login-submit-btn" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
              Masuk Sistem <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500 mb-3 font-medium uppercase">Demo Login</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleDemoLogin('admin', 'admin123')} data-testid="demo-login-admin" className="py-2.5 px-3 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200">
                <Shield className="w-4 h-4" /> Login Admin
              </button>
              <button onClick={() => handleDemoLogin('guru', 'guru123')} data-testid="demo-login-teacher" className="py-2.5 px-3 bg-slate-100 hover:bg-emerald-50 text-emerald-700 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200">
                <Camera className="w-4 h-4" /> Login Guru
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN APP ============
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {notification && (
        <div className="fixed top-5 right-5 z-50">
          <div className={`px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-white text-sm font-medium ${
            notification.type === 'success' ? 'bg-emerald-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight">Absensi Sekolah</h1>
              <p className="text-xs text-slate-500">v2 · Multi-Fitur</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { k: 'dashboard', label: 'Dashboard' },
              { k: 'students', label: 'Siswa & QR' },
              { k: 'scanner', label: 'Scan QR', icon: Camera },
              { k: 'recap', label: 'Rekap' },
              { k: 'schedule', label: 'Jadwal', icon: Calendar }
            ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)} data-testid={`nav-tab-${t.k}`}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === t.k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {t.icon && <t.icon className="w-3.5 h-3.5" />} {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.role}</span>
            </div>
            <button onClick={handleLogout} data-testid="logout-btn" className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="lg:hidden flex border-t border-slate-200 bg-white overflow-x-auto">
          {['dashboard', 'students', 'scanner', 'recap', 'schedule'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 whitespace-nowrap px-2 ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
              {t === 'dashboard' ? 'Dashboard' : t === 'students' ? 'Siswa' : t === 'scanner' ? 'Scan' : t === 'recap' ? 'Rekap' : 'Jadwal'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ==== DASHBOARD ==== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" data-testid="dashboard-view">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dashboard Kehadiran Sekolah</h2>
                <p className="text-sm text-slate-500 mt-0.5">Ringkasan absensi tanggal {selectedDate}</p>
                {stats?.guru_piket_hari_ini && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                    <Sun className="w-3.5 h-3.5" /> Guru Piket Hari Ini: {stats.guru_piket_hari_ini.teacher_name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50" />
                {user.role === 'admin' && (
                  <button onClick={handleSeedData} disabled={loading} data-testid="seed-demo-btn" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reset & Seed
                  </button>
                )}
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Siswa', value: stats.total_students, color: 'blue', icon: Users },
                  { label: 'Hadir', value: stats.hadir, color: 'emerald', icon: CheckCircle2 },
                  { label: 'Terlambat', value: stats.terlambat, color: 'amber', icon: Clock },
                  { label: 'Sakit/Izin', value: stats.sakit + stats.izin, color: 'purple', icon: AlertCircle },
                  { label: 'Sudah Pulang', value: stats.sudah_pulang, color: 'sky', icon: LogOutIcon },
                  { label: 'Alpa', value: stats.alpa + stats.belum_absen, color: 'red', icon: XCircle },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-2`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                    <h3 className={`text-2xl font-bold text-${s.color}-600 mt-0.5`} data-testid={`stat-${s.label.toLowerCase().replace(/\s|\//g, '-')}`}>{s.value}</h3>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-base">Menu Pintas</h3>
                {[
                  { tab: 'scanner', label: 'Scan QR (Masuk/Pulang/Mapel)', icon: Camera, color: 'emerald' },
                  { tab: 'students', label: 'Kelola Siswa & Cetak QR', icon: Users, color: 'indigo' },
                  { tab: 'recap', label: 'Rekap & Export Excel', icon: FileSpreadsheet, color: 'sky' },
                  { tab: 'schedule', label: 'Jadwal & Guru Piket', icon: Calendar, color: 'amber' },
                ].map((m, i) => (
                  <button key={i} onClick={() => setActiveTab(m.tab)} data-testid={`shortcut-${m.tab}`} className={`w-full py-3 px-4 bg-${m.color}-50 hover:bg-${m.color}-100 text-${m.color}-700 font-medium rounded-xl transition flex items-center justify-between border border-${m.color}-200`}>
                    <div className="flex items-center gap-3"><m.icon className="w-5 h-5" /> <span className="text-sm">{m.label}</span></div>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                <h3 className="font-bold text-slate-900 text-base mb-4">Log Kehadiran Hari Ini ({selectedDate})</h3>
                <div className="overflow-x-auto">
                  {stats?.attendance_today?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">Belum ada scan hari ini.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                          <th className="pb-3 px-2">NIS</th><th className="pb-3 px-2">Nama</th><th className="pb-3 px-2">Kelas</th>
                          <th className="pb-3 px-2">Masuk</th><th className="pb-3 px-2">Pulang</th><th className="pb-3 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {stats?.attendance_today?.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2 font-mono">{a.nis}</td>
                            <td className="py-2 px-2 font-semibold">{a.student_name}</td>
                            <td className="py-2 px-2 text-slate-600">{a.class_name}</td>
                            <td className="py-2 px-2 text-slate-600 font-mono text-xs">{a.time}</td>
                            <td className="py-2 px-2 text-slate-600 font-mono text-xs">{a.time_out || '-'}</td>
                            <td className="py-2 px-2">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                                a.status === 'Terlambat' ? 'bg-amber-100 text-amber-700' :
                                a.status === 'Sakit' ? 'bg-purple-100 text-purple-700' :
                                a.status === 'Izin' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==== STUDENTS ==== */}
        {activeTab === 'students' && (
          <div className="space-y-6" data-testid="students-view">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manajemen Siswa & QR Code</h2>
                <p className="text-sm text-slate-500 mt-0.5">Setiap siswa otomatis dapat QR code unik dengan foto.</p>
              </div>
              {user.role === 'admin' && (
                <button onClick={() => setShowAddStudent(true)} data-testid="open-add-student-modal" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Tambah Siswa
                </button>
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input type="text" data-testid="search-student-input" placeholder="Cari nama, NIS, QR..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm" />
              </div>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm">
                <option>Semua Kelas</option>{CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={fetchStudents} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl">Filter</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Foto</th><th className="py-3 px-4">NIS</th><th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Kelas</th><th className="py-3 px-4">QR Unik</th><th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-12 text-slate-400">Tidak ada siswa.</td></tr>
                    ) : students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{s.name.charAt(0)}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">{s.nis}</td>
                        <td className="py-3 px-4 font-bold">{s.name}</td>
                        <td className="py-3 px-4 text-slate-600">{s.class_name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600">{s.qr_code}</td>
                        <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedStudentQR(s)} data-testid={`print-qr-${s.nis}`} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5" /> Kartu
                          </button>
                          {user.role === 'admin' && (
                            <button onClick={() => handleDeleteStudent(s.id)} data-testid={`delete-student-${s.nis}`} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==== SCANNER ==== */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto space-y-6" data-testid="scanner-view">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Scan QR Code Siswa</h2>
              <p className="text-sm text-slate-500 mt-1">Pilih mode: Masuk, Pulang, atau per Mata Pelajaran</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button onClick={() => setScanMode('masuk')} data-testid="mode-masuk" className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${scanMode === 'masuk' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>
                  <CheckCircle2 className="w-4 h-4" /> Absen MASUK
                </button>
                <button onClick={() => setScanMode('pulang')} data-testid="mode-pulang" className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${scanMode === 'pulang' ? 'bg-sky-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>
                  <LogOutIcon className="w-4 h-4" /> Absen PULANG
                </button>
                <button onClick={() => setScanMode('mapel')} data-testid="mode-mapel" className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${scanMode === 'mapel' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>
                  <BookOpen className="w-4 h-4" /> Absen MAPEL
                </button>
              </div>

              {scanMode === 'mapel' && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                  <select value={subjectScanConfig.subject_name} onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, subject_name: e.target.value })} className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={subjectScanConfig.period} onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, period: parseInt(e.target.value) })} className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>Jam ke-{p}</option>)}
                  </select>
                  <input type="text" placeholder="Nama Guru Mapel" value={subjectScanConfig.teacher_name} onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, teacher_name: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm" />
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Kamera Scanner</h3>
                {!scannerActive ? (
                  <button onClick={() => setScannerActive(true)} data-testid="start-camera-btn" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Nyalakan Kamera
                  </button>
                ) : (
                  <button onClick={stopScanner} data-testid="stop-camera-btn" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Matikan
                  </button>
                )}
              </div>
              {scannerActive ? (
                <div id="reader" className="w-full rounded-xl overflow-hidden border border-slate-300 bg-black"></div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50">
                  <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Kamera nonaktif</p>
                  <p className="text-xs text-slate-400 mt-1">Klik nyalakan atau gunakan input manual di bawah.</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Input NIS / QR Manual</label>
                <div className="flex gap-2">
                  <input type="text" data-testid="manual-scan-input" className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50"
                    placeholder="Contoh: 1001 atau SCH-QR-1001-AHMAD" value={manualCodeInput} onChange={(e) => setManualCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanSubmit(manualCodeInput)} />
                  <button onClick={() => handleScanSubmit(manualCodeInput)} data-testid="manual-scan-submit-btn" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">Catat</button>
                </div>
              </div>
            </div>

            {scanResult && (
              <div className={`p-6 rounded-2xl shadow-sm border ${scanResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${scanResult.success ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {scanResult.success ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-base">{scanResult.success ? `Tercatat! (${scanResult.mode?.toUpperCase()})` : 'Gagal'}</h4>
                    <p className="text-sm mt-1">{scanResult.message}</p>
                    {scanResult.student && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/50 text-xs space-y-1">
                        <p><strong>Nama:</strong> {scanResult.student.name} ({scanResult.student.nis}) - {scanResult.student.class_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Pintasan Uji Coba</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {students.slice(0, 6).map(s => (
                  <button key={s.id} onClick={() => handleScanSubmit(s.nis)} data-testid={`quick-scan-${s.nis}`} className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-left">
                    <p className="text-xs font-bold truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.class_name} • {s.nis}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==== RECAP ==== */}
        {activeTab === 'recap' && (
          <div className="space-y-6" data-testid="recap-view">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rekap Kehadiran</h2>
                <p className="text-sm text-slate-500 mt-0.5">Laporan absensi harian & per mata pelajaran + export</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportExcel} data-testid="export-excel-btn" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button onClick={handleExportPDF} data-testid="export-pdf-btn" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 border border-slate-200">
                  <Printer className="w-4 h-4" /> Cetak / PDF
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} data-testid="recap-date-filter" className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm" />
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} data-testid="recap-class-filter" className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm">
                <option>Semua Kelas</option>{CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="recap-status-filter" className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm">
                <option>Semua Status</option><option>Hadir</option><option>Terlambat</option><option>Sakit</option><option>Izin</option><option>Alpa</option>
              </select>
              <button onClick={fetchAttendance} className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">Terapkan</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><ClockIcon /> Absen Harian (Masuk & Pulang)</h3>
                <span className="text-xs text-slate-500">{attendance.length} data</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Tanggal</th><th className="py-3 px-4">NIS</th><th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Kelas</th><th className="py-3 px-4">Masuk</th><th className="py-3 px-4">Pulang</th>
                      <th className="py-3 px-4">Status</th>{user.role === 'admin' && <th className="py-3 px-4 text-center">Ubah</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {attendance.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-12 text-slate-400">Tidak ada data.</td></tr>
                    ) : attendance.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs">{a.date}</td>
                        <td className="py-3 px-4 font-mono">{a.nis}</td>
                        <td className="py-3 px-4 font-bold">{a.student_name}</td>
                        <td className="py-3 px-4 text-slate-600">{a.class_name}</td>
                        <td className="py-3 px-4 font-mono text-xs">{a.time}</td>
                        <td className="py-3 px-4 font-mono text-xs">{a.time_out || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                            a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                            a.status === 'Terlambat' ? 'bg-amber-100 text-amber-700' :
                            a.status === 'Sakit' ? 'bg-purple-100 text-purple-700' :
                            a.status === 'Izin' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>{a.status}</span>
                        </td>
                        {user.role === 'admin' && (
                          <td className="py-3 px-4 text-center">
                            <select value={a.status} onChange={(e) => handleManualStatusUpdate(a.student_id, e.target.value)} className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50">
                              <option>Hadir</option><option>Terlambat</option><option>Sakit</option><option>Izin</option><option>Alpa</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject Attendance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Absensi per Mata Pelajaran</h3>
                <span className="text-xs text-slate-500">{subjectAttendance.length} data</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Tanggal</th><th className="py-3 px-4">Nama</th><th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Mapel</th><th className="py-3 px-4">Jam ke-</th><th className="py-3 px-4">Guru</th>
                      <th className="py-3 px-4">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {subjectAttendance.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-8 text-slate-400">Belum ada absensi mapel.</td></tr>
                    ) : subjectAttendance.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs">{r.date}</td>
                        <td className="py-3 px-4 font-semibold">{r.student_name}</td>
                        <td className="py-3 px-4 text-slate-600">{r.class_name}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{r.subject_name}</span></td>
                        <td className="py-3 px-4 text-center">{r.period}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{r.teacher_name}</td>
                        <td className="py-3 px-4 font-mono text-xs">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==== SCHEDULE & PIKET ==== */}
        {activeTab === 'schedule' && (
          <div className="space-y-6" data-testid="schedule-view">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Jadwal Kelas & Guru Piket</h2>
                <p className="text-sm text-slate-500 mt-0.5">Kelola jadwal mata pelajaran dan piket harian</p>
              </div>
              <div className="flex gap-2">
                {user.role === 'admin' && (
                  <>
                    <button onClick={() => setShowAddSchedule(true)} data-testid="add-schedule-btn" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Jadwal
                    </button>
                    <button onClick={() => setShowAddPiket(true)} data-testid="add-piket-btn" className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Guru Piket
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Guru Piket List */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2"><Sun className="w-5 h-5 text-amber-500" /> Guru Piket</h3>
                {piketList.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Belum ada data piket.</p>
                ) : piketList.map(p => (
                  <div key={p.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-mono text-amber-700">{p.date}</p>
                        <p className="font-semibold text-slate-900 text-sm">{p.teacher_name}</p>
                        {p.notes && <p className="text-xs text-slate-600 mt-1">{p.notes}</p>}
                      </div>
                      {user.role === 'admin' && (
                        <button onClick={() => handleDeletePiket(p.id)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Jadwal */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Jadwal Pelajaran</h3>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                    <option>Semua Kelas</option>{CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <th className="py-3 px-4">Hari</th><th className="py-3 px-4">Jam ke-</th><th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4">Mapel</th><th className="py-3 px-4">Guru</th><th className="py-3 px-4">Ruang</th>
                        {user.role === 'admin' && <th className="py-3 px-4"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {schedules.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-slate-400">Belum ada jadwal.</td></tr>
                      ) : schedules.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{s.day}</span></td>
                          <td className="py-3 px-4 font-bold text-center">{s.period}</td>
                          <td className="py-3 px-4 text-slate-600">{s.class_name}</td>
                          <td className="py-3 px-4 font-semibold">{s.subject_name}</td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{s.teacher_name}<br /><span className="text-slate-400">{s.start_time}-{s.end_time}</span></td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{s.room || '-'}</td>
                          {user.role === 'admin' && (
                            <td className="py-3 px-4">
                              <button onClick={() => handleDeleteSchedule(s.id)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ==== MODAL: ADD STUDENT ==== */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Tambah Siswa Baru</h3>
              <button onClick={() => setShowAddStudent(false)} className="p-1.5 bg-slate-100 rounded-xl"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Foto Siswa (opsional)</label>
                <div className="flex items-center gap-3">
                  {newStudent.photo_url && <img src={newStudent.photo_url} alt="preview" className="w-16 h-16 rounded-xl object-cover border" />}
                  <label className="flex-1 cursor-pointer px-4 py-3 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 hover:bg-slate-50">
                    <ImagePlus className="w-4 h-4 inline mr-1" /> Pilih foto (opsional)
                    <input type="file" accept="image/*" data-testid="new-student-photo" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <input type="text" placeholder="NIS" data-testid="new-student-nis" required value={newStudent.nis} onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" />
              <input type="text" placeholder="Nama Lengkap" data-testid="new-student-name" required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" />
              <select value={newStudent.class_name} data-testid="new-student-class" onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newStudent.gender} data-testid="new-student-gender" onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="L">Laki-laki</option><option value="P">Perempuan</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-semibold">Batal</button>
                <button type="submit" data-testid="submit-new-student-btn" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Simpan & Generate QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==== MODAL: QR CARD ==== */}
      {selectedStudentQR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-indigo-600">Kartu Pelajar QR</span>
              <button onClick={() => setSelectedStudentQR(null)} className="p-1.5 bg-slate-100 rounded-xl"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-6 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div>
                <h4 className="font-bold text-lg leading-tight">SMK / SMA UNGGULAN</h4>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest">Kartu Presensi QR</p>
              </div>
              {selectedStudentQR.photo_url && (
                <img src={selectedStudentQR.photo_url} alt={selectedStudentQR.name} className="w-24 h-24 rounded-xl object-cover mx-auto border-4 border-white/40 shadow-lg" />
              )}
              <div className="bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={selectedStudentQR.qr_code} size={130} level="H" includeMargin={true} />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-base">{selectedStudentQR.name}</h5>
                <p className="text-xs text-indigo-200 font-mono">NIS: {selectedStudentQR.nis} • {selectedStudentQR.class_name}</p>
                <p className="text-[10px] text-indigo-300 font-mono">{selectedStudentQR.qr_code}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} data-testid="print-qr-card-btn" className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button onClick={() => setSelectedStudentQR(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-semibold">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ==== MODAL: ADD SCHEDULE ==== */}
      {showAddSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Tambah Jadwal</h3>
              <button onClick={() => setShowAddSchedule(false)} className="p-1.5 bg-slate-100 rounded-xl"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={newSchedule.day} onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })} className="px-4 py-2.5 border rounded-xl text-sm bg-white" data-testid="schedule-day">
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
                <input type="number" min="1" max="10" placeholder="Jam ke-" value={newSchedule.period} onChange={(e) => setNewSchedule({ ...newSchedule, period: e.target.value })} className="px-4 py-2.5 border rounded-xl text-sm" data-testid="schedule-period" required />
              </div>
              <select value={newSchedule.class_name} onChange={(e) => setNewSchedule({ ...newSchedule, class_name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white" data-testid="schedule-class">
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newSchedule.subject_name} onChange={(e) => setNewSchedule({ ...newSchedule, subject_name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white" data-testid="schedule-subject">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="Nama Guru" value={newSchedule.teacher_name} onChange={(e) => setNewSchedule({ ...newSchedule, teacher_name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" data-testid="schedule-teacher" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={newSchedule.start_time} onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })} className="px-4 py-2.5 border rounded-xl text-sm" />
                <input type="time" value={newSchedule.end_time} onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })} className="px-4 py-2.5 border rounded-xl text-sm" />
              </div>
              <input type="text" placeholder="Ruang (opsional)" value={newSchedule.room} onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSchedule(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-semibold">Batal</button>
                <button type="submit" data-testid="submit-schedule-btn" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==== MODAL: ADD PIKET ==== */}
      {showAddPiket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Tambah Guru Piket</h3>
              <button onClick={() => setShowAddPiket(false)} className="p-1.5 bg-slate-100 rounded-xl"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePiket} className="space-y-3">
              <input type="date" value={newPiket.date} onChange={(e) => setNewPiket({ ...newPiket, date: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" data-testid="piket-date" required />
              <input type="text" placeholder="Nama Guru Piket" value={newPiket.teacher_name} onChange={(e) => setNewPiket({ ...newPiket, teacher_name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" data-testid="piket-teacher" required />
              <textarea placeholder="Catatan (opsional)" value={newPiket.notes} onChange={(e) => setNewPiket({ ...newPiket, notes: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl text-sm" rows="2" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddPiket(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-semibold">Batal</button>
                <button type="submit" data-testid="submit-piket-btn" className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Sistem Absensi Sekolah v2.0 • QR Code + Absen Pulang + Mapel + Jadwal + Excel • © 2026</p>
      </footer>
    </div>
  );
}

function ClockIcon() { return <Clock className="w-4 h-4" />; }
