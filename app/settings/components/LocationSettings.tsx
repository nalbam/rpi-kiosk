import { Search, MapPin, Clock, Sparkles, Map, Navigation } from 'lucide-react';
import { KioskConfig, DATE_FORMAT_OPTIONS } from '@/lib/config';
import { GeocodingResult } from '@/app/api/geocoding/route';

interface LocationSettingsProps {
  config: KioskConfig;
  setConfig: (config: KioskConfig) => void;
  timezones: string[];
  groupedTimezones: Record<string, string[]>;
  filteredTimezones: string[];
  timezoneFilter: string;
  setTimezoneFilter: (value: string) => void;
  detectedTimezone: string;
  citySearchQuery: string;
  setCitySearchQuery: (value: string) => void;
  citySearchResults: GeocodingResult[];
  searchingCity: boolean;
  detectingLocation: boolean;
  onSearchCity: () => void;
  onSelectCity: (result: GeocodingResult) => void;
  onDetectLocation: () => void;
  onApplyDetectedTimezone: () => void;
}

export default function LocationSettings({
  config,
  setConfig,
  timezones,
  groupedTimezones,
  filteredTimezones,
  timezoneFilter,
  setTimezoneFilter,
  detectedTimezone,
  citySearchQuery,
  setCitySearchQuery,
  citySearchResults,
  searchingCity,
  detectingLocation,
  onSearchCity,
  onSelectCity,
  onDetectLocation,
  onApplyDetectedTimezone,
}: LocationSettingsProps) {
  return (
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
              onKeyPress={(e) => e.key === 'Enter' && onSearchCity()}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Search for your city (e.g., Seoul, Buenos Aires, Tokyo)"
            />
            <button
              onClick={onSearchCity}
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
                  onClick={() => onSelectCity(result)}
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
                  onClick={onApplyDetectedTimezone}
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
                onClick={onDetectLocation}
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
  );
}
