import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/urlValidation';

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

  if (latNum < -90 || latNum > 90) {
    return NextResponse.json(
      { error: 'Latitude must be between -90 and 90' },
      { status: 400 }
    );
  }

  if (lonNum < -180 || lonNum > 180) {
    return NextResponse.json(
      { error: 'Longitude must be between -180 and 180' },
      { status: 400 }
    );
  }

  try {
    // Using Open-Meteo API (free, no API key required)
    const response = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
      10000, // 10 second timeout
      1024 * 1024 // 1MB max size
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    // Map weather codes to descriptions
    const weatherCodeMap: { [key: number]: string } = {
      0: '맑음',
      1: '대체로 맑음',
      2: '부분적으로 흐림',
      3: '흐림',
      45: '안개',
      48: '안개',
      51: '이슬비',
      53: '이슬비',
      55: '이슬비',
      61: '비',
      63: '비',
      65: '폭우',
      71: '눈',
      73: '눈',
      75: '폭설',
      77: '진눈깨비',
      80: '소나기',
      81: '소나기',
      82: '폭우',
      85: '눈',
      86: '폭설',
      95: '뇌우',
      96: '뇌우',
      99: '뇌우',
    };

    const weatherCode = data.current.weather_code;
    const weatherDescription = weatherCodeMap[weatherCode] || '알 수 없음';

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
