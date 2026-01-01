import { fetchWithTimeout } from '@/lib/urlValidation';
import { validateCoordinates } from '@/lib/validation';
import { API } from '@/lib/constants';
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidation,
} from '@/lib/apiHelpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Validate coordinates
  const validationError = handleValidation(validateCoordinates(lat, lon));
  if (validationError) {
    return validationError;
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

    return createSuccessResponse({
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      description: weatherDescription,
      weatherCode: weatherCode,
    });
  } catch (error) {
    return createErrorResponse('Failed to fetch weather data', error);
  }
}
