# RPI Kiosk Configuration Example

## Default Configuration

The application comes with these default settings:

```json
{
  "timezone": "Asia/Seoul",
  "weatherLocation": {
    "lat": 37.5665,
    "lon": 126.9780,
    "city": "Seoul"
  },
  "rssFeeds": [
    "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
  ],
  "refreshIntervals": {
    "weather": 30,
    "calendar": 15,
    "rss": 15
  }
}
```

## Customization

### Timezones
Common timezone values:
- `Asia/Seoul` - Korea
- `Asia/Tokyo` - Japan
- `America/New_York` - US Eastern
- `America/Los_Angeles` - US Pacific
- `Europe/London` - UK
- `Europe/Paris` - France/Germany

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Weather Locations
To find coordinates for your city:
1. Visit https://www.latlong.net/
2. Search for your city
3. Copy the latitude and longitude values

### Google Calendar Setup
1. Open Google Calendar (https://calendar.google.com)
2. Click on the calendar you want to display
3. Click "Settings and sharing"
4. Scroll to "Integrate calendar"
5. Copy the "Secret address in iCal format" URL
6. Paste into the settings page

### RSS Feeds
Popular Korean RSS Feeds:
- Google News Korea: `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`
- Naver News: `https://news.naver.com/mainRss.nhn`
- Daum News: `https://media.daum.net/rss/`

International RSS Feeds:
- BBC News: `https://feeds.bbci.co.uk/news/rss.xml`
- CNN: `http://rss.cnn.com/rss/edition.rss`
- The Guardian: `https://www.theguardian.com/world/rss`
- Reuters: `https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best`

### Refresh Intervals
- **Weather**: Recommended 30-60 minutes (weather doesn't change that often)
- **Calendar**: Recommended 15-30 minutes
- **RSS**: Recommended 15-30 minutes (depending on feed update frequency)

## Notes

- All settings are stored in browser localStorage
- Settings persist across browser restarts
- To reset to defaults, use the "초기화" (Reset) button in settings
- Configuration is per-browser (if you use multiple devices, configure each separately)
