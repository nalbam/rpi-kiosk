import ICAL from 'ical.js';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';
import { API, PROCESSING_LIMITS } from '@/lib/constants';
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidation,
} from '@/lib/apiHelpers';
import { getServerConfig } from '@/lib/configHelpers';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string;
  location: string;
}

export async function GET() {
  // Read configuration from server
  const config = getServerConfig();
  const calendarUrl = config.calendarUrl;

  // If no calendar URL configured, return empty events
  if (!calendarUrl || calendarUrl.trim() === '') {
    return createSuccessResponse({ events: [] });
  }

  // Validate URL to prevent SSRF attacks
  const validationError = handleValidation(validateCalendarUrl(calendarUrl));
  if (validationError) {
    return validationError;
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
    oneMonthFromNow.setDate(now.getDate() + PROCESSING_LIMITS.CALENDAR_DAYS_AHEAD);

    const events: CalendarEvent[] = vevents
      .map((vevent: ICAL.Component): CalendarEvent => {
        const event = new ICAL.Event(vevent);
        return {
          title: event.summary,
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          description: event.description || '',
          location: event.location || '',
        };
      })
      .filter((event: CalendarEvent) => {
        // Show events that haven't ended yet and start within the next month
        return event.end >= now && event.start <= oneMonthFromNow;
      })
      .sort((a: CalendarEvent, b: CalendarEvent) => a.start.getTime() - b.start.getTime());

    return createSuccessResponse({ events });
  } catch (error) {
    return createErrorResponse('Failed to fetch calendar data', error);
  }
}
