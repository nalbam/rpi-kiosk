import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

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
    const parser = new Parser();
    const urls = feedUrls.split(',');
    const allItems: any[] = [];

    for (const url of urls) {
      try {
        const feed = await parser.parseURL(url.trim());
        const items = feed.items.slice(0, 10).map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feed.title || 'Unknown',
        }));
        allItems.push(...items);
      } catch (error) {
        console.error(`Failed to fetch RSS feed ${url}:`, error);
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
