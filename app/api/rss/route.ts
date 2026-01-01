import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrls = searchParams.get('urls');

  if (!feedUrls) {
    return NextResponse.json(
      { error: 'Missing feed URLs' },
      { status: 400 }
    );
  }

  try {
    const urls = feedUrls.split(',');
    const allItems: any[] = [];

    for (const url of urls) {
      const trimmedUrl = url.trim();
      
      // Validate each RSS feed URL to prevent SSRF
      const validation = validateCalendarUrl(trimmedUrl);
      if (!validation.valid) {
        console.error(`Invalid RSS feed URL ${trimmedUrl}: ${validation.error}`);
        continue; // Skip invalid URLs but continue with others
      }

      try {
        // Fetch RSS feed with timeout protection
        const response = await fetchWithTimeout(trimmedUrl, 10000, 5 * 1024 * 1024);
        const xmlText = await response.text();
        
        // Parse the RSS feed
        const parser = new Parser();
        const feed = await parser.parseString(xmlText);
        
        const items = feed.items.slice(0, 10).map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feed.title || 'Unknown',
        }));
        allItems.push(...items);
      } catch (error) {
        console.error(`Failed to fetch RSS feed ${trimmedUrl}:`, error);
      }
    }

    // Sort by date and limit to 20 items
    const sortedItems = allItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20);

    return NextResponse.json({ items: sortedItems });
  } catch (error) {
    console.error('RSS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds' },
      { status: 500 }
    );
  }
}
