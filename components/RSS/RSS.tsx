'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PROCESSING_LIMITS } from '@/lib/constants';
import { useWidgetData } from '@/lib/hooks/useWidgetData';
import { WidgetContainer } from '@/components/shared/WidgetContainer';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface RSSResponse {
  items: RSSItem[];
}

export default function RSS() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(7);

  const { data, loading, error } = useWidgetData<RSSResponse>({
    componentName: 'RSS',
    refreshKey: 'rss',
    buildUrl: () => '/api/rss',
    validateResponse: (data): data is RSSResponse =>
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      Array.isArray(data.items),
    onConfigReady: (config) => {
      setDisplayLimit(config.displayLimits.rssItems);
    },
  });

  const items = data?.items ?? [];

  // Auto-scroll through news items (carousel)
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, PROCESSING_LIMITS.RSS_CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [items.length]);

  // Memoize displayItems to avoid unnecessary recalculations
  const displayItems = useMemo(() => {
    if (items.length === 0) return [];
    return Array.from({ length: Math.min(displayLimit, items.length) }).map(
      (_, i) => items[(currentIndex + i) % items.length]
    );
  }, [items, currentIndex, displayLimit]);

  return (
    <WidgetContainer
      title="News"
      loading={loading}
      loadingMessage="Loading news..."
      error={error}
      errorMessage="Unable to fetch news"
      empty={items.length === 0}
      emptyMessage="No news items"
    >
      <ul className="space-y-vw-sm overflow-y-auto flex-1 min-h-0" aria-label="News feed">
        {displayItems.map((item) => (
          <li key={item.link} className="border-b border-gray-700 pb-vw-xs last:border-b-0">
            <article aria-label={`${item.title} from ${item.source}`}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                <div className="font-medium mb-vw-xs overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title}</div>
              </a>
              <div className="flex justify-between text-vw-xs text-gray-500">
                <span>{item.source}</span>
                <span>
                  {formatDistanceToNow(new Date(item.pubDate), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <div className="mt-vw-sm flex justify-center space-x-2" role="status" aria-label="News carousel indicators">
        {Array.from({ length: Math.min(items.length, displayLimit) }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-blue-500' : 'bg-gray-600'
            }`}
            aria-label={index === 0 ? 'Current page' : 'Page indicator'}
          />
        ))}
      </div>
    </WidgetContainer>
  );
}
