export interface KioskConfig {
  timeServer?: string;
  timezone: string;
  weatherLocation: {
    lat: number;
    lon: number;
    city: string;
  };
  calendarUrl?: string;
  rssFeeds: string[];
  refreshIntervals: {
    weather: number; // in minutes
    calendar: number; // in minutes
    rss: number; // in minutes
  };
  displayLimits: {
    calendarEvents: number; // number of calendar events to display
    rssItems: number; // number of RSS items to display in carousel
  };
}

export const defaultConfig: KioskConfig = {
  timezone: 'Asia/Seoul',
  weatherLocation: {
    lat: 37.5665,
    lon: 126.9780,
    city: 'Seoul'
  },
  rssFeeds: [
    'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
  ],
  refreshIntervals: {
    weather: 30,
    calendar: 15,
    rss: 15,
  },
  displayLimits: {
    calendarEvents: 5,
    rssItems: 7,
  }
};
