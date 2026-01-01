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

export function saveConfig(config: Partial<KioskConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save config:', error);
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
