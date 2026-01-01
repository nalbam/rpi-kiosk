import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { defaultConfig } from '@/lib/config';
import { mergeConfigWithDefaults } from '@/lib/configHelpers';
import type { KioskConfig } from '@/lib/config';
import {
  createErrorResponse,
  createValidationError,
  createSuccessResponse,
} from '@/lib/apiHelpers';

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
      const config = mergeConfigWithDefaults(fileConfig);

      return createSuccessResponse(config);
    }

    // If no config.json, return default config with _initialized: false
    return createSuccessResponse({ ...defaultConfig, _initialized: false });
  } catch (error) {
    console.error('Failed to read config.json:', error);
    // On error, return default config
    return createSuccessResponse({ ...defaultConfig, _initialized: false });
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
      return createValidationError('Invalid configuration data');
    }

    // Merge with default config to ensure all required fields
    const fullConfig = mergeConfigWithDefaults(config);

    const configPath = join(process.cwd(), 'config.json');

    // Write to config.json
    writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf-8');

    console.log('Configuration saved to config.json');
    return createSuccessResponse({ success: true, config: fullConfig });
  } catch (error) {
    return createErrorResponse('Failed to save configuration', error);
  }
}
