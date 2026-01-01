'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-600',
    borderColor: 'border-red-500',
  },
} as const;

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  // Auto-hide toast after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg border ${config.bgColor} ${config.borderColor}`}>
        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
