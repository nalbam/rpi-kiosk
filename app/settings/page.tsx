'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig, detectGeolocation, detectLocationByIP } from '@/lib/storage';
import { KioskConfig, defaultConfig } from '@/lib/config';
import { GeocodingResult } from '@/app/api/geocoding/route';
import Toast from '@/components/shared/Toast';
import LocationSettings from './components/LocationSettings';
import CalendarSettings from './components/CalendarSettings';
import RSSSettings from './components/RSSSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
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
    setDetectingLocation(true);

    // Try geolocation first (GPS/WiFi-based)
    let coords = null;
    let cityName = null;

    if (navigator.geolocation) {
      coords = await detectGeolocation();
    }

    // If geolocation failed, try IP-based location
    if (!coords) {
      const ipLocation = await detectLocationByIP();
      if (ipLocation) {
        coords = { lat: ipLocation.lat, lon: ipLocation.lon };
        cityName = ipLocation.city;
      }
    }

    if (coords) {
      // Call reverse geocoding to get city name and timezone (if not already from IP)
      try {
        const response = await fetch(`/api/reverse-geocoding?lat=${coords.lat}&lon=${coords.lon}`);
        if (response.ok) {
          const data = await response.json();
          if (!cityName) {
            cityName = data.displayName;
          }

          // Also try to get timezone from forward geocoding using the city name
          let timezone = config?.timezone;
          if (cityName) {
            try {
              const geoResponse = await fetch(`/api/geocoding?q=${encodeURIComponent(cityName)}`);
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
                city: cityName || data.displayName,
              },
              timezone: timezone || config.timezone,
            });
          }
        } else {
          // Fallback: just set coordinates with city name from IP (if available)
          if (config) {
            setConfig({
              ...config,
              weatherLocation: {
                ...config.weatherLocation,
                lat: coords.lat,
                lon: coords.lon,
                city: cityName || config.weatherLocation.city,
              },
            });
          }
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Fallback: just set coordinates with city name from IP (if available)
        if (config) {
          setConfig({
            ...config,
            weatherLocation: {
              ...config.weatherLocation,
              lat: coords.lat,
              lon: coords.lon,
              city: cityName || config.weatherLocation.city,
            },
          });
        }
      }
    } else {
      alert('Failed to detect location. Please check your network connection and try again.');
    }

    setDetectingLocation(false);
  };

  const handleApplyDetectedTimezone = () => {
    if (config && detectedTimezone) {
      setConfig({ ...config, timezone: detectedTimezone });
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
            timezones={timezones}
            groupedTimezones={groupedTimezones}
            filteredTimezones={filteredTimezones}
            timezoneFilter={timezoneFilter}
            setTimezoneFilter={setTimezoneFilter}
            detectedTimezone={detectedTimezone}
            citySearchQuery={citySearchQuery}
            setCitySearchQuery={setCitySearchQuery}
            citySearchResults={citySearchResults}
            searchingCity={searchingCity}
            detectingLocation={detectingLocation}
            onSearchCity={handleSearchCity}
            onSelectCity={handleSelectCity}
            onDetectLocation={handleDetectLocation}
            onApplyDetectedTimezone={handleApplyDetectedTimezone}
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
