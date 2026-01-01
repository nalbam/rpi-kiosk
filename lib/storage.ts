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
    console.log('Browser timezone detected:', timezone);
  } catch (error) {
    console.error('Failed to detect browser timezone:', error);
    // Fallback: try to detect from Date
    try {
      const offset = -new Date().getTimezoneOffset();
      timezone = `UTC${offset >= 0 ? '+' : ''}${offset / 60}`;
      console.log('Using timezone offset fallback:', timezone);
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

  const result = {
    timezone,
    weatherLocation: {
      ...defaultConfig.weatherLocation,
      city,
    },
    rssFeeds,
  };

  console.log('Browser settings detected:', result);
  return result;
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
        console.warn('Geolocation detection failed:', error.message);
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
      console.log('Configuration already initialized');
      return;
    }

    console.log('First visit detected, initializing configuration...');

    // Detect browser settings
    const browserSettings = detectBrowserSettings();
    console.log('Browser settings detected:', browserSettings);

    // Try to detect geolocation
    const coordinates = await detectGeolocation();
    if (coordinates) {
      browserSettings.weatherLocation = {
        ...defaultConfig.weatherLocation,
        ...browserSettings.weatherLocation,
        lat: coordinates.lat,
        lon: coordinates.lon,
      };
      console.log('Geolocation detected:', coordinates);
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
