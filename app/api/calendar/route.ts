import { NextResponse } from 'next/server';
import ICAL from 'ical.js';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarUrl = searchParams.get('url');

  if (!calendarUrl) {
    return NextResponse.json(
      { error: 'Missing calendar URL' },
      { status: 400 }
    );
  }

  // Validate URL to prevent SSRF attacks
  const validation = validateCalendarUrl(calendarUrl);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'Invalid calendar URL' },
      { status: 400 }
    );
  }

  try {
    // Fetch with timeout and size limits
    const response = await fetchWithTimeout(calendarUrl, 10000, 5 * 1024 * 1024); // 10s timeout, 5MB max
    
    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const now = new Date();
    const events = vevents
      .map((vevent: any) => {
        const event = new ICAL.Event(vevent);
        return {
          title: event.summary,
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          description: event.description || '',
          location: event.location || '',
        };
      })
      .filter((event: any) => event.end >= now)
      .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
      .slice(0, 10);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
