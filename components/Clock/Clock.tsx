'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ko } from 'date-fns/locale/ko';
import { getConfig } from '@/lib/storage';

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState('Asia/Seoul');

  useEffect(() => {
    const config = getConfig();
    setTimezone(config.timezone);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="text-center">
        <div className="text-vw-8xl font-bold mb-vw-xs text-gray-600">
          --:--:--
        </div>
        <div className="text-vw-2xl text-gray-500">
          로딩 중...
        </div>
      </div>
    );
  }

  const zonedTime = toZonedTime(time, timezone);

  return (
    <div className="text-center">
      <div className="text-vw-8xl font-bold mb-vw-xs">
        {format(zonedTime, 'HH:mm:ss')}
      </div>
      <div className="text-vw-2xl text-gray-400">
        {format(zonedTime, 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
      </div>
      <div className="text-vw-base text-gray-500 mt-vw-xs">
        {timezone}
      </div>
    </div>
  );
}
