import { KioskConfig, defaultConfig } from './config';

const CONFIG_KEY = 'kiosk-config';
const CONFIG_INITIALIZED_KEY = 'kiosk-config-initialized';

/**
 * Detect timezone and city from browser settings
 */
function detectBrowserSettings(): Partial<KioskConfig> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Extract city from timezone (e.g., "America/New_York" -> "New York")
    let city = defaultConfig.weatherLocation.city;
    if (timezone.includes('/')) {
      const parts = timezone.split('/');
      city = parts[parts.length - 1].replace(/_/g, ' ');
    }

    return {
      timezone,
      weatherLocation: {
        ...defaultConfig.weatherLocation,
        city,
      },
    };
  } catch (error) {
    console.error('Failed to detect browser settings:', error);
    return {};
  }
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
        timeout: 10000,
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

  // Try to detect geolocation coordinates
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

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const fileConfig = await response.json();

      // Merge browser-detected settings with file config
      // File config takes precedence if timezone/city/coordinates are explicitly set
      const mergedConfig = {
        ...defaultConfig,
        ...browserSettings,
        ...fileConfig,
        weatherLocation: {
          ...defaultConfig.weatherLocation,
          ...browserSettings.weatherLocation,
          ...fileConfig.weatherLocation,
        },
      };

      // Save merged config as initial localStorage config
      localStorage.setItem(CONFIG_KEY, JSON.stringify(mergedConfig));
      localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
      console.log('Configuration initialized from browser settings and config.json');
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
