import { fetchWithTimeout } from '@/lib/urlValidation';
import { API } from '@/lib/constants';
import {
  createErrorResponse,
  createValidationError,
  createSuccessResponse,
} from '@/lib/apiHelpers';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

interface OpenMeteoGeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return createValidationError('Missing query parameter');
  }

  // Validate query length
  if (query.length > 100) {
    return createValidationError('Query too long (max 100 characters)');
  }

  try {
    // Using Open-Meteo Geocoding API (free, no API key required)
    // Note: timezone parameter is required to get timezone information
    const response = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json&timezone=auto`,
      API.TIMEOUT_MS,
      API.MAX_WEATHER_SIZE
    );

    if (!response.ok) {
      throw new Error('Failed to fetch geocoding data');
    }

    const data = await response.json();

    // Return empty array if no results
    if (!data.results || data.results.length === 0) {
      return createSuccessResponse({ results: [] });
    }

    // Map results to a simpler format
    const results: GeocodingResult[] = data.results.map((result: OpenMeteoGeocodingResult) => ({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
      admin1: result.admin1,
      admin2: result.admin2,
      timezone: result.timezone,
    }));

    return createSuccessResponse({ results });
  } catch (error) {
    return createErrorResponse('Failed to fetch geocoding data', error);
  }
}
