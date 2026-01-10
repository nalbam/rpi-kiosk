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
            // For all-day events, extract date strings to avoid timezone issues
            const startDateStr = event.start.split('T')[0]; // Get YYYY-MM-DD
            const endDateStr = event.end.split('T')[0]; // Get YYYY-MM-DD

            if (startDateStr === endDateStr) {
              // Single day all-day event
              timeDisplay = 'All day';
            } else {
              // Multi-day all-day event - calculate days from date strings
              const start = new Date(startDateStr);
              const end = new Date(endDateStr);
              const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

              // Format dates directly from date strings to avoid timezone conversion
              const startFormatted = format(new Date(startDateStr), 'MM/dd');
              const endFormatted = format(new Date(endDateStr), 'MM/dd');

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
