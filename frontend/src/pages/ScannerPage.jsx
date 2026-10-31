import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import * as api from '../services/api';
import { SUBJECTS } from '../constants';

export default function ScannerPage({ user, notify }) {
  const isGuruMapel = user?.role === 'guru';
  const [piketToday, setPiketToday] = useState(false);
  const canDaily = !isGuruMapel || piketToday;
  const [scanMode, setScanMode] = useState(isGuruMapel ? 'mapel' : 'masuk'); // masuk | pulang | mapel
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [subjectScanConfig, setSubjectScanConfig] = useState({
    subject_name: SUBJECTS[0],
    period: 1,
    teacher_name: user?.name || '',
  });

  const [scanResult, setScanResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraError, setCameraError] = useState('');

  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isGuruMapel) {
      setScanMode('mapel');
      api.getMyTeacherScope()
        .then((res) => {
          if (res.data?.is_piket_today) {
            setPiketToday(true);
            setScanMode('masuk');
          }
          if (res.data?.subjects?.length > 0) {
            setTeacherSubjects(res.data.subjects);
            setSubjectScanConfig((prev) => ({
              ...prev,
              subject_name: res.data.subjects[0],
              teacher_name: user?.name || '',
            }));
          }
        })
        .catch((err) => console.error('Failed fetching teacher scope', err));
    }
  }, [user]);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Camera permission/detection error:', err);
      });
  }, []);

  const startScanner = async () => {
    setCameraError('');
    if (!selectedCameraId) {
      setCameraError('Kamera tidak terdeteksi pada perangkat ini.');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {}
      );
      setScannerActive(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError('Gagal membuka kamera: ' + (err.message || 'Izin kamera ditolak.'));
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scannerActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Failed stopping QR scanner', e);
      }
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleProcessCode = async (code) => {
    const targetCode = code || manualCodeInput;
    if (!targetCode) return;

    try {
      let res;
      if (scanMode === 'mapel') {
        res = await api.scanSubjectAttendance({
          identifier: targetCode,
          subject_name: subjectScanConfig.subject_name,
          period: subjectScanConfig.period,
          teacher_name: subjectScanConfig.teacher_name || user?.name || 'Guru Mapel',
        });
      } else {
        res = await api.scanAttendance({
          qr_code: targetCode,
          mode: scanMode,
          recorded_by: user?.name || 'Guru Piket',
        });
      }

      setScanResult(res.data);
      notify && notify(res.data.success ? 'success' : 'error', res.data.message);
      setManualCodeInput('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memproses QR / NIS.';
      setScanResult({ success: false, message: msg });
      notify && notify('error', msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Scan Mode Header Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Pemindai QR Code Absensi</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {isGuruMapel
              ? piketToday
                ? 'Hari ini Anda bertugas piket: Absen Masuk, Pulang, dan Mapel tersedia'
                : 'Absensi mata pelajaran untuk kelas yang Anda ampu'
              : 'Absen Masuk, Pulang, atau Absensi Mata Pelajaran'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
          {canDaily && (
            <>
              <button
                onClick={() => { setScanMode('masuk'); stopScanner(); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scanMode === 'masuk' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                Absen Masuk
              </button>
              <button
                onClick={() => { setScanMode('pulang'); stopScanner(); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scanMode === 'pulang' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                Absen Pulang
              </button>
            </>
          )}

          {isGuruMapel && (
            <button
              onClick={() => { setScanMode('mapel'); stopScanner(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scanMode === 'mapel' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Absen Mapel
            </button>
          )}
        </div>
      </div>

      {/* Config for Subject Scan */}
      {scanMode === 'mapel' && (
        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-indigo-900 mb-1">Mata Pelajaran</label>
            <select
              value={subjectScanConfig.subject_name}
              onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, subject_name: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-xs font-medium focus:outline-none"
            >
              {(teacherSubjects.length > 0 ? teacherSubjects : SUBJECTS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-900 mb-1">Jam Ke-</label>
            <input
              type="number"
              min="1"
              max="10"
              value={subjectScanConfig.period}
              onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, period: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-xs font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-900 mb-1">Nama Guru Pengajar</label>
            <input
              type="text"
              value={subjectScanConfig.teacher_name}
              onChange={(e) => setSubjectScanConfig({ ...subjectScanConfig, teacher_name: e.target.value })}
              placeholder="Nama Guru"
              className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-xs font-medium focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Camera Viewport / Manual Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> Kamera Pemindai
            </span>

            {availableCameras.length > 1 && (
              <select
                value={selectedCameraId || ''}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2 py-1 bg-slate-50"
              >
                {availableCameras.map((c) => (
                  <option key={c.id} value={c.id}>{c.label || `Kamera ${c.id}`}</option>
                ))}
              </select>
            )}
          </div>

          <div className="w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-800">
            <div id="qr-reader" className="w-full h-full object-cover" />
            {!scannerActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/90">
                <QrCode className="w-16 h-16 mb-3 text-slate-600" />
                <p className="text-xs font-medium">Klik tombol di bawah untuk mengaktifkan pemindai kamera</p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs font-medium text-rose-600 mt-3 text-center">{cameraError}</p>
          )}

          <div className="w-full mt-4 flex gap-3">
            {!scannerActive ? (
              <button
                onClick={startScanner}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/20"
              >
                Buka Kamera
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl transition-all"
              >
                Tutup Kamera
              </button>
            )}
          </div>
        </div>

        {/* Manual Input & Result Panel */}
        <div className="space-y-6">
          {/* Manual Input Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Input Manual (NIS / QR Code)</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessCode()}
                  placeholder="Ketik NIS atau Kode QR..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={() => handleProcessCode()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/20"
              >
                Proses
              </button>
            </div>
          </div>

          {/* Last Scan Result Card */}
          {scanResult && (
            <div
              className={`p-6 rounded-3xl border shadow-md animate-fade-in ${
                scanResult.success
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-4">
                {scanResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-rose-600 shrink-0 mt-1" />
                )}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base">{scanResult.message}</h4>
                  {scanResult.student && (
                    <div className="text-xs space-y-0.5 pt-2 border-t border-emerald-200/60 text-emerald-800">
                      <p><span className="font-bold">Siswa:</span> {scanResult.student.name}</p>
                      <p><span className="font-bold">Kelas:</span> {scanResult.student.class_name}</p>
                      <p><span className="font-bold">NIS:</span> {scanResult.student.nis}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
