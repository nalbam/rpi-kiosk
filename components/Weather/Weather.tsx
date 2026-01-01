'use client';

import { useState } from 'react';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Thermometer } from 'lucide-react';
import { useConfigWithRetry } from '@/lib/hooks/useConfigWithRetry';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { WidgetContainer } from '@/components/shared/WidgetContainer';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  weatherCode: number;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [city, setCity] = useState('');

  const { config } = useConfigWithRetry({
    componentName: 'Weather',
    onConfigReady: (config) => {
      setCity(config.weatherLocation.city);
    },
  });

  const fetchWeather = async () => {
    if (!config) return;

    try {
      const response = await fetch(
        `/api/weather?lat=${config.weatherLocation.lat}&lon=${config.weatherLocation.lon}`
      );

      if (response.ok) {
        const data = await response.json();
        // Validate response structure
        if (data && typeof data.temperature === 'number' && typeof data.weatherCode === 'number') {
          setWeather(data);
          setError(false);
        } else {
          console.error('Invalid weather response structure:', data);
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh({
    refreshKey: 'weather',
    onRefresh: fetchWeather,
    enabled: !!config,
  });

  const getWeatherIcon = (code: number) => {
    const iconProps = { strokeWidth: 1.5, className: "weather-icon" };

    if (code === 0 || code === 1) return <Sun {...iconProps} className="weather-icon text-yellow-400 weather-icon-sun" />;
    if (code === 2) return <CloudSun {...iconProps} className="weather-icon text-yellow-300 weather-icon-cloud" />;
    if (code === 3) return <Cloud {...iconProps} className="weather-icon text-gray-400 weather-icon-cloud" />;
    if (code >= 45 && code <= 48) return <CloudFog {...iconProps} className="weather-icon text-gray-500 weather-icon-fog" />;
    if (code >= 51 && code <= 57) return <CloudDrizzle {...iconProps} className="weather-icon text-blue-400 weather-icon-rain" />;
    if (code >= 61 && code <= 67) return <CloudRain {...iconProps} className="weather-icon text-blue-500 weather-icon-rain" />;
    if (code >= 71 && code <= 77) return <CloudSnow {...iconProps} className="weather-icon text-blue-200 weather-icon-snow" />;
    if (code >= 80 && code <= 82) return <CloudRain {...iconProps} className="weather-icon text-blue-500 weather-icon-rain" />;
    if (code >= 85 && code <= 86) return <CloudSnow {...iconProps} className="weather-icon text-blue-200 weather-icon-snow" />;
    if (code >= 95) return <CloudLightning {...iconProps} className="weather-icon text-purple-400 weather-icon-lightning" />;
    return <Thermometer {...iconProps} className="weather-icon text-gray-400 weather-icon-thermometer" />;
  };

  return (
    <WidgetContainer
      title="Weather"
      loading={loading}
      loadingMessage="Loading weather..."
      error={error}
      errorMessage="Unable to fetch weather"
      empty={!weather}
    >
      {weather && (
        <div className="text-center flex-1 flex flex-col justify-center gap-vw-sm">
          <div className="flex justify-center">{getWeatherIcon(weather.weatherCode)}</div>
          <div className="text-vw-5xl font-bold">{weather.temperature}°C</div>
          <div className="text-vw-xl text-gray-300">{weather.description}</div>
          <div className="text-vw-lg text-gray-400">{city}</div>
          <div className="mt-vw-xs grid grid-cols-2 gap-vw-sm text-vw-sm text-gray-400">
            <div>
              <div>Humidity</div>
              <div className="text-white text-vw-base">{weather.humidity}%</div>
            </div>
            <div>
              <div>Wind</div>
              <div className="text-white text-vw-base">{weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}
