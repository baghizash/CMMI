import React, { useState, useRef } from 'react';
import { Camera, Trash2, Save } from 'lucide-react';
import * as api from '../services/api';

// Halaman Profil: pengguna melihat data akunnya, mengganti nama
// lengkap, dan menambahkan foto profil (diperkecil di peramban
// sebelum dikirim, disimpan sebagai data URI kecil di server).
export default function ProfilePage({ user, notify, onUserUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(user?.photo || null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const initials = (name || user?.username || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const roleLabel = { admin: 'Admin', kepsek: 'Kepala Sekolah', guru: 'Guru' }[user?.role] || user?.role;

  const handlePickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify && notify('error', 'Pilih berkas gambar (JPG/PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.85));
        setPhotoChanged(true);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoChanged(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (photoChanged) payload.photo = photo;
      const res = await api.updateProfile(payload);
      onUserUpdate && onUserUpdate({ name: res.data.name, photo: res.data.photo });
      setPhotoChanged(false);
      notify && notify('success', 'Profil berhasil diperbarui.');
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Profil Saya</h2>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">Foto dan nama yang tampil di aplikasi untuk akun Anda</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          {photo ? (
            <img src={photo} alt="Foto profil" className="w-28 h-28 rounded-full object-cover border-2 border-[#E7E0D0] shadow-soft" />
          ) : (
            <span className="w-28 h-28 rounded-full bg-marine text-white grid place-items-center text-3xl font-extrabold shadow-soft">{initials}</span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2.5 bg-marine hover:bg-marine-deep text-white font-bold text-xs rounded-full transition-all shadow-tactile inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> {photo ? 'Ganti Foto' : 'Tambah Foto'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-4 py-2.5 bg-white border border-slate-200 text-alpa font-bold text-xs rounded-full hover:bg-alpa-tint transition-all inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Hapus Foto
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePickPhoto} />
          <p className="text-[11px] text-slate-400 font-semibold text-center">Foto otomatis diperkecil sebelum disimpan, jadi halaman tetap ringan.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-marine/25 focus:border-marine"
            />
            <p className="text-[10px] text-slate-400 mt-1">Nama ini yang dicocokkan dengan penugasan piket, wali kelas, dan jadwal mengajar Anda. Samakan dengan data sekolah.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <p className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-500">{user?.username}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran</label>
              <p className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-marine hover:bg-marine-deep active:shadow-tactile-pressed text-white font-extrabold text-xs rounded-full transition-all shadow-tactile inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
}
