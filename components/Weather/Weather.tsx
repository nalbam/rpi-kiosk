'use client';

import { useState } from 'react';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Thermometer } from 'lucide-react';
import { useWidgetData } from '@/lib/hooks/useWidgetData';
import { WidgetContainer } from '@/components/shared/WidgetContainer';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  weatherCode: number;
}

export default function Weather() {
  const [city, setCity] = useState('');

  const { data: weather, loading, error } = useWidgetData<WeatherData>({
    componentName: 'Weather',
    refreshKey: 'weather',
    buildUrl: () => '/api/weather',
    validateResponse: (data): data is WeatherData =>
      typeof data === 'object' &&
      data !== null &&
      'temperature' in data &&
      'weatherCode' in data &&
      typeof data.temperature === 'number' &&
      typeof data.weatherCode === 'number',
    onConfigReady: (config) => {
      setCity(config.weatherLocation.city);
    },
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

  const getWeatherEffect = (code: number): string => {
    // Clear/Sunny
    if (code === 0 || code === 1 || code === 2) return 'sunny';
    // Cloudy
    if (code === 3) return 'cloudy';
    // Fog
    if (code >= 45 && code <= 48) return 'foggy';
    // Rain/Drizzle
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
    // Snow
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
    // Thunderstorm/Lightning
    if (code >= 95) return 'lightning';
    // Default
    return 'none';
  };

  const renderWeatherBackground = (effect: string) => {
    if (effect === 'none') return null;

    return (
      <div className="weather-background-container">
        {effect === 'sunny' && (
          <div className="weather-effect-sunny"></div>
        )}
        {effect === 'cloudy' && (
          <div className="weather-effect-cloudy">
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
          </div>
        )}
        {effect === 'foggy' && (
          <div className="weather-effect-foggy">
            <div className="fog-layer fog-layer-1"></div>
            <div className="fog-layer fog-layer-2"></div>
            <div className="fog-layer fog-layer-3"></div>
          </div>
        )}
        {effect === 'rainy' && (
          <div className="weather-effect-rainy">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="rain-drop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}></div>
            ))}
          </div>
        )}
        {effect === 'snowy' && (
          <div className="weather-effect-snowy">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="snow-flake" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }}></div>
            ))}
          </div>
        )}
        {effect === 'lightning' && (
          <div className="weather-effect-lightning"></div>
        )}
      </div>
    );
  };

  return (
    <WidgetContainer
      title="Weather"
      loading={loading}
      loadingMessage="Loading weather..."
      error={error}
      errorMessage="Unable to fetch weather"
      empty={!weather}
      className="relative overflow-hidden"
    >
      {weather && (
        <>
          {renderWeatherBackground(getWeatherEffect(weather.weatherCode))}
          <div className="text-center flex-1 flex flex-col justify-center gap-vw-sm relative z-10">
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
        </>
      )}
    </WidgetContainer>
  );
}
