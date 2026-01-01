'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initializeConfig } from '@/lib/storage';
import { Settings, CheckCircle, X } from 'lucide-react';
import Clock from '@/components/Clock/Clock';
import Weather from '@/components/Weather/Weather';
import Calendar from '@/components/Calendar/Calendar';
import RSS from '@/components/RSS/RSS';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);

  // Initialize config on first visit (auto-detect browser settings)
  useEffect(() => {
    initializeConfig();
  }, []);

  // Handle toast messages from URL parameters
  useEffect(() => {
    const message = searchParams.get('message');

    if (message === 'saved') {
      setToast({ message: 'Settings saved successfully', type: 'success' });
    } else if (message === 'reset') {
      setToast({ message: 'Settings reset to defaults', type: 'success' });
    }

    // Clear URL parameters
    if (message) {
      router.replace('/');
    }
  }, [searchParams, router]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <main className="container-fullscreen bg-black text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg border bg-green-600 border-green-500">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full p-vw-sm">
        {/* Header with Settings Button */}
        <div className="flex justify-end mb-vw-xs flex-shrink-0">
          <button
            onClick={() => router.push('/settings')}
            className="px-vw-sm py-vw-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-vw-xs flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        {/* Clock Section */}
        <div className="mb-vw-md flex-shrink-0">
          <Clock />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-vw-sm flex-1 min-h-0">
          {/* Weather Widget */}
          <div className="flex flex-col min-h-0">
            <Weather />
          </div>

          {/* Calendar Widget */}
          <div className="flex flex-col min-h-0">
            <Calendar />
          </div>

          {/* RSS Widget */}
          <div className="flex flex-col min-h-0">
            <RSS />
          </div>
        </div>
      </div>
    </main>
  );
}
