import { useState, useEffect, useRef } from 'react';
import { getConfig } from '@/lib/storage';
import type { KioskConfig } from '@/lib/config';

interface UseConfigWithRetryOptions {
  componentName?: string; // For logging purposes
  maxRetries?: number;    // Default: 10
  retryDelay?: number;    // Default: 500ms
  onConfigReady?: (config: KioskConfig) => void; // Callback when config is ready
}

/**
 * Custom hook to load configuration with retry logic for uninitialized configs.
 *
 * On first visit, config may not be initialized yet. This hook automatically
 * retries loading the config until it's ready or max retries is reached.
 *
 * @param options - Configuration options for retry behavior
 * @returns Object containing config, loading state, and initialization status
 *
 * @example
 * ```typescript
 * const { config, isLoading, isInitialized } = useConfigWithRetry({
 *   componentName: 'Weather',
 *   onConfigReady: (config) => {
 *     setCity(config.weatherLocation.city);
 *   },
 * });
 * ```
 */
export function useConfigWithRetry(options: UseConfigWithRetryOptions = {}) {
  const {
    componentName = 'Component',
    maxRetries = 10,
    retryDelay = 500,
    onConfigReady,
  } = options;

  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref to store the latest callback to avoid re-running effect on callback change
  const onConfigReadyRef = useRef(onConfigReady);
  useEffect(() => {
    onConfigReadyRef.current = onConfigReady;
  }, [onConfigReady]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    async function loadConfig() {
      const fetchedConfig = await getConfig();

      // Check if config is not yet initialized (first visit)
      if ((fetchedConfig as any)._initialized === false && retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => {
          if (isMounted) {
            loadConfig();
          }
        }, retryDelay);
        return;
      }

      // Config is ready or max retries reached
      if (isMounted) {
        if ((fetchedConfig as any)._initialized === false) {
          console.warn(`${componentName}: Config initialization timeout after ${maxRetries} retries`);
        }

        setConfig(fetchedConfig);
        setIsLoading(false);
        setIsInitialized((fetchedConfig as any)._initialized !== false);

        if (onConfigReadyRef.current) {
          onConfigReadyRef.current(fetchedConfig);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [componentName, maxRetries, retryDelay]);

  return { config, isLoading, isInitialized };
}
