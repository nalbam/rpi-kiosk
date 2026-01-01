import { useEffect, useRef } from 'react';
import { getConfig } from '@/lib/storage';

type RefreshKey = 'weather' | 'calendar' | 'rss';

interface UseAutoRefreshOptions {
  refreshKey: RefreshKey;
  onRefresh: () => void | Promise<void>;
  enabled?: boolean; // Allow disabling the interval
}

/**
 * Custom hook to manage auto-refresh intervals based on configuration.
 *
 * Automatically sets up an interval that calls the refresh callback at
 * intervals specified in the config. Handles cleanup on unmount.
 *
 * @param options - Configuration for auto-refresh behavior
 *
 * @example
 * ```typescript
 * useAutoRefresh({
 *   refreshKey: 'weather',
 *   onRefresh: fetchWeather,
 *   enabled: !!config,
 * });
 * ```
 */
export function useAutoRefresh(options: UseAutoRefreshOptions) {
  const { refreshKey, onRefresh, enabled = true } = options;

  // Use ref to store the latest callback to avoid re-running effect on callback change
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    onRefreshRef.current();

    // Setup interval based on config
    async function setupInterval() {
      const config = await getConfig();
      const intervalMs = config.refreshIntervals[refreshKey] * 60 * 1000;
      const interval = setInterval(() => onRefreshRef.current(), intervalMs);
      return interval;
    }

    let intervalId: NodeJS.Timeout;
    setupInterval().then((id) => {
      intervalId = id;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshKey, enabled]);
}
