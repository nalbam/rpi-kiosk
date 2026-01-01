'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useConfigWithRetry } from '@/lib/hooks/useConfigWithRetry';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { WidgetContainer } from '@/components/shared/WidgetContainer';
import { PROCESSING_LIMITS } from '@/lib/constants';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export default function RSS() {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(7);

  const { config } = useConfigWithRetry({
    componentName: 'RSS',
    onConfigReady: (config) => {
      setDisplayLimit(config.displayLimits.rssItems);
    },
  });

  const fetchRSS = async () => {
    if (!config) return;

    // If no RSS feeds configured, just finish loading
    if (config.rssFeeds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/rss?urls=${encodeURIComponent(config.rssFeeds.join(','))}`
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch RSS:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh({
    refreshKey: 'rss',
    onRefresh: fetchRSS,
    enabled: !!config,
  });

  // Auto-scroll through news items (carousel)
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, PROCESSING_LIMITS.RSS_CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [items.length]);

  const displayItems = items.length > 0
    ? Array.from({ length: Math.min(displayLimit, items.length) }).map((_, i) => items[(currentIndex + i) % items.length])
    : [];

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
      <div className="space-y-vw-sm overflow-y-auto flex-1 min-h-0">
        {displayItems.map((item) => (
          <div key={item.link} className="border-b border-gray-700 pb-vw-xs last:border-b-0">
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
          </div>
        ))}
      </div>
      <div className="mt-vw-sm flex justify-center space-x-2">
        {Array.from({ length: Math.min(items.length, displayLimit) }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === 0 ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </WidgetContainer>
  );
}
