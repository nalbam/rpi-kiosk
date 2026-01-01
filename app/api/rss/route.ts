import Parser from 'rss-parser';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';
import { API, PROCESSING_LIMITS } from '@/lib/constants';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/apiHelpers';
import { getServerConfig } from '@/lib/configHelpers';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function GET() {
  // Read configuration from server
  const config = getServerConfig();
  const feedUrls = config.rssFeeds;

  // If no RSS feeds configured, return empty items
  if (!feedUrls || feedUrls.length === 0) {
    return createSuccessResponse({ items: [] });
  }

  try {
    const urls = feedUrls;
    const allItems: RSSItem[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const url of urls) {
      const trimmedUrl = url.trim();

      // Validate each RSS feed URL to prevent SSRF
      const validation = validateCalendarUrl(trimmedUrl);
      if (!validation.valid) {
        console.error(`Invalid RSS feed URL ${trimmedUrl}: ${validation.error}`);
        failCount++;
        continue; // Skip invalid URLs but continue with others
      }

      try {
        // Fetch RSS feed with timeout protection
        const response = await fetchWithTimeout(trimmedUrl, API.TIMEOUT_MS, API.MAX_RSS_SIZE);
        const xmlText = await response.text();

        // Parse the RSS feed
        const parser = new Parser();
        const feed = await parser.parseString(xmlText);

        const items = feed.items.slice(0, PROCESSING_LIMITS.MAX_RSS_ITEMS_PER_FEED).map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feed.title || 'Unknown',
        }));
        allItems.push(...items);
        successCount++;
      } catch (error) {
        console.error(`Failed to fetch RSS feed ${trimmedUrl}:`, error);
        failCount++;
      }
    }

    // If all feeds failed, return an error
    if (successCount === 0 && urls.length > 0) {
      return createErrorResponse('All RSS feeds failed to load');
    }

    // Sort by date and limit total items
    const sortedItems = allItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, PROCESSING_LIMITS.MAX_RSS_ITEMS_TOTAL);

    return createSuccessResponse({ items: sortedItems });
  } catch (error) {
    return createErrorResponse('Failed to fetch RSS feeds', error);
  }
}
