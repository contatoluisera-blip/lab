'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { NotificationItem } from '@/lib/notifications';

interface ToastItem extends NotificationItem {
  visible: boolean;
}

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationItem>;
      const newNotification = customEvent.detail;
      
      const toastId = newNotification.id;
      
      // Add to toasts list
      setToasts(prev => [
        ...prev,
        { ...newNotification, visible: true }
      ]);

      // Set timeout to hide (animate out) after 3.6s, then remove from state at 4s
      setTimeout(() => {
        setToasts(prev => 
          prev.map(t => t.id === toastId ? { ...t, visible: false } : t)
        );
      }, 3600);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 4000);
    };

    window.addEventListener('asa-new-notification', handleNewNotification);
    return () => {
      window.removeEventListener('asa-new-notification', handleNewNotification);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'warning' ? AlertTriangle : Info;
        const iconColor = toast.type === 'success' ? 'text-brand-emerald' : toast.type === 'warning' ? 'text-amber-400' : 'text-blue-400';
        const borderColor = toast.type === 'success' ? 'border-brand-emerald/30' : toast.type === 'warning' ? 'border-amber-400/30' : 'border-blue-400/30';
        const shadowColor = toast.type === 'success' ? 'shadow-brand-emerald/5' : toast.type === 'warning' ? 'shadow-amber-500/5' : 'shadow-blue-500/5';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full neo-glass-panel border ${borderColor} rounded-2xl p-4 shadow-2xl flex items-start gap-3 transition-all duration-300 transform ${
              toast.visible 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-10 opacity-0 scale-95'
            } ${shadowColor}`}
            style={{
              background: 'rgba(10, 10, 11, 0.85)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className={`mt-0.5 p-1 rounded-lg bg-white/5 ${iconColor} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white leading-tight">{toast.title}</h4>
              <p className="text-xs text-gray-400 leading-normal font-light">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors p-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
