'use client';

import { useState, useEffect } from 'react';
import { getConfig } from '@/lib/storage';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Thermometer } from 'lucide-react';

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

  const fetchWeather = async () => {
    try {
      const config = await getConfig();
      setCity(config.weatherLocation.city);

      const response = await fetch(
        `/api/weather?lat=${config.weatherLocation.lat}&lon=${config.weatherLocation.lon}`
      );

      if (response.ok) {
        const data = await response.json();
        setWeather(data);
        setError(false);
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

  useEffect(() => {
    fetchWeather();

    async function setupInterval() {
      const config = await getConfig();
      const interval = setInterval(fetchWeather, config.refreshIntervals.weather * 60 * 1000);
      return interval;
    }

    let intervalId: NodeJS.Timeout;
    setupInterval().then((id) => {
      intervalId = id;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
        <div className="text-gray-400 text-vw-sm">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
        <div className="text-gray-400 text-vw-sm">Unable to fetch weather</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
        <div className="text-gray-400 text-vw-sm">Unable to fetch weather</div>
      </div>
    );
  }

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
    <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
      <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
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
    </div>
  );
}
