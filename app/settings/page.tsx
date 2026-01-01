'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig, detectBrowserSettings, detectGeolocation } from '@/lib/storage';
import { KioskConfig, DATE_FORMAT_OPTIONS, defaultConfig } from '@/lib/config';
import { API } from '@/lib/constants';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [rssInput, setRssInput] = useState('');
  const [timezones, setTimezones] = useState<string[]>([]);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [detectedCity, setDetectedCity] = useState<string>('');
  const [detectedCoordinates, setDetectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Load configuration from server
  useEffect(() => {
    async function loadConfig() {
      const currentConfig = await getConfig();
      setConfig(currentConfig);
    }
    loadConfig();
  }, []);

  // Load available timezones
  useEffect(() => {
    try {
      const availableTimezones = Intl.supportedValuesOf('timeZone');
      setTimezones(availableTimezones);
    } catch (error) {
      console.error('Failed to load timezones:', error);
      // Fallback to common timezones
      setTimezones([
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Seoul',
        'Asia/Shanghai',
        'Australia/Sydney',
      ]);
    }
  }, []);

  // Detect browser settings on mount
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);

      // Extract city from timezone
      if (timezone.includes('/')) {
        const parts = timezone.split('/');
        const city = parts[parts.length - 1].replace(/_/g, ' ');
        setDetectedCity(city);
      }
    } catch (error) {
      console.error('Failed to detect browser settings:', error);
    }
  }, []);

  // Group timezones by region
  const groupedTimezones = timezones.reduce((groups, tz) => {
    const region = tz.includes('/') ? tz.split('/')[0] : 'Other';
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(tz);
    return groups;
  }, {} as Record<string, string[]>);

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
        alert('Settings saved successfully');
        router.push('/');
      } else {
        alert(`Failed to save settings: ${result.error}`);
      }
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const result = await saveConfig(defaultConfig);
      if (result.success) {
        setConfig(defaultConfig);
        alert('Settings have been reset to default values');
      } else {
        alert(`Failed to reset settings: ${result.error}`);
      }
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    const coords = await detectGeolocation();
    setDetectingLocation(false);

    if (coords) {
      setDetectedCoordinates(coords);
      // Automatically apply detected coordinates
      if (config) {
        setConfig({
          ...config,
          weatherLocation: {
            ...config.weatherLocation,
            lat: coords.lat,
            lon: coords.lon,
          },
        });
      }
    } else {
      alert('Failed to detect location. Please enable location permissions.');
    }
  };

  const handleApplyDetectedTimezone = () => {
    if (config && detectedTimezone) {
      setConfig({ ...config, timezone: detectedTimezone });
    }
  };

  const handleApplyDetectedCity = () => {
    if (config && detectedCity) {
      setConfig({
        ...config,
        weatherLocation: { ...config.weatherLocation, city: detectedCity },
      });
    }
  };

  const handleApplyTimezoneFromCity = () => {
    if (!config || !config.weatherLocation.city) {
      alert('Please enter a city name first');
      return;
    }

    // Convert city name to timezone format (e.g., "New York" -> "New_York")
    const cityFormatted = config.weatherLocation.city.replace(/ /g, '_');

    // Search for matching timezone in the list
    const matchingTimezone = timezones.find((tz) =>
      tz.toLowerCase().includes(cityFormatted.toLowerCase())
    );

    if (matchingTimezone) {
      setConfig({ ...config, timezone: matchingTimezone });
      alert(`Timezone set to: ${matchingTimezone}`);
    } else {
      alert(`No matching timezone found for city: ${config.weatherLocation.city}\nPlease select timezone manually.`);
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
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Settings</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Time Settings</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Timezone</label>
                  <div className="flex gap-2">
                    {detectedTimezone && (
                      <button
                        onClick={handleApplyDetectedTimezone}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Use Browser Default ({detectedTimezone})
                      </button>
                    )}
                    {config?.weatherLocation.city && (
                      <button
                        onClick={handleApplyTimezoneFromCity}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
                      >
                        Use City ({config.weatherLocation.city})
                      </button>
                    )}
                  </div>
                </div>
                <select
                  value={config.timezone}
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(groupedTimezones).sort().map((region) => (
                    <optgroup key={region} label={region}>
                      {groupedTimezones[region].map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select your timezone from the list
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  value={config.dateFormat}
                  onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how the date is displayed on the clock
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Server (Optional)</label>
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
            <h2 className="text-2xl font-semibold mb-4">Weather Settings</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">City</label>
                  {detectedCity && (
                    <button
                      onClick={handleApplyDetectedCity}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      Use Browser Default ({detectedCity})
                    </button>
                  )}
                </div>
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Coordinates</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      {detectingLocation ? 'Detecting...' : detectedCoordinates ? `Detected: ${detectedCoordinates.lat.toFixed(4)}, ${detectedCoordinates.lon.toFixed(4)}` : 'Detect Location'}
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${config.weatherLocation.lat},${config.weatherLocation.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Latitude</label>
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
                    <p className="text-xs text-gray-500 mt-1">-90 to 90</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Longitude</label>
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
                  <p className="text-xs text-gray-500 mt-1">-180 to 180</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refresh Interval (minutes)</label>
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
            <h2 className="text-2xl font-semibold mb-4">Calendar Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Google Calendar URL</label>
                <input
                  type="url"
                  value={config.calendarUrl || ''}
                  onChange={(e) => setConfig({ ...config, calendarUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the private iCal URL from Google Calendar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refresh Interval (minutes)</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Number of Events to Display</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.displayLimits.calendarEvents}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setConfig({
                        ...config,
                        displayLimits: { ...config.displayLimits, calendarEvents: value }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">1 to 10</p>
              </div>
            </div>
          </div>

          {/* RSS Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">RSS Feed Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Add RSS Feed</label>
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
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current RSS Feeds</label>
                <div className="space-y-2">
                  {config.rssFeeds.map((feed, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg">
                      <span className="text-sm truncate flex-1">{feed}</span>
                      <button
                        onClick={() => handleRemoveRSS(index)}
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {config.rssFeeds.length === 0 && (
                    <div className="text-gray-500 text-sm">No RSS feeds added</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refresh Interval (minutes)</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Number of News Items to Display</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.displayLimits.rssItems}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setConfig({
                        ...config,
                        displayLimits: { ...config.displayLimits, rssItems: value }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">1 to 10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
            >
              Save to Server
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-semibold transition-colors"
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
