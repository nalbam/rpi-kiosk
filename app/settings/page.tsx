'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig } from '@/lib/storage';
import { KioskConfig, defaultConfig } from '@/lib/config';
import Toast from '@/components/shared/Toast';
import LocationSettings from './components/LocationSettings';
import CalendarSettings from './components/CalendarSettings';
import RSSSettings from './components/RSSSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Load configuration from server
  useEffect(() => {
    async function loadConfig() {
      const currentConfig = await getConfig();
      setConfig(currentConfig);
    }
    loadConfig();
  }, []);

  // Enable scrolling on settings page (disable kiosk mode overflow:hidden)
  useEffect(() => {
    // Save original overflow style
    const originalOverflow = document.body.style.overflow;

    // Enable scrolling on settings page
    document.body.style.overflow = 'auto';

    // Restore original overflow when leaving settings page
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);


  const handleSave = async () => {
    if (config) {
      const result = await saveConfig(config);
      if (result.success) {
        router.push('/?message=saved');
      } else {
        setErrorToast(result.error || 'Failed to save settings');
      }
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const result = await saveConfig(defaultConfig);
      if (result.success) {
        router.push('/?message=reset');
      } else {
        setErrorToast(result.error || 'Failed to reset settings');
      }
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 overflow-x-hidden">
      {/* Error Toast */}
      {errorToast && (
        <Toast
          message={errorToast}
          type="error"
          duration={5000}
          onClose={() => setErrorToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Settings</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
          >
            Back to Home
          </button>
        </div>

        <div className="space-y-6 min-w-0">
          <LocationSettings
            config={config}
            setConfig={setConfig}
            setErrorToast={setErrorToast}
          />

          <CalendarSettings config={config} setConfig={setConfig} />

          <RSSSettings config={config} setConfig={setConfig} />
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-base sm:text-lg font-semibold transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-base sm:text-lg font-semibold transition-colors whitespace-nowrap"
            >
              Reset to Defaults
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Settings are saved to config.json on the server
          </p>
        </div>
      </div>
    </div>
  );
}
