'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings } from 'lucide-react';
import { initializeConfig } from '@/lib/storage';
import Clock from '@/components/Clock/Clock';
import Weather from '@/components/Weather/Weather';
import Calendar from '@/components/Calendar/Calendar';
import RSS from '@/components/RSS/RSS';
import Toast from '@/components/shared/Toast';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Toast handler component that uses useSearchParams
function ToastHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle toast messages from URL parameters
  useEffect(() => {
    const message = searchParams.get('message');

    if (message === 'saved') {
      setToastMessage('Settings saved successfully');
    } else if (message === 'reset') {
      setToastMessage('Settings reset to defaults');
    }

    // Clear URL parameters
    if (message) {
      router.replace('/');
    }
  }, [searchParams, router]);

  if (!toastMessage) return null;

  return (
    <Toast
      message={toastMessage}
      type="success"
      duration={3000}
      onClose={() => setToastMessage(null)}
    />
  );
}

export default function Home() {
  const router = useRouter();

  // Initialize config on first visit (auto-detect browser settings)
  useEffect(() => {
    initializeConfig();
  }, []);

  return (
    <main className="container-fullscreen bg-black text-white">
      {/* Toast Notification - Wrapped in Suspense */}
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>

      <div className="flex flex-col h-full p-vw-sm">
        {/* Header with Settings Button */}
        <div className="flex justify-end mb-vw-xs flex-shrink-0">
          <button
            onClick={() => router.push('/settings')}
            className="px-vw-sm py-vw-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-vw-xs flex items-center gap-2"
            aria-label="Open settings"
          >
            <Settings size={16} />
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
            <ErrorBoundary widgetName="Weather">
              <Weather />
            </ErrorBoundary>
          </div>

          {/* Calendar Widget */}
          <div className="flex flex-col min-h-0">
            <ErrorBoundary widgetName="Calendar">
              <Calendar />
            </ErrorBoundary>
          </div>

          {/* RSS Widget */}
          <div className="flex flex-col min-h-0">
            <ErrorBoundary widgetName="RSS">
              <RSS />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </main>
  );
}
