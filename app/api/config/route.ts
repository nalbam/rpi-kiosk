import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

    // If no config.json, return default config with _initialized: false
    return NextResponse.json({ ...defaultConfig, _initialized: false });
  } catch (error) {
    console.error('Failed to read config.json:', error);
    // On error, return default config
    return NextResponse.json({ ...defaultConfig, _initialized: false });
  }
}

/**
 * POST /api/config
 * Saves configuration to config.json file
 */
export async function POST(request: Request) {
  try {
    const config = await request.json();

    // Validate config structure
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid configuration data' },
        { status: 400 }
      );
    }

    // Merge with default config to ensure all required fields
    const fullConfig: KioskConfig = {
      ...defaultConfig,
      ...config,
      weatherLocation: {
        ...defaultConfig.weatherLocation,
        ...config.weatherLocation,
      },
      refreshIntervals: {
        ...defaultConfig.refreshIntervals,
        ...config.refreshIntervals,
      },
      displayLimits: {
        ...defaultConfig.displayLimits,
        ...config.displayLimits,
      },
    };

    const configPath = join(process.cwd(), 'config.json');

    // Write to config.json
    writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf-8');

    console.log('Configuration saved to config.json');
    return NextResponse.json({ success: true, config: fullConfig });
  } catch (error) {
    console.error('Failed to save config.json:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
