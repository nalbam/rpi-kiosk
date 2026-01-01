import { KioskConfig, defaultConfig } from './config';

const CONFIG_KEY = 'kiosk-config';
const CONFIG_INITIALIZED_KEY = 'kiosk-config-initialized';

/**
 * Get configuration
 * Priority: localStorage > config.json (via API) > defaultConfig
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

  return defaultConfig;
}

/**
 * Initialize configuration from config.json (via API)
 * This should be called once on app startup
 */
export async function initConfigFromFile(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // Skip if already initialized or localStorage has config
  if (localStorage.getItem(CONFIG_INITIALIZED_KEY) === 'true' || localStorage.getItem(CONFIG_KEY)) {
    return;
  }

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const fileConfig = await response.json();
      // Save file config as initial localStorage config
      localStorage.setItem(CONFIG_KEY, JSON.stringify(fileConfig));
      localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
      console.log('Configuration initialized from config.json');
    }
  } catch (error) {
    console.error('Failed to initialize config from file:', error);
    // Mark as initialized anyway to prevent repeated attempts
    localStorage.setItem(CONFIG_INITIALIZED_KEY, 'true');
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
