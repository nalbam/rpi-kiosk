import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Sparkles, Map, Navigation } from 'lucide-react';
import { KioskConfig, DATE_FORMAT_OPTIONS } from '@/lib/config';
import { GeocodingResult } from '@/app/api/geocoding/route';
import { detectGeolocation, detectLocationByIP } from '@/lib/storage';

interface LocationSettingsProps {
  config: KioskConfig;
  setConfig: (config: KioskConfig) => void;
  setErrorToast?: (message: string) => void;
}

export default function LocationSettings({
  config,
  setConfig,
  setErrorToast,
}: LocationSettingsProps) {
  // Timezone state
  const [timezones, setTimezones] = useState<string[]>([]);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [timezoneFilter, setTimezoneFilter] = useState('');

  // City search state
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<GeocodingResult[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);

  // Location detection state
  const [detectingLocation, setDetectingLocation] = useState(false);

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
    if (config && config.timezone) {
      const timezone = config.timezone; // Capture to maintain type guard in callback
      setTimezones((prev) => {
        // Only add if not already present to avoid duplicates
        if (prev.includes(timezone)) {
          return prev;
        }
        return [...prev, timezone].sort();
      });
    }
  }, [config?.timezone]);

  // Detect browser timezone on mount
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);
    } catch (error) {
      console.error('Failed to detect browser timezone:', error);
    }
  }, []);

  // Filter timezones based on search query
  const filteredTimezones = timezones.filter((tz) => {
    if (!timezoneFilter.trim()) return true;
    // Always include the currently selected timezone to maintain select validity
    if (tz === config.timezone) return true;
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
        setErrorToast?.('Failed to search for city');
      }
    } catch (error) {
      console.error('City search error:', error);
      setErrorToast?.('Failed to search for city');
    } finally {
      setSearchingCity(false);
    }
  };

  const handleSelectCity = (result: GeocodingResult) => {
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
      const timezone = result.timezone; // Capture to maintain type guard in callback
      updatedConfig.timezone = timezone;

      // Add timezone to list if not present (using functional setter to avoid duplicates)
      setTimezones((prev) => {
        if (prev.includes(timezone)) {
          return prev;
        }
        return [...prev, timezone].sort();
      });
    }

    setConfig(updatedConfig);

    // Clear search
    setCitySearchQuery('');
    setCitySearchResults([]);
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
          let timezone = config.timezone;
          if (cityName) {
            try {
              const geoResponse = await fetch(`/api/geocoding?q=${encodeURIComponent(cityName)}`);
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                  const firstResult = geoData.results[0];
                  if (firstResult.timezone) {
                    const detectedTimezone = firstResult.timezone; // Capture to maintain type guard in callback
                    timezone = detectedTimezone;
                    // Add timezone to list if not present (using functional setter to avoid duplicates)
                    setTimezones((prev) => {
                      if (prev.includes(detectedTimezone)) {
                        return prev;
                      }
                      return [...prev, detectedTimezone].sort();
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Failed to get timezone:', error);
            }
          }

          // Update config with all detected information
          setConfig({
            ...config,
            weatherLocation: {
              lat: coords.lat,
              lon: coords.lon,
              city: cityName || data.displayName,
            },
            timezone: timezone,
          });
        } else {
          // Fallback: just set coordinates with city name from IP (if available)
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
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Fallback: just set coordinates with city name from IP (if available)
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
    } else {
      setErrorToast?.('Failed to detect location. Please check your network connection and try again.');
    }

    setDetectingLocation(false);
  };

  const handleApplyDetectedTimezone = () => {
    if (detectedTimezone) {
      setConfig({ ...config, timezone: detectedTimezone });
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
      <h2 className="text-2xl font-semibold mb-2">Location & Time Settings</h2>
      <p className="text-sm text-gray-400 mb-6">
        Search for your city to automatically set location, coordinates, and timezone
      </p>

      <div className="space-y-6">
        {/* City Search - Primary Method */}
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-blue-600">
          <label htmlFor="city-search" className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" aria-hidden="true" />
            Search City (Recommended)
          </label>
          <div className="flex gap-2">
            <input
              id="city-search"
              type="text"
              value={citySearchQuery}
              onChange={(e) => setCitySearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCity()}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Search for your city (e.g., Seoul, Buenos Aires, Tokyo)"
              aria-label="Search for your city"
            />
            <button
              onClick={handleSearchCity}
              disabled={searchingCity || !citySearchQuery.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
              aria-label={searchingCity ? 'Searching...' : 'Search for city'}
            >
              {searchingCity ? 'Searching...' : 'Search'}
            </button>
          </div>
          {citySearchResults.length > 0 && (
            <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto" role="listbox">
              {citySearchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCity(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0"
                  role="option"
                  aria-label={`Select ${result.name}, ${result.country}`}
                >
                  <div className="font-medium text-base">{result.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {[result.admin1, result.admin2, result.country].filter(Boolean).join(', ')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </span>
                    {result.timezone && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {result.timezone}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Selecting a city will automatically set: City Name, Coordinates, and Timezone
          </p>
        </div>

        {/* Current Settings Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City Name */}
          <div>
            <label htmlFor="city-name" className="block text-sm font-medium mb-2">
              City Name
            </label>
            <input
              id="city-name"
              type="text"
              value={config.weatherLocation.city}
              onChange={(e) => setConfig({
                ...config,
                weatherLocation: { ...config.weatherLocation, city: e.target.value }
              })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="New York"
              aria-label="City name for weather display"
              aria-describedby="city-name-hint"
            />
            <p id="city-name-hint" className="text-xs text-gray-500 mt-1">Display name (auto-filled from search)</p>
          </div>

          {/* Timezone */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="timezone-select" className="block text-sm font-medium">
                Timezone
              </label>
              {detectedTimezone && (
                <button
                  onClick={handleApplyDetectedTimezone}
                  className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                  aria-label={`Use browser default timezone: ${detectedTimezone}`}
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  Use Browser Default ({detectedTimezone.split('/').pop()?.replace(/_/g, ' ')})
                </button>
              )}
            </div>
            <input
              id="timezone-filter"
              type="text"
              value={timezoneFilter}
              onChange={(e) => setTimezoneFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
              placeholder="Filter timezone..."
              aria-label="Filter timezone list"
            />
            <select
              id="timezone-select"
              value={config.timezone}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              size={5}
              aria-label="Select timezone"
              aria-describedby="timezone-hint"
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
            <p id="timezone-hint" className="text-xs text-gray-500 mt-1">
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
                aria-label={detectingLocation ? 'Detecting location...' : 'Detect my location'}
              >
                <Navigation className="w-3 h-3" aria-hidden="true" />
                {detectingLocation ? 'Detecting...' : 'Detect My Location'}
              </button>
              <a
                href={`https://www.google.com/maps?q=${config.weatherLocation.lat},${config.weatherLocation.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                aria-label="View current coordinates on Google Maps"
              >
                <Map className="w-3 h-3" aria-hidden="true" />
                View on Map
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">
                Latitude
              </label>
              <input
                id="latitude"
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
                aria-label="Latitude coordinate"
                aria-describedby="latitude-hint"
              />
              <p id="latitude-hint" className="text-xs text-gray-500 mt-1">-90 to 90</p>
            </div>
            <div>
              <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">
                Longitude
              </label>
              <input
                id="longitude"
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
                aria-label="Longitude coordinate"
                aria-describedby="longitude-hint"
              />
              <p id="longitude-hint" className="text-xs text-gray-500 mt-1">-180 to 180</p>
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
              <label htmlFor="date-format" className="block text-sm font-medium mb-2">
                Date Format
              </label>
              <select
                id="date-format"
                value={config.dateFormat}
                onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                aria-label="Date display format"
                aria-describedby="date-format-hint"
              >
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p id="date-format-hint" className="text-xs text-gray-500 mt-1">Date display format</p>
            </div>

            <div>
              <label htmlFor="weather-refresh" className="block text-sm font-medium mb-2">
                Weather Refresh Interval
              </label>
              <input
                id="weather-refresh"
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
                aria-label="Weather refresh interval in minutes"
                aria-describedby="weather-refresh-hint"
              />
              <p id="weather-refresh-hint" className="text-xs text-gray-500 mt-1">Minutes between updates</p>
            </div>

            <div>
              <label htmlFor="time-server" className="block text-sm font-medium mb-2">
                Time Server
              </label>
              <input
                id="time-server"
                type="text"
                value={config.timeServer || ''}
                onChange={(e) => setConfig({ ...config, timeServer: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="time.google.com (optional)"
                aria-label="Custom NTP time server"
                aria-describedby="time-server-hint"
              />
              <p id="time-server-hint" className="text-xs text-gray-500 mt-1">Custom NTP server (optional)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
