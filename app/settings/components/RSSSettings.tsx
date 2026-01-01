import { useState } from 'react';
import { KioskConfig } from '@/lib/config';

interface RSSSettingsProps {
  config: KioskConfig;
  setConfig: (config: KioskConfig) => void;
}

export default function RSSSettings({ config, setConfig }: RSSSettingsProps) {
  const [rssInput, setRssInput] = useState('');

  const handleAddRSS = () => {
    if (rssInput.trim() && config) {
      setConfig({
        ...config,
        rssFeeds: [...config.rssFeeds, rssInput.trim()],
      });
      setRssInput('');
    }
  };

  const handleRemoveRSS = (index: number) => {
    if (config) {
      setConfig({
        ...config,
        rssFeeds: config.rssFeeds.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 min-w-0">
      <h2 className="text-2xl font-semibold mb-6">RSS Feed Settings</h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="rss-feed-input" className="block text-sm font-medium mb-2">
            Add RSS Feed
          </label>
          <div className="flex gap-2">
            <input
              id="rss-feed-input"
              type="url"
              value={rssInput}
              onChange={(e) => setRssInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRSS()}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/feed.xml"
              aria-label="RSS feed URL to add"
            />
            <button
              onClick={handleAddRSS}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              aria-label="Add RSS feed"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Current RSS Feeds</label>
          <div className="space-y-2">
            {config.rssFeeds.map((feed, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-sm truncate flex-1">{feed}</span>
                <button
                  onClick={() => handleRemoveRSS(index)}
                  className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors whitespace-nowrap"
                  aria-label={`Remove RSS feed ${feed}`}
                >
                  Remove
                </button>
              </div>
            ))}
            {config.rssFeeds.length === 0 && (
              <div className="text-gray-500 text-sm">No RSS feeds added</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rss-refresh-interval" className="block text-sm font-medium mb-2">
              Refresh Interval
            </label>
            <input
              id="rss-refresh-interval"
              type="number"
              min="1"
              value={config.refreshIntervals.rss}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1) {
                  setConfig({
                    ...config,
                    refreshIntervals: { ...config.refreshIntervals, rss: value }
                  });
                }
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              aria-label="RSS feed refresh interval in minutes"
              aria-describedby="rss-refresh-hint"
            />
            <p id="rss-refresh-hint" className="text-xs text-gray-500 mt-1">
              Minutes between updates
            </p>
          </div>

          <div>
            <label htmlFor="rss-items-limit" className="block text-sm font-medium mb-2">
              News Items to Display
            </label>
            <input
              id="rss-items-limit"
              type="number"
              min="1"
              max="10"
              value={config.displayLimits.rssItems}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 10) {
                  setConfig({
                    ...config,
                    displayLimits: { ...config.displayLimits, rssItems: value }
                  });
                }
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              aria-label="Number of RSS news items to display (1 to 10)"
              aria-describedby="rss-items-hint"
            />
            <p id="rss-items-hint" className="text-xs text-gray-500 mt-1">
              1 to 10 items
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
