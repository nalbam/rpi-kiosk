'use client';

import { useState, useEffect } from 'react';
import { getConfig } from '@/lib/storage';

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
      const config = getConfig();
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

    const config = getConfig();
    const interval = setInterval(fetchWeather, config.refreshIntervals.weather * 60 * 1000);

    return () => clearInterval(interval);
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
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌡️';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
      <h2 className="text-vw-xl font-semibold mb-vw-sm">Weather</h2>
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="text-vw-5xl mb-vw-xs">{getWeatherIcon(weather.weatherCode)}</div>
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
