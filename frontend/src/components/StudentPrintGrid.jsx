import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';

export default function StudentPrintGrid({ students, className, onClose }) {
  if (!students || students.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md overflow-y-auto p-4 md:p-8">
      {/* Non-printable Control Header */}
      <div className="print:hidden max-w-5xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Cetak QR Code Kelas: {className}</h3>
          <p className="text-xs text-slate-500">Total {students.length} Siswa</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Cards Grid (A4 Print Layout) */}
      <div className="bg-white max-w-5xl mx-auto p-6 md:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4">
          {students.map((st) => (
            <div
              key={st.id}
              className="border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center bg-white shadow-sm print:break-inside-avoid aspect-[3/4]"
            >
              <div className="w-full border-b border-slate-200 pb-2 mb-2">
                <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase block">SMA HIGH SCHOOL</span>
                <span className="text-xs font-black text-slate-900 block truncate">{st.name}</span>
              </div>

              <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-200 my-1">
                <QRCodeSVG value={st.qr_code || st.nis} size={110} level="H" includeMargin={true} />
              </div>

              <div className="w-full pt-2 border-t border-slate-200 text-slate-800">
                <p className="text-[11px] font-mono font-bold">{st.nis}</p>
                <p className="text-[10px] text-slate-500">{st.class_name}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{st.qr_code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
