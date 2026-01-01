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

  const fetchCalendar = async () => {
    try {
      const config = getConfig();

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
    
    const config = getConfig();
    const interval = setInterval(fetchCalendar, config.refreshIntervals.calendar * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return '오늘';
    if (isTomorrow(date)) return '내일';
    return format(date, 'MM월 dd일');
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">일정</h2>
        <div className="text-gray-400">일정 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">일정</h2>
        <div className="text-gray-400">일정을 가져올 수 없습니다</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">일정</h2>
        <div className="text-gray-400">
          {getConfig().calendarUrl ? '예정된 일정이 없습니다' : '설정에서 캘린더 URL을 추가하세요'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-semibold mb-4">일정</h2>
      <div className="space-y-3">
        {events.map((event, index) => {
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          const isSingleDay = isSameDay(startDate, endDate);

          return (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start mb-1">
                <div className="font-semibold text-lg">{event.title}</div>
                <div className="text-sm text-gray-400">{getDateLabel(event.start)}</div>
              </div>
              <div className="text-sm text-gray-400">
                {format(startDate, 'HH:mm')}
                {!isSingleDay && ` - ${format(endDate, 'MM/dd HH:mm')}`}
                {isSingleDay && endDate.getTime() !== startDate.getTime() && ` - ${format(endDate, 'HH:mm')}`}
              </div>
              {event.location && (
                <div className="text-sm text-gray-500 mt-1">📍 {event.location}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
