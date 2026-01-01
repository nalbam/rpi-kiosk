import { defaultConfig } from './config';
import type { KioskConfig } from './config';

/**
 * Merges partial config with default config to ensure all required fields exist.
 *
 * Used by config API route to ensure consistency when reading or writing config.
 * Performs deep merging for nested objects (weatherLocation, refreshIntervals, displayLimits).
 *
 * @param partialConfig - Partial configuration object (from config.json or request body)
 * @returns Complete configuration with all required fields
 *
 * @example
 * ```typescript
 * // In config API route
 * const fileConfig = JSON.parse(fileContent);
 * const config = mergeConfigWithDefaults(fileConfig);
 * ```
 */
export function mergeConfigWithDefaults(
  partialConfig: Partial<KioskConfig>
): KioskConfig {
  return {
    ...defaultConfig,
    ...partialConfig,
    weatherLocation: {
      ...defaultConfig.weatherLocation,
      ...partialConfig.weatherLocation,
    },
    refreshIntervals: {
      ...defaultConfig.refreshIntervals,
      ...partialConfig.refreshIntervals,
    },
    displayLimits: {
      ...defaultConfig.displayLimits,
      ...partialConfig.displayLimits,
    },
  };
}
