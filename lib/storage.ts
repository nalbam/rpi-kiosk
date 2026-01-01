import { KioskConfig, defaultConfig } from './config';

const CONFIG_KEY = 'kiosk-config';

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
