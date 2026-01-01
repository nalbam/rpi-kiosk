import { fetchWithTimeout } from '@/lib/urlValidation';
import { validateCoordinates } from '@/lib/validation';
import { API } from '@/lib/constants';
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidation,
} from '@/lib/apiHelpers';

export interface ReverseGeocodingResult {
  city?: string;
  state?: string;
  country?: string;
  displayName: string;
}

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
    // Using Nominatim (OpenStreetMap) reverse geocoding API
    // Note: User-Agent header is required by Nominatim (fetchWithTimeout provides it)
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
      API.TIMEOUT_MS,
      API.MAX_WEATHER_SIZE
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reverse geocoding data');
    }

    const data = await response.json();

    // Extract city information from address
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county;
    const state = address.state || address.region;
    const country = address.country;

    // Build a display name
    let displayName = '';
    if (city) displayName = city;
    if (state && state !== city) displayName += displayName ? `, ${state}` : state;
    if (country) displayName += displayName ? `, ${country}` : country;

    // Fallback to Nominatim's display_name if we couldn't build one
    if (!displayName && data.display_name) {
      displayName = data.display_name;
    }

    const result: ReverseGeocodingResult = {
      city,
      state,
      country,
      displayName: displayName || 'Unknown Location',
    };

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse('Failed to fetch reverse geocoding data', error);
  }
}
