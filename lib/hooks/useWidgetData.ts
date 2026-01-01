import { useState, useCallback } from 'react';
import { useConfigWithRetry } from './useConfigWithRetry';
import { useAutoRefresh } from './useAutoRefresh';
import type { KioskConfig } from '@/lib/config';

type RefreshKey = 'weather' | 'calendar' | 'rss';

interface UseWidgetDataOptions<TData> {
  /**
   * Component name for logging/debugging
   */
  componentName: string;

  /**
   * Refresh key to determine auto-refresh interval
   */
  refreshKey: RefreshKey;

  /**
   * Function to build API URL from config
   */
  buildUrl: (config: KioskConfig) => string;

  /**
   * Function to validate API response structure
   * Returns true if valid, false otherwise
   */
  validateResponse: (data: unknown) => data is TData;

  /**
   * Optional callback when config is ready
   */
  onConfigReady?: (config: KioskConfig) => void;
}

interface UseWidgetDataResult<TData> {
  data: TData | null;
  loading: boolean;
  error: boolean;
  config: KioskConfig | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage widget data fetching with auto-refresh.
 *
 * Handles:
 * - Loading, error, and data state management
 * - Config loading with retry logic
 * - API data fetching with validation
 * - Auto-refresh based on config intervals
 *
 * @example
 * ```typescript
 * const { data, loading, error, config } = useWidgetData({
 *   componentName: 'Weather',
 *   refreshKey: 'weather',
 *   buildUrl: (config) => `/api/weather?lat=${config.weatherLocation.lat}&lon=${config.weatherLocation.lon}`,
 *   validateResponse: (data): data is WeatherData =>
 *     typeof data === 'object' && data !== null &&
 *     typeof data.temperature === 'number' &&
 *     typeof data.weatherCode === 'number',
 * });
 * ```
 */
export function useWidgetData<TData>({
  componentName,
  refreshKey,
  buildUrl,
  validateResponse,
  onConfigReady,
}: UseWidgetDataOptions<TData>): UseWidgetDataResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { config } = useConfigWithRetry({
    componentName,
    onConfigReady,
  });

  const fetchData = useCallback(async () => {
    if (!config) return;

    try {
      const url = buildUrl(config);

      // If URL is empty, it means there's no data source configured
      // Just finish loading without error
      if (!url || url.trim() === '') {
        setLoading(false);
        return;
      }

      const response = await fetch(url);

      if (response.ok) {
        const responseData = await response.json();

        // Validate response structure
        if (validateResponse(responseData)) {
          setData(responseData);
          setError(false);
        } else {
          console.error(
            `Invalid ${componentName} response structure:`,
            responseData
          );
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(`Failed to fetch ${componentName}:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [config, buildUrl, validateResponse, componentName]);

  useAutoRefresh({
    refreshKey,
    onRefresh: fetchData,
    enabled: !!config,
  });

  return {
    data,
    loading,
    error,
    config,
    refetch: fetchData,
  };
}
