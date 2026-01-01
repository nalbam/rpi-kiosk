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
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">날씨</h2>
        <div className="text-gray-400">날씨 정보 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">날씨</h2>
        <div className="text-gray-400">날씨 정보를 가져올 수 없습니다</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">날씨</h2>
        <div className="text-gray-400">날씨 정보를 가져올 수 없습니다</div>
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
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-semibold mb-4">날씨</h2>
      <div className="text-center">
        <div className="text-6xl mb-2">{getWeatherIcon(weather.weatherCode)}</div>
        <div className="text-5xl font-bold mb-2">{weather.temperature}°C</div>
        <div className="text-xl text-gray-300 mb-4">{weather.description}</div>
        <div className="text-lg text-gray-400">{city}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <div>습도</div>
            <div className="text-white text-lg">{weather.humidity}%</div>
          </div>
          <div>
            <div>풍속</div>
            <div className="text-white text-lg">{weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
