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
    const iconProps = { size: 80, strokeWidth: 1.5 };

    if (code === 0 || code === 1) return <Sun {...iconProps} className="text-yellow-400" />;
    if (code === 2) return <CloudSun {...iconProps} className="text-yellow-300" />;
    if (code === 3) return <Cloud {...iconProps} className="text-gray-400" />;
    if (code >= 45 && code <= 48) return <CloudFog {...iconProps} className="text-gray-500" />;
    if (code >= 51 && code <= 57) return <CloudDrizzle {...iconProps} className="text-blue-400" />;
    if (code >= 61 && code <= 67) return <CloudRain {...iconProps} className="text-blue-500" />;
    if (code >= 71 && code <= 77) return <CloudSnow {...iconProps} className="text-blue-200" />;
    if (code >= 80 && code <= 82) return <CloudRain {...iconProps} className="text-blue-500" />;
    if (code >= 85 && code <= 86) return <CloudSnow {...iconProps} className="text-blue-200" />;
    if (code >= 95) return <CloudLightning {...iconProps} className="text-purple-400" />;
    return <Thermometer {...iconProps} className="text-gray-400" />;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
      <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-vw-xs">{getWeatherIcon(weather.weatherCode)}</div>
        <div className="text-vw-4xl font-bold mb-vw-xs">{weather.temperature}°C</div>
        <div className="text-vw-lg text-gray-300 mb-vw-sm">{weather.description}</div>
        <div className="text-vw-base text-gray-400">{city}</div>
        <div className="mt-vw-sm grid grid-cols-2 gap-vw-sm text-vw-sm text-gray-400">
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
