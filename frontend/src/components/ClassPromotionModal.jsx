import React, { useState } from 'react';
import { GraduationCap, ArrowRight, X, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES } from '../constants';

export default function ClassPromotionModal({ isOpen, onClose, onPromotionSuccess, notify }) {
  const [fromClass, setFromClass] = useState(CLASSES[0]);
  const [toClass, setToClass] = useState(CLASSES[1] || '1B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (fromClass === toClass) {
      setError('Kelas asal dan kelas tujuan tidak boleh sama.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.promoteClass({ from_class: fromClass, to_class: toClass });
      notify('success', res.data.message || 'Kenaikan kelas berhasil!');
      onPromotionSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memindahkan siswa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-pop-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Kenaikan Kelas Siswa</h3>
            <p className="text-xs text-slate-500">Pindahkan semua siswa dari satu kelas ke kelas baru</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-5 gap-3 items-center">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dari Kelas</label>
              <select
                value={fromClass}
                onChange={(e) => setFromClass(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs bg-white"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 flex justify-center pt-5">
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ke Kelas Baru</label>
              <select
                value={toClass}
                onChange={(e) => setToClass(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs bg-white"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
                <option value="Lulus/Alumni">Lulus / Alumni</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Proses Kenaikan Kelas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
