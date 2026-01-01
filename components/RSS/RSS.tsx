'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { getConfig } from '@/lib/storage';

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

  const fetchRSS = async () => {
    try {
      const config = getConfig();

      if (config.rssFeeds.length === 0) {
        setLoading(false);
        return;
      }

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

  useEffect(() => {
    fetchRSS();

    const config = getConfig();
    const interval = setInterval(fetchRSS, config.refreshIntervals.rss * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll through news items
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000); // 10 seconds - matches PROCESSING_LIMITS.RSS_CAROUSEL_INTERVAL_MS

    return () => clearInterval(interval);
  }, [items.length]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">뉴스</h2>
        <div className="text-gray-400 text-vw-sm">뉴스 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">뉴스</h2>
        <div className="text-gray-400 text-vw-sm">뉴스를 가져올 수 없습니다</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">뉴스</h2>
        <div className="text-gray-400 text-vw-sm">
          {getConfig().rssFeeds.length === 0 ? '설정에서 RSS 피드를 추가하세요' : '뉴스 아이템이 없습니다'}
        </div>
      </div>
    );
  }

  const config = getConfig();
  const displayLimit = config.displayLimits.rssItems;

  const displayItems = items.length > 0
    ? Array.from({ length: Math.min(displayLimit, items.length) }).map((_, i) => items[(currentIndex + i) % items.length])
    : [];

  return (
    <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
      <h2 className="text-vw-xl font-semibold mb-vw-sm">뉴스</h2>
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
                  locale: ko,
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
    </div>
  );
}
