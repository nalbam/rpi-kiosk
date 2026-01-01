'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig, resetConfig } from '@/lib/storage';
import { KioskConfig } from '@/lib/config';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [rssInput, setRssInput] = useState('');

  useEffect(() => {
    const currentConfig = getConfig();
    setConfig(currentConfig);
  }, []);

  const handleSave = () => {
    if (config) {
      const result = saveConfig(config);
      if (result.success) {
        alert('설정이 저장되었습니다');
        router.push('/');
      } else {
        alert(`설정 저장 실패: ${result.error}`);
      }
    }
  };

  const handleReset = () => {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
      resetConfig();
      const defaultConfig = getConfig();
      setConfig(defaultConfig);
      alert('설정이 초기화되었습니다');
    }
  };

  const handleAddRSS = () => {
    if (rssInput.trim() && config) {
      setConfig({
        ...config,
        rssFeeds: [...config.rssFeeds, rssInput.trim()],
      });
      setRssInput('');
    }
  };

  const handleRemoveRSS = (index: number) => {
    if (config) {
      setConfig({
        ...config,
        rssFeeds: config.rssFeeds.filter((_, i) => i !== index),
      });
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">설정</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            메인으로
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">시간 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">타임존</label>
                <input
                  type="text"
                  value={config.timezone}
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Asia/Seoul"
                />
                <p className="text-xs text-gray-500 mt-1">
                  예: Asia/Seoul, America/New_York, Europe/London
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">시간 서버 (선택사항)</label>
                <input
                  type="text"
                  value={config.timeServer || ''}
                  onChange={(e) => setConfig({ ...config, timeServer: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="time.google.com"
                />
              </div>
            </div>
          </div>

          {/* Weather Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">날씨 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">도시</label>
                <input
                  type="text"
                  value={config.weatherLocation.city}
                  onChange={(e) => setConfig({
                    ...config,
                    weatherLocation: { ...config.weatherLocation, city: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Seoul"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">위도 (Latitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={config.weatherLocation.lat}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= -90 && value <= 90) {
                        setConfig({
                          ...config,
                          weatherLocation: { ...config.weatherLocation, lat: value }
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">-90 ~ 90</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">경도 (Longitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    value={config.weatherLocation.lon}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= -180 && value <= 180) {
                        setConfig({
                          ...config,
                          weatherLocation: { ...config.weatherLocation, lon: value }
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">-180 ~ 180</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">새로고침 간격 (분)</label>
                <input
                  type="number"
                  min="1"
                  value={config.refreshIntervals.weather}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1) {
                      setConfig({
                        ...config,
                        refreshIntervals: { ...config.refreshIntervals, weather: value }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">캘린더 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Google 캘린더 URL</label>
                <input
                  type="url"
                  value={config.calendarUrl || ''}
                  onChange={(e) => setConfig({ ...config, calendarUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google 캘린더에서 iCal 형식의 비공개 URL을 입력하세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">새로고침 간격 (분)</label>
                <input
                  type="number"
                  min="1"
                  value={config.refreshIntervals.calendar}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1) {
                      setConfig({
                        ...config,
                        refreshIntervals: { ...config.refreshIntervals, calendar: value }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RSS Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">RSS 피드 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">RSS 피드 추가</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={rssInput}
                    onChange={(e) => setRssInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRSS()}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/feed.xml"
                  />
                  <button
                    onClick={handleAddRSS}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">현재 RSS 피드</label>
                <div className="space-y-2">
                  {config.rssFeeds.map((feed, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg">
                      <span className="text-sm truncate flex-1">{feed}</span>
                      <button
                        onClick={() => handleRemoveRSS(index)}
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  {config.rssFeeds.length === 0 && (
                    <div className="text-gray-500 text-sm">등록된 RSS 피드가 없습니다</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">새로고침 간격 (분)</label>
                <input
                  type="number"
                  min="1"
                  value={config.refreshIntervals.rss}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1) {
                      setConfig({
                        ...config,
                        refreshIntervals: { ...config.refreshIntervals, rss: value }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
          >
            저장
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-semibold transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
