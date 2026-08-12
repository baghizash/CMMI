import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES } from '../constants';

export default function ImportStudentsModal({ isOpen, onClose, onImportSuccess, notify }) {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setFileContent(text);
        parseCSV(text);
      } catch (err) {
        setError('Gagal membaca file CSV. Pastikan format CSV sesuai.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      setError('File CSV kosong atau tidak memiliki baris data.');
      setPreviewData([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const parsed = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 3) {
        // Expected format: NIS, Nama, Kelas, Gender
        parsed.push({
          nis: cols[0] || '',
          name: cols[1] || '',
          class_name: cols[2] || CLASSES[0],
          gender: cols[3] && cols[3].toUpperCase() === 'P' ? 'P' : 'L',
        });
      }
    }

    setPreviewData(parsed);
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) {
      setError('Tidak ada data yang valid untuk diimpor.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.importStudents(previewData);
      notify('success', res.data.message || 'Impor siswa berhasil!');
      onImportSuccess();
      onClose();
      setFileContent('');
      setFileName('');
      setPreviewData([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengimpor data siswa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Import Data Siswa (CSV)</h3>
            <p className="text-xs text-slate-500">Unggah file CSV dengan kolom: NIS, Nama, Kelas, Gender</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
            <input
              type="file"
              accept=".csv, .txt"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload-input"
            />
            <label htmlFor="csv-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-700">
                {fileName ? fileName : 'Klik untuk memilih file CSV'}
              </span>
              <span className="text-xs text-slate-400">Format: NIS, Nama, Kelas, Gender (L/P)</span>
            </label>
          </div>

          {previewData.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pratinjau ({previewData.length} Siswa)
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2 font-semibold">NIS</th>
                      <th className="p-2 font-semibold">Nama</th>
                      <th className="p-2 font-semibold">Kelas</th>
                      <th className="p-2 font-semibold">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-slate-700">{row.nis}</td>
                        <td className="p-2 font-medium text-slate-800">{row.name}</td>
                        <td className="p-2 text-slate-600">{row.class_name}</td>
                        <td className="p-2 text-slate-600">{row.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 10 && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  Menampilkan 10 dari {previewData.length} siswa...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-auto border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading || previewData.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Mengimpor...' : `Impor ${previewData.length} Siswa`}
          </button>
        </div>
      </div>
    </div>
  );
}
