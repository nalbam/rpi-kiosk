'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initConfigFromFile } from '@/lib/storage';
import Clock from '@/components/Clock/Clock';
import Weather from '@/components/Weather/Weather';
import Calendar from '@/components/Calendar/Calendar';
import RSS from '@/components/RSS/RSS';

export default function Home() {
  const router = useRouter();

  // Initialize config from config.json on first load
  useEffect(() => {
    initConfigFromFile();
  }, []);

  return (
    <main className="container-fullscreen bg-black text-white">
      <div className="flex flex-col h-full p-vw-sm">
        {/* Header with Settings Button */}
        <div className="flex justify-end mb-vw-xs flex-shrink-0">
          <button
            onClick={() => router.push('/settings')}
            className="px-vw-sm py-vw-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-vw-xs"
          >
            ⚙️ 설정
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
