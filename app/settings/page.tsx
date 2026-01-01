'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig, detectBrowserSettings, detectGeolocation } from '@/lib/storage';
import { KioskConfig, DATE_FORMAT_OPTIONS, defaultConfig } from '@/lib/config';
import { API } from '@/lib/constants';
import { GeocodingResult } from '@/app/api/geocoding/route';
import { Search, MapPin, Clock, Sparkles, Map, Navigation, XCircle, X } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [rssInput, setRssInput] = useState('');
  const [timezones, setTimezones] = useState<string[]>([]);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [detectedCity, setDetectedCity] = useState<string>('');
  const [detectedCoordinates, setDetectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<GeocodingResult[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const [timezoneFilter, setTimezoneFilter] = useState('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

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

  // Ensure selected timezone is in the list
  useEffect(() => {
    if (config && config.timezone && !timezones.includes(config.timezone)) {
      setTimezones((prev) => [...prev, config.timezone].sort());
    }
  }, [config, timezones]);

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

  // Filter timezones based on search query
  const filteredTimezones = timezones.filter((tz) => {
    if (!timezoneFilter.trim()) return true;
    // Always include the currently selected timezone to maintain select validity
    if (config && tz === config.timezone) return true;
    return tz.toLowerCase().includes(timezoneFilter.toLowerCase());
  });

  // Group timezones by region
  const groupedTimezones = filteredTimezones.reduce((groups, tz) => {
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

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

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

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    const coords = await detectGeolocation();

    if (coords) {
      setDetectedCoordinates(coords);

      // Call reverse geocoding to get city name and timezone
      try {
        const response = await fetch(`/api/reverse-geocoding?lat=${coords.lat}&lon=${coords.lon}`);
        if (response.ok) {
          const data = await response.json();

          // Also try to get timezone from forward geocoding using the city name
          let timezone = config?.timezone;
          if (data.city) {
            try {
              const geoResponse = await fetch(`/api/geocoding?q=${encodeURIComponent(data.city)}`);
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                  const firstResult = geoData.results[0];
                  if (firstResult.timezone) {
                    timezone = firstResult.timezone;
                    // Add timezone to list if not present
                    if (!timezones.includes(firstResult.timezone)) {
                      setTimezones((prev) => [...prev, firstResult.timezone].sort());
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Failed to get timezone:', error);
            }
          }

          // Update config with all detected information
          if (config) {
            setConfig({
              ...config,
              weatherLocation: {
                lat: coords.lat,
                lon: coords.lon,
                city: data.displayName,
              },
              timezone: timezone || config.timezone,
            });
          }
        } else {
          // Fallback: just set coordinates without city name
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
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Fallback: just set coordinates
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
      }
    } else {
      alert('Failed to detect location. Please enable location permissions.');
    }

    setDetectingLocation(false);
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

  const handleApplyCityFromTimezone = () => {
    if (!config || !config.timezone) {
      return;
    }

    // Extract city from timezone (e.g., "Asia/Seoul" -> "Seoul", "America/New_York" -> "New York")
    if (config.timezone.includes('/')) {
      const parts = config.timezone.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      setConfig({
        ...config,
        weatherLocation: { ...config.weatherLocation, city },
      });
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

  const handleSearchCity = async () => {
    if (!citySearchQuery.trim()) {
      return;
    }

    setSearchingCity(true);
    setCitySearchResults([]);

    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(citySearchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setCitySearchResults(data.results || []);
      } else {
        alert('Failed to search for city');
      }
    } catch (error) {
      console.error('City search error:', error);
      alert('Failed to search for city');
    } finally {
      setSearchingCity(false);
    }
  };

  const handleSelectCity = (result: GeocodingResult) => {
    if (!config) return;

    // Build a display name from the result
    let cityName = result.name;
    if (result.admin1 && result.admin1 !== result.name) {
      cityName += `, ${result.admin1}`;
    }
    if (result.country) {
      cityName += `, ${result.country}`;
    }

    // Update config with coordinates, city name, and timezone if available
    const updatedConfig: KioskConfig = {
      ...config,
      weatherLocation: {
        lat: result.latitude,
        lon: result.longitude,
        city: cityName,
      },
    };

    // Auto-set timezone if available
    if (result.timezone) {
      updatedConfig.timezone = result.timezone;

      // If timezone is not in the current list, add it
      if (!timezones.includes(result.timezone)) {
        setTimezones([...timezones, result.timezone].sort());
      }
    }

    setConfig(updatedConfig);

    // Clear search
    setCitySearchQuery('');
    setCitySearchResults([]);
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg border bg-red-600 border-red-500">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorToast}</span>
            <button
              onClick={() => setErrorToast(null)}
              className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
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
          {/* Location & Time Settings */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
            <h2 className="text-2xl font-semibold mb-2">Location & Time Settings</h2>
            <p className="text-sm text-gray-400 mb-6">
              Search for your city to automatically set location, coordinates, and timezone
            </p>

            <div className="space-y-6">
              {/* City Search - Primary Method */}
              <div className="bg-gray-800 rounded-lg p-4 border-2 border-blue-600">
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search City (Recommended)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchCity()}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Search for your city (e.g., Seoul, Buenos Aires, Tokyo)"
                  />
                  <button
                    onClick={handleSearchCity}
                    disabled={searchingCity || !citySearchQuery.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
                  >
                    {searchingCity ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {citySearchResults.length > 0 && (
                  <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                    {citySearchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectCity(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-base">{result.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {[result.admin1, result.admin2, result.country].filter(Boolean).join(', ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                          </span>
                          {result.timezone && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.timezone}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Selecting a city will automatically set: City Name, Coordinates, and Timezone
                </p>
              </div>

              {/* Current Settings Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">City Name</label>
                  <input
                    type="text"
                    value={config.weatherLocation.city}
                    onChange={(e) => setConfig({
                      ...config,
                      weatherLocation: { ...config.weatherLocation, city: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="New York"
                  />
                  <p className="text-xs text-gray-500 mt-1">Display name (auto-filled from search)</p>
                </div>

                {/* Timezone */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Timezone</label>
                    {detectedTimezone && (
                      <button
                        onClick={handleApplyDetectedTimezone}
                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        Use Browser Default ({detectedTimezone.split('/').pop()?.replace(/_/g, ' ')})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={timezoneFilter}
                    onChange={(e) => setTimezoneFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
                    placeholder="Filter timezone..."
                  />
                  <select
                    value={config.timezone}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    size={5}
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
                    {timezoneFilter ? `${filteredTimezones.length} matches` : 'Auto-filled from search'}
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Coordinates</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      {detectingLocation ? 'Detecting...' : 'Detect My Location'}
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${config.weatherLocation.lat},${config.weatherLocation.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <Map className="w-3 h-3" />
                      View on Map
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
                <p className="text-xs text-gray-400 mt-2">Auto-filled from city search or location detection</p>
              </div>

              <hr className="border-gray-700" />

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Advanced Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-xs text-gray-500 mt-1">Date display format</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Weather Refresh Interval</label>
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
                    <p className="text-xs text-gray-500 mt-1">Minutes between updates</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Time Server</label>
                    <input
                      type="text"
                      value={config.timeServer || ''}
                      onChange={(e) => setConfig({ ...config, timeServer: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="time.google.com (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Custom NTP server (optional)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Calendar Settings */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
            <h2 className="text-2xl font-semibold mb-6">Calendar Settings</h2>

            <div className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Refresh Interval</label>
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
                  <p className="text-xs text-gray-500 mt-1">Minutes between updates</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Events to Display</label>
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
                  <p className="text-xs text-gray-500 mt-1">1 to 10 events</p>
                </div>
              </div>
            </div>
          </div>

          {/* RSS Settings */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
            <h2 className="text-2xl font-semibold mb-6">RSS Feed Settings</h2>

            <div className="space-y-6">
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
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
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
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors whitespace-nowrap"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Refresh Interval</label>
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
                  <p className="text-xs text-gray-500 mt-1">Minutes between updates</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">News Items to Display</label>
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
                  <p className="text-xs text-gray-500 mt-1">1 to 10 items</p>
                </div>
              </div>
            </div>
          </div>
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
