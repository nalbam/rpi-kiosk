export interface KioskConfig {
  timeServer?: string;
  timezone: string;
  dateFormat: string; // date-fns format string
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

// Available date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'EEEE, MMMM dd, yyyy', label: 'Wednesday, January 01, 2026' },
  { value: 'MMMM dd, yyyy', label: 'January 01, 2026' },
  { value: 'yyyy-MM-dd', label: '2026-01-01' },
  { value: 'MM/dd/yyyy', label: '01/01/2026' },
  { value: 'dd/MM/yyyy', label: '01/01/2026' },
  { value: 'dd MMMM yyyy', label: '01 January 2026' },
  { value: 'EEE, MMM dd, yyyy', label: 'Wed, Jan 01, 2026' },
] as const;

export const defaultConfig: KioskConfig = {
  timezone: 'America/New_York',
  dateFormat: 'EEEE, MMMM dd, yyyy',
  weatherLocation: {
    lat: 40.7128,
    lon: -74.0060,
    city: 'New York'
  },
  rssFeeds: [
    'https://news.google.com/rss?hl=en&gl=US&ceid=US:en',
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
