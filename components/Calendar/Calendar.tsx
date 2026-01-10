'use client';

import { useState } from 'react';
import { format, isSameDay, isToday, isTomorrow } from 'date-fns';
import { MapPin } from 'lucide-react';
import { useWidgetData } from '@/lib/hooks/useWidgetData';
import { WidgetContainer } from '@/components/shared/WidgetContainer';

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  description: string;
  location: string;
  isAllDay: boolean;
}

interface CalendarResponse {
  events: CalendarEvent[];
}

export default function Calendar() {
  const [displayLimit, setDisplayLimit] = useState(5);

  const { data, loading, error } = useWidgetData<CalendarResponse>({
    componentName: 'Calendar',
    refreshKey: 'calendar',
    buildUrl: () => '/api/calendar',
    validateResponse: (data): data is CalendarResponse =>
      typeof data === 'object' &&
      data !== null &&
      'events' in data &&
      Array.isArray(data.events),
    onConfigReady: (config) => {
      setDisplayLimit(config.displayLimits.calendarEvents);
    },
  });

  const events = data?.events ?? [];

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const displayEvents = events.slice(0, displayLimit);

  return (
    <WidgetContainer
      title="Calendar"
      loading={loading}
      loadingMessage="Loading events..."
      error={error}
      errorMessage="Unable to fetch events"
      empty={events.length === 0}
      emptyMessage="No upcoming events"
    >
      <ul className="space-y-vw-xs overflow-y-auto flex-1 min-h-0" aria-label="Upcoming calendar events">
        {displayEvents.map((event, index) => {
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          const isSingleDay = isSameDay(startDate, endDate);

          let timeDisplay = '';
          if (event.isAllDay) {
            // For all-day events, API returns date strings (YYYY-MM-DD)
            const startDateStr = event.start; // Already in YYYY-MM-DD format
            const endDateStr = event.end; // Already in YYYY-MM-DD format

            // Parse dates as UTC to avoid timezone conversion
            const startParts = startDateStr.split('-').map(Number);
            const endParts = endDateStr.split('-').map(Number);
            const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
            const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));

            // iCal DTEND is exclusive (next day at 00:00), so subtract 1 day for the actual end date
            const actualEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);

            // Calculate duration in days
            const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
              // Single day all-day event
              timeDisplay = format(start, 'MM/dd');
            } else {
              // Multi-day all-day event
              const startFormatted = format(start, 'MM/dd');
              const endFormatted = format(actualEnd, 'MM/dd');

              timeDisplay = `${startFormatted} - ${endFormatted} (${daysDiff} days)`;
            }
          } else {
            // Regular timed event
            if (isSingleDay) {
              timeDisplay = `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
            } else {
              timeDisplay = `${format(startDate, 'MM/dd HH:mm')} - ${format(endDate, 'MM/dd HH:mm')}`;
            }
          }

          return (
            <li key={index}>
              <article className="border-l-4 border-blue-500 pl-vw-sm py-vw-xs" aria-label={`${event.title}, ${getDateLabel(event.start)}`}>
                <div className="flex justify-between items-start mb-vw-xs">
                  <div className="font-semibold text-vw-base">{event.title}</div>
                  <div className="text-vw-xs text-gray-400">{getDateLabel(event.start)}</div>
                </div>
                <div className="text-vw-xs text-gray-400">
                  {timeDisplay}
                </div>
                {event.location && (
                  <div className="text-vw-xs text-gray-500 mt-vw-xs flex items-center gap-1">
                    <MapPin size={12} className="flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </WidgetContainer>
  );
}
