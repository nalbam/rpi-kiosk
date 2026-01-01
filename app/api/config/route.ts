import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { defaultConfig } from '@/lib/config';
import type { KioskConfig } from '@/lib/config';

/**
 * GET /api/config
 * Returns configuration from config.json file (if exists) or default config
 */
export async function GET() {
  try {
    const configPath = join(process.cwd(), 'config.json');

    // If config.json exists, read and return it
    if (existsSync(configPath)) {
      const fileContent = readFileSync(configPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent) as Partial<KioskConfig>;

      // Merge with default config to ensure all required fields exist
      const config: KioskConfig = {
        ...defaultConfig,
        ...fileConfig,
        weatherLocation: {
          ...defaultConfig.weatherLocation,
          ...fileConfig.weatherLocation,
        },
        refreshIntervals: {
          ...defaultConfig.refreshIntervals,
          ...fileConfig.refreshIntervals,
        },
        displayLimits: {
          ...defaultConfig.displayLimits,
          ...fileConfig.displayLimits,
        },
      };

      return NextResponse.json(config);
    }

    // If no config.json, return default config
    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('Failed to read config.json:', error);
    // On error, return default config
    return NextResponse.json(defaultConfig);
  }
}
