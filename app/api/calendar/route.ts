import { NextResponse } from 'next/server';
import ICAL from 'ical.js';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';
import { API, DISPLAY } from '@/lib/constants';

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
    const response = await fetchWithTimeout(calendarUrl, API.TIMEOUT_MS, API.MAX_CALENDAR_SIZE);

    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setDate(now.getDate() + DISPLAY.CALENDAR_DAYS_AHEAD);

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
      .filter((event: any) => {
        // Show events that haven't ended yet and start within the next month
        return event.end >= now && event.start <= oneMonthFromNow;
      })
      .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())
      .slice(0, DISPLAY.MAX_CALENDAR_EVENTS);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
