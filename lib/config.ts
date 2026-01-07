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

// Date format option type
export type DateFormatLocale = 'en' | 'ko' | 'ja' | 'zh-CN';

export interface DateFormatOption {
  value: string;
  label: string;
  locale: DateFormatLocale;
}

// Available date format options
export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  // English formats
  { value: 'EEEE, MMMM dd, yyyy', label: 'Wednesday, January 01, 2026', locale: 'en' },
  { value: 'MMMM dd, yyyy', label: 'January 01, 2026', locale: 'en' },
  { value: 'yyyy-MM-dd', label: '2026-01-01', locale: 'en' },
  { value: 'MM/dd/yyyy', label: '01/01/2026', locale: 'en' },
  { value: 'dd/MM/yyyy', label: '01/01/2026', locale: 'en' },
  { value: 'dd MMMM yyyy', label: '01 January 2026', locale: 'en' },
  { value: 'EEE, MMM dd, yyyy', label: 'Wed, Jan 01, 2026', locale: 'en' },

  // Korean formats
  { value: 'yyyy년 M월 d일 EEEE', label: '2026년 1월 8일 수요일', locale: 'ko' },
  { value: 'yyyy년 M월 d일 (EEE)', label: '2026년 1월 8일 (수)', locale: 'ko' },

  // Japanese formats
  { value: 'yyyy年M月d日 EEEE', label: '2026年1月8日 水曜日', locale: 'ja' },
  { value: 'yyyy年M月d日(EEE)', label: '2026年1月8日(水)', locale: 'ja' },

  // Chinese formats
  { value: 'yyyy年M月d日 (EEEE)', label: '2026年1月8日 (星期三)', locale: 'zh-CN' },
  { value: 'yyyy年M月d日', label: '2026年1月8日', locale: 'zh-CN' },
];

// Helper function to get locale from date format
export function getLocaleFromDateFormat(dateFormat: string): DateFormatLocale {
  const option = DATE_FORMAT_OPTIONS.find(opt => opt.value === dateFormat);
  return option?.locale || 'en';
}

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
