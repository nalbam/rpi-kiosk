'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
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
      }
    } catch (error) {
      console.error('Failed to fetch RSS:', error);
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
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [items.length]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">뉴스</h2>
        <div className="text-gray-400">뉴스 로딩 중...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">뉴스</h2>
        <div className="text-gray-400">
          뉴스를 가져올 수 없습니다
        </div>
      </div>
    );
  }

  const displayItems = items.slice(currentIndex, currentIndex + 5);
  if (displayItems.length < 5) {
    displayItems.push(...items.slice(0, 5 - displayItems.length));
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-semibold mb-4">뉴스</h2>
      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <div key={`${currentIndex}-${index}`} className="border-b border-gray-700 pb-3 last:border-b-0">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              <div className="font-medium mb-1 line-clamp-2">{item.title}</div>
            </a>
            <div className="flex justify-between text-xs text-gray-500">
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
      <div className="mt-4 flex justify-center space-x-2">
        {Array.from({ length: Math.min(items.length, 5) }).map((_, index) => (
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
