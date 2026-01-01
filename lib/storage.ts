import { KioskConfig, defaultConfig } from './config';
import { API } from './constants';

/**
 * Default country mapping for languages without country code
 * Maps language code to its primary country code
 */
const LANGUAGE_TO_COUNTRY: { [key: string]: string } = {
  'en': 'US',
  'ko': 'KR',
  'ja': 'JP',
  'zh': 'CN',
  'fr': 'FR',
  'de': 'DE',
  'es': 'ES',
  'it': 'IT',
  'pt': 'BR',
  'ru': 'RU',
  'ar': 'SA',
  'hi': 'IN',
  'th': 'TH',
  'vi': 'VN',
  'id': 'ID',
  'nl': 'NL',
  'pl': 'PL',
  'tr': 'TR',
  'sv': 'SE',
  'no': 'NO',
  'da': 'DK',
  'fi': 'FI',
  'cs': 'CZ',
  'hu': 'HU',
  'ro': 'RO',
  'uk': 'UA',
  'el': 'GR',
  'he': 'IL',
};

/**
 * Detect language and country from browser settings
 * Returns language code (e.g., 'en', 'ko', 'ja') and country code (e.g., 'US', 'KR', 'JP')
 */
function detectLanguageAndCountry(): { language: string; country: string } {
  try {
    // Get browser language (e.g., "en-US", "ko-KR", "ja-JP", or just "ko")
    const locale = navigator.language || 'en-US';
    const [languageCode, countryCode] = locale.split('-');
    const language = languageCode.toLowerCase();

    // If country code is not provided, use default mapping
    const country = countryCode
      ? countryCode.toUpperCase()
      : (LANGUAGE_TO_COUNTRY[language] || 'US');

    return {
      language,
      country,
    };
  } catch (error) {
    console.error('Failed to detect language/country:', error);
    return { language: 'en', country: 'US' };
  }
}

/**
 * Generate Google News RSS URL based on language and country
 */
function generateGoogleNewsRSS(language: string, country: string): string {
  return `https://news.google.com/rss?hl=${language}&gl=${country}&ceid=${country}:${language}`;
}

/**
 * Detect timezone and city from browser settings
 */
export function detectBrowserSettings(): Partial<KioskConfig> {
  let timezone: string;
  let city: string = defaultConfig.weatherLocation.city;

  // Timezone detection
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect browser timezone:', error);
    // Fallback: try to detect from Date
    try {
      const offset = -new Date().getTimezoneOffset();
      timezone = `UTC${offset >= 0 ? '+' : ''}${offset / 60}`;
    } catch {
      // Last resort: use UTC
      timezone = 'UTC';
      console.warn('Using UTC as final fallback');
    }
  }

  // City extraction from timezone
  try {
    if (timezone.includes('/')) {
      const parts = timezone.split('/');
      city = parts[parts.length - 1].replace(/_/g, ' ');
    }
  } catch (error) {
    console.error('Failed to extract city from timezone:', error);
  }

  // Detect language and country for RSS feeds
  const { language, country } = detectLanguageAndCountry();
  const rssFeeds = [generateGoogleNewsRSS(language, country)];

  return {
    timezone,
    weatherLocation: {
      ...defaultConfig.weatherLocation,
      city,
    },
    rssFeeds,
  };
}

/**
 * Detect geolocation coordinates from browser
 * Returns a promise that resolves with coordinates or null
 */
export async function detectGeolocation(): Promise<{ lat: number; lon: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // GeolocationPositionError codes:
        // 1 = PERMISSION_DENIED
        // 2 = POSITION_UNAVAILABLE
        // 3 = TIMEOUT
        const errorTypes = {
          1: 'PERMISSION_DENIED',
          2: 'POSITION_UNAVAILABLE',
          3: 'TIMEOUT'
        };
        console.warn('Geolocation detection failed:', {
          code: error.code,
          type: errorTypes[error.code as 1 | 2 | 3] || 'UNKNOWN',
          message: error.message,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        });
        resolve(null);
      },
      {
        timeout: API.TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Detect location using IP address (fallback for when geolocation fails)
 * Uses ipapi.co service (free, no API key required)
 * Returns coordinates, city name, and timezone in IANA format
 */
export async function detectLocationByIP(): Promise<{ lat: number; lon: number; city: string; timezone?: string } | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Create abort controller for timeout (compatible with older browsers)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API.TIMEOUT_MS);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      // Validate response data - timezone is optional
      if (data.latitude && data.longitude && data.city) {
        const result = {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
          timezone: data.timezone, // IANA format like "America/Los_Angeles"
        };
        console.log('IP-based location detected:', result);
        return result;
      } else {
        console.warn('IP-based location data incomplete');
        return null;
      }
    } else {
      console.warn('IP-based location API error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('IP-based location detection failed:', error);
    return null;
  }
}

/**
 * Get configuration from server (config.json)
 */
export async function getConfig(): Promise<KioskConfig> {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      return config;
    }
  } catch (error) {
    console.error('Failed to load config from server:', error);
  }

  return defaultConfig;
}

/**
 * Save configuration to server (config.json)
 */
export async function saveConfig(config: Partial<KioskConfig>): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window object not available' };
  }

  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Configuration saved to server:', result.config);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to save configuration' };
    }
  } catch (error) {
    console.error('Failed to save config to server:', error);
    return {
      success: false,
      error: 'Failed to save configuration. Please try again.',
    };
  }
}

/**
 * Initialize configuration on first visit
 * Detects browser settings and creates config.json if it doesn't exist
 */
export async function initializeConfig(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get current config from server
    const config = await getConfig();

    // Check if already initialized (config.json exists)
    if ((config as any)._initialized !== false) {
      return;
    }

    // Detect browser settings
    const browserSettings = detectBrowserSettings();

    // Try to detect geolocation (GPS/WiFi-based)
    const coordinates = await detectGeolocation();
    if (coordinates) {
      browserSettings.weatherLocation = {
        ...defaultConfig.weatherLocation,
        ...browserSettings.weatherLocation,
        lat: coordinates.lat,
        lon: coordinates.lon,
      };
    } else {
      // Geolocation failed, try IP-based location detection
      const ipLocation = await detectLocationByIP();
      if (ipLocation) {
        browserSettings.weatherLocation = {
          ...defaultConfig.weatherLocation,
          ...browserSettings.weatherLocation,
          lat: ipLocation.lat,
          lon: ipLocation.lon,
          city: ipLocation.city,
        };
      } else {
        // IP-based location also failed, try geocoding with city name from timezone
        try {
          const city = browserSettings.weatherLocation?.city;
          if (city) {
            const response = await fetch(`/api/geocoding?q=${encodeURIComponent(city)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const firstResult = data.results[0];
                browserSettings.weatherLocation = {
                  ...browserSettings.weatherLocation,
                  lat: firstResult.latitude,
                  lon: firstResult.longitude,
                  city: firstResult.name,
                };
              } else {
                console.warn('No geocoding results found for city:', city);
              }
            } else {
              console.warn('Geocoding API request failed:', response.statusText);
            }
          }
        } catch (error) {
          console.error('Failed to geocode city:', error);
        }
      }
    }

    // Save initial configuration
    const initialConfig = {
      ...defaultConfig,
      ...browserSettings,
      weatherLocation: {
        ...defaultConfig.weatherLocation,
        ...browserSettings.weatherLocation,
      },
    };

    const result = await saveConfig(initialConfig);
    if (result.success) {
      console.log('Configuration initialized successfully');
    } else {
      console.error('Failed to initialize configuration:', result.error);
    }
  } catch (error) {
    console.error('Failed to initialize config:', error);
  }
}
