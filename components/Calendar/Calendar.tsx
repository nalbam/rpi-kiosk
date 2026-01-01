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
}

interface CalendarResponse {
  events: CalendarEvent[];
}

export default function Calendar() {
  const [displayLimit, setDisplayLimit] = useState(5);

  const { data, loading, error, config } = useWidgetData<CalendarResponse>({
    componentName: 'Calendar',
    refreshKey: 'calendar',
    buildUrl: (config) => {
      // If no calendar URL configured, return empty string (will be handled by validation)
      if (!config.calendarUrl) return '';
      return `/api/calendar?url=${encodeURIComponent(config.calendarUrl)}`;
    },
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

          // Check if it's an all-day event
          // All-day events typically start at 00:00 and end at 00:00 of the next day(s)
          const isAllDayEvent =
            startDate.getHours() === 0 &&
            startDate.getMinutes() === 0 &&
            endDate.getHours() === 0 &&
            endDate.getMinutes() === 0;

          // Calculate duration in days for multi-day all-day events
          const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          let timeDisplay = '';
          if (isAllDayEvent) {
            if (daysDiff === 1) {
              // Single day all-day event
              timeDisplay = 'All day';
            } else {
              // Multi-day all-day event
              timeDisplay = `${format(startDate, 'MM/dd')} - ${format(new Date(endDate.getTime() - 1), 'MM/dd')} (${daysDiff} days)`;
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
