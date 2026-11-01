import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function NotificationToast({ notification }) {
  if (!notification) return null;
  const { type, message } = notification;

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-pop-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[type] || bgColors.success}`}>
        {icons[type] || icons.success}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
