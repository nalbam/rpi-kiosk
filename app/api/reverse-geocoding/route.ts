import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/urlValidation';
import { API, COORDINATES } from '@/lib/constants';

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reverse geocoding data' },
      { status: 500 }
    );
  }
}
