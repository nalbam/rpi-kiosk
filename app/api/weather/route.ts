import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/urlValidation';
import { API, COORDINATES } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing lat or lon parameter' },
      { status: 400 }
    );
  }

  // Validate coordinates are valid numbers within acceptable ranges
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return NextResponse.json(
      { error: 'Invalid latitude or longitude values' },
      { status: 400 }
    );
  }

  if (latNum < COORDINATES.MIN_LATITUDE || latNum > COORDINATES.MAX_LATITUDE) {
    return NextResponse.json(
      { error: `Latitude must be between ${COORDINATES.MIN_LATITUDE} and ${COORDINATES.MAX_LATITUDE}` },
      { status: 400 }
    );
  }

  if (lonNum < COORDINATES.MIN_LONGITUDE || lonNum > COORDINATES.MAX_LONGITUDE) {
    return NextResponse.json(
      { error: `Longitude must be between ${COORDINATES.MIN_LONGITUDE} and ${COORDINATES.MAX_LONGITUDE}` },
      { status: 400 }
    );
  }

  try {
    // Using Open-Meteo API (free, no API key required)
    const response = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
      API.TIMEOUT_MS,
      API.MAX_WEATHER_SIZE
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    // Map weather codes to descriptions
    const weatherCodeMap: { [key: number]: string } = {
      0: 'Clear',
      1: 'Mostly Clear',
      2: 'Partly Cloudy',
      3: 'Cloudy',
      45: 'Fog',
      48: 'Fog',
      51: 'Drizzle',
      53: 'Drizzle',
      55: 'Drizzle',
      61: 'Rain',
      63: 'Rain',
      65: 'Heavy Rain',
      71: 'Snow',
      73: 'Snow',
      75: 'Heavy Snow',
      77: 'Sleet',
      80: 'Showers',
      81: 'Showers',
      82: 'Heavy Rain',
      85: 'Snow',
      86: 'Heavy Snow',
      95: 'Thunderstorm',
      96: 'Thunderstorm',
      99: 'Thunderstorm',
    };

    const weatherCode = data.current.weather_code;
    const weatherDescription = weatherCodeMap[weatherCode] || 'Unknown';

    return NextResponse.json({
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      description: weatherDescription,
      weatherCode: weatherCode,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
