import { KioskConfig, defaultConfig } from './config';
import { API } from './constants';

const CONFIG_KEY = 'kiosk-config';
const CONFIG_INITIALIZED_KEY = 'kiosk-config-initialized';

/**
 * Detect timezone and city from browser settings
 * CRITICAL: This function must ALWAYS return at least the timezone
 * Never return an empty object as it would cause defaults to be used
 */
function detectBrowserSettings(): Partial<KioskConfig> {
  let timezone: string;
  let city: string = defaultConfig.weatherLocation.city;

  // Timezone detection - this should never fail in modern browsers
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

  // City extraction - this can fail safely
  try {
    if (timezone.includes('/')) {
      const parts = timezone.split('/');
      city = parts[parts.length - 1].replace(/_/g, ' ');
    }
  } catch (error) {
    console.error('Failed to extract city from timezone:', error);
    // city remains as defaultConfig.weatherLocation.city
  }

  const result = {
    timezone,
    weatherLocation: {
      ...defaultConfig.weatherLocation,
      city,
    },
  };

  console.log('Browser settings detected:', result);
  return result;
}

/**
 * Detect geolocation coordinates from browser
 * Returns a promise that resolves with coordinates or null
 */
async function detectGeolocation(): Promise<{ lat: number; lon: number } | null> {
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
 * Get configuration
 * Priority: localStorage > config.json (via API) > browser-detected settings > defaultConfig
 */
export function getConfig(): KioskConfig {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsedConfig = JSON.parse(stored) as Partial<KioskConfig>;

      // Deep merge nested objects to preserve all fields
      return {
        ...defaultConfig,
        ...parsedConfig,
        weatherLocation: {
          ...defaultConfig.weatherLocation,
          ...parsedConfig.weatherLocation,
        },
        refreshIntervals: {
          ...defaultConfig.refreshIntervals,
          ...parsedConfig.refreshIntervals,
        },
        displayLimits: {
          ...defaultConfig.displayLimits,
          ...parsedConfig.displayLimits,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }

  // If no stored config, use browser-detected settings merged with defaults
  const browserSettings = detectBrowserSettings();
  return {
    ...defaultConfig,
    ...browserSettings,
    weatherLocation: {
      ...defaultConfig.weatherLocation,
      ...browserSettings.weatherLocation,
    },
  };
}

/**
 * Initialize configuration from config.json (via API)
 * This should be called once on app startup
 * Merges browser-detected settings (timezone, city, coordinates) with file config
 */
export async function initConfigFromFile(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // Skip if already initialized or localStorage has config
  if (localStorage.getItem(CONFIG_INITIALIZED_KEY) === 'true' || localStorage.getItem(CONFIG_KEY)) {
    return;
  }

  // Detect browser settings (timezone and city)
  const browserSettings = detectBrowserSettings();
  console.log('[initConfigFromFile] Browser settings:', browserSettings);

  // Try to detect geolocation coordinates
  const coordinates = await detectGeolocation();
  if (coordinates) {
    browserSettings.weatherLocation = {
      ...defaultConfig.weatherLocation,
      ...browserSettings.weatherLocation,
      lat: coordinates.lat,
      lon: coordinates.lon,
    };
    console.log('[initConfigFromFile] Geolocation detected:', coordinates);
  }

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const fileConfig = await response.json();
      console.log('[initConfigFromFile] Fetched config.json:', fileConfig);

      // Smart merge: Only use fileConfig values if they differ from defaults
      // This allows browser-detected settings to take precedence over default values in config.json

      // Use fileConfig timezone only if it's different from default
      const timezone = fileConfig.timezone !== defaultConfig.timezone
        ? fileConfig.timezone
        : (browserSettings.timezone || defaultConfig.timezone);

      console.log('[initConfigFromFile] Timezone merge:', {
        fileConfig: fileConfig.timezone,
        default: defaultConfig.timezone,
        browser: browserSettings.timezone,
        result: timezone,
        usedBrowser: timezone === browserSettings.timezone,
      });

      // Use fileConfig city only if it's different from default
      const city = fileConfig.weatherLocation?.city !== defaultConfig.weatherLocation.city
        ? fileConfig.weatherLocation.city
        : (browserSettings.weatherLocation?.city || defaultConfig.weatherLocation.city);

      // Use fileConfig coordinates only if they differ from defaults
      const lat = fileConfig.weatherLocation?.lat !== defaultConfig.weatherLocation.lat
        ? fileConfig.weatherLocation.lat
        : (browserSettings.weatherLocation?.lat || defaultConfig.weatherLocation.lat);

      const lon = fileConfig.weatherLocation?.lon !== defaultConfig.weatherLocation.lon
        ? fileConfig.weatherLocation.lon
        : (browserSettings.weatherLocation?.lon || defaultConfig.weatherLocation.lon);

      const mergedConfig = {
        ...defaultConfig,
        ...fileConfig,
        timezone,
        weatherLocation: {
          ...defaultConfig.weatherLocation,
          ...fileConfig.weatherLocation,
          city,
          lat,
          lon,
        },
      };

      console.log('[initConfigFromFile] Final merged config:', mergedConfig);

      // Save merged config as initial localStorage config
      localStorage.setItem(CONFIG_KEY, JSON.stringify(mergedConfig));
      localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
      console.log('[initConfigFromFile] Configuration initialized from browser settings and config.json');
    } else {
      // If no config.json, use browser-detected settings
      const initialConfig = {
        ...defaultConfig,
        ...browserSettings,
        weatherLocation: {
          ...defaultConfig.weatherLocation,
          ...browserSettings.weatherLocation,
        },
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(initialConfig));
      localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
      console.log('Configuration initialized from browser settings');
    }
  } catch (error) {
    console.error('Failed to initialize config from file:', error);

    // Use browser-detected settings as fallback
    const initialConfig = {
      ...defaultConfig,
      ...browserSettings,
      weatherLocation: {
        ...defaultConfig.weatherLocation,
        ...browserSettings.weatherLocation,
      },
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(initialConfig));
    localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
    console.log('Configuration initialized from browser settings (fallback)');
  }
}

export function saveConfig(config: Partial<KioskConfig>): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window object not available' };
  }

  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to save config:', error);

    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please reduce the number of RSS feeds or clear browser data.',
      };
    }

    return {
      success: false,
      error: 'Failed to save configuration. Please try again.',
    };
  }
}

export function resetConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Remove both config and initialized flag to allow re-initialization from config.json
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(CONFIG_INITIALIZED_KEY);
  } catch (error) {
    console.error('Failed to reset config:', error);
  }
}

/**
 * Force reload configuration from config.json file
 * This will discard current localStorage config and reload from server
 */
export async function reloadConfigFromFile(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window object not available' };
  }

  try {
    // Fetch config from server
    const response = await fetch('/api/config');
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch config from server' };
    }

    const fileConfig = await response.json();

    // Save to localStorage
    localStorage.setItem(CONFIG_KEY, JSON.stringify(fileConfig));
    localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');

    console.log('Configuration reloaded from config.json');
    return { success: true };
  } catch (error) {
    console.error('Failed to reload config from file:', error);
    return { success: false, error: 'Failed to reload configuration from server' };
  }
}
