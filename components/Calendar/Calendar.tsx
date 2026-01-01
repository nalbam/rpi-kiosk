'use client';

import { useState, useEffect } from 'react';
import { format, isSameDay, isToday, isTomorrow } from 'date-fns';
import { getConfig } from '@/lib/storage';

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  description: string;
  location: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(5);

  const fetchCalendar = async () => {
    try {
      const config = await getConfig();
      setDisplayLimit(config.displayLimits.calendarEvents);

      if (!config.calendarUrl) {
        setLoading(false);
        return;
      }

      // Basic client-side URL validation
      try {
        const url = new URL(config.calendarUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          console.error('Invalid URL protocol:', url.protocol);
          setError(true);
          setLoading(false);
          return;
        }
      } catch {
        console.error('Invalid URL format:', config.calendarUrl);
        setError(true);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/calendar?url=${encodeURIComponent(config.calendarUrl)}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();

    async function setupInterval() {
      const config = await getConfig();
      const interval = setInterval(fetchCalendar, config.refreshIntervals.calendar * 60 * 1000);
      return interval;
    }

    let intervalId: NodeJS.Timeout;
    setupInterval().then((id) => {
      intervalId = id;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Calendar</h2>
        <div className="text-gray-400 text-vw-sm">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Calendar</h2>
        <div className="text-gray-400 text-vw-sm">Unable to fetch events</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
        <h2 className="text-vw-xl font-semibold mb-vw-sm">Calendar</h2>
        <div className="text-gray-400 text-vw-sm">No upcoming events</div>
      </div>
    );
  }

  const displayEvents = events.slice(0, displayLimit);

  return (
    <div className="bg-gray-900 rounded-lg p-vw-sm border border-gray-800 h-full flex flex-col">
      <h2 className="text-vw-xl font-semibold mb-vw-sm">Calendar</h2>
      <div className="space-y-vw-xs overflow-y-auto flex-1 min-h-0">
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
            <div key={index} className="border-l-4 border-blue-500 pl-vw-sm py-vw-xs">
              <div className="flex justify-between items-start mb-vw-xs">
                <div className="font-semibold text-vw-base">{event.title}</div>
                <div className="text-vw-xs text-gray-400">{getDateLabel(event.start)}</div>
              </div>
              <div className="text-vw-xs text-gray-400">
                {timeDisplay}
              </div>
              {event.location && (
                <div className="text-vw-xs text-gray-500 mt-vw-xs">📍 {event.location}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
