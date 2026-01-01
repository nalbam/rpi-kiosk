import { COORDINATES } from './constants';

interface CoordinateValidationResult {
  valid: boolean;
  error?: string;
  lat?: number;
  lon?: number;
}

/**
 * Validates latitude and longitude coordinates.
 *
 * Used by API routes to ensure coordinates are valid before making external API calls.
 * Checks for:
 * - Parameter existence
 * - Valid number format
 * - Range validation (latitude: -90 to 90, longitude: -180 to 180)
 *
 * @param lat - Latitude as string (from URL query parameter)
 * @param lon - Longitude as string (from URL query parameter)
 * @returns Validation result with parsed coordinates if valid
 *
 * @example
 * ```typescript
 * const validation = validateCoordinates(
 *   searchParams.get('lat'),
 *   searchParams.get('lon')
 * );
 *
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 });
 * }
 *
 * const { lat, lon } = validation;
 * // Use validated coordinates
 * ```
 */
export function validateCoordinates(
  lat: string | null,
  lon: string | null
): CoordinateValidationResult {
  // Check if parameters exist
  if (!lat || !lon) {
    return {
      valid: false,
      error: 'Missing lat or lon parameter',
    };
  }

  // Parse to numbers
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  // Check if valid numbers
  if (isNaN(latNum) || isNaN(lonNum)) {
    return {
      valid: false,
      error: 'Invalid latitude or longitude values',
    };
  }

  // Validate latitude range
  if (latNum < COORDINATES.MIN_LATITUDE || latNum > COORDINATES.MAX_LATITUDE) {
    return {
      valid: false,
      error: `Latitude must be between ${COORDINATES.MIN_LATITUDE} and ${COORDINATES.MAX_LATITUDE}`,
    };
  }

  // Validate longitude range
  if (lonNum < COORDINATES.MIN_LONGITUDE || lonNum > COORDINATES.MAX_LONGITUDE) {
    return {
      valid: false,
      error: `Longitude must be between ${COORDINATES.MIN_LONGITUDE} and ${COORDINATES.MAX_LONGITUDE}`,
    };
  }

  return {
    valid: true,
    lat: latNum,
    lon: lonNum,
  };
}
