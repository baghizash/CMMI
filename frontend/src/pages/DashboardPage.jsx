import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, AlertCircle, XCircle, Clock, Calendar, RefreshCw, BarChart2, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import * as api from '../services/api';
import SemesterCard from '../components/SemesterCard';

export default function DashboardPage({ notify, user }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardStats({ date: selectedDate });
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
      notify && notify('error', 'Gagal memuat statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Ringkasan Presensi Sekolah</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Statistik & Analisis Kehadiran Siswa Real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={fetchStats}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <SemesterCard notify={notify} user={user} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
            <span className="text-2xl font-black text-slate-900">{stats?.total_students || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hadir Hari Ini</span>
            <span className="text-2xl font-black text-emerald-600">{stats?.hadir || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Terlambat</span>
            <span className="text-2xl font-black text-amber-600">{stats?.terlambat || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Belum / Tidak Hadir</span>
            <span className="text-2xl font-black text-rose-600">{stats?.belum_absen || 0}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section (Item 3 Requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend Graph */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Tren Kehadiran 7 Hari Terakhir</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hadir" name="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="izin_sakit" name="Izin/Sakit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpa" name="Alpa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Attendance Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Persentase Kehadiran per Kelas (%)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.class_attendance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="class_name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip formatter={(value) => [`${value}%`, 'Kehadiran']} />
                <Bar dataKey="percentage" name="Kehadiran (%)" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
