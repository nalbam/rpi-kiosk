'use client';

import { useRouter } from 'next/navigation';
import Clock from '@/components/Clock/Clock';
import Weather from '@/components/Weather/Weather';
import Calendar from '@/components/Calendar/Calendar';
import RSS from '@/components/RSS/RSS';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Settings Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push('/settings')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            ⚙️ 설정
          </button>
        </div>

        {/* Clock Section */}
        <div className="mb-12">
          <Clock />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Widget */}
          <div className="lg:col-span-1">
            <Weather />
          </div>

          {/* Calendar Widget */}
          <div className="lg:col-span-1">
            <Calendar />
          </div>

          {/* RSS Widget */}
          <div className="lg:col-span-1">
            <RSS />
          </div>
        </div>
      </div>
    </main>
  );
}
