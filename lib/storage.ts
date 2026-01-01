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
      return { ...defaultConfig, ...JSON.parse(stored) };
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
    localStorage.removeItem(CONFIG_KEY);
  } catch (error) {
    console.error('Failed to reset config:', error);
  }
}
