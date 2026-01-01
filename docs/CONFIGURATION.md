# Configuration

## Configuration Methods

### 1. Web UI (Recommended)
Click the Settings button in the browser

### 2. Shell Script (config.json)

```bash
# Install jq (required)
sudo apt-get install jq

# Initialize configuration file
./scripts/config.sh init

# Set values
./scripts/config.sh set timezone "Asia/Seoul"
./scripts/config.sh set weatherLocation.lat 37.5665
./scripts/config.sh set weatherLocation.city "Seoul"

# Get value
./scripts/config.sh get timezone

# View all settings
./scripts/config.sh list
```

**Priority**: localStorage > config.json > defaults

## Default Configuration

```json
{
  "timezone": "Asia/Seoul",
  "dateFormat": "EEEE, MMMM dd, yyyy",
  "weatherLocation": {
    "lat": 37.5665,
    "lon": 126.9780,
    "city": "Seoul"
  },
  "calendarUrl": "",
  "rssFeeds": [
    "https://news.google.com/rss?hl=en&gl=US&ceid=US:en"
  ],
  "refreshIntervals": {
    "weather": 30,
    "calendar": 15,
    "rss": 15
  },
  "displayLimits": {
    "calendarEvents": 5,
    "rssItems": 7
  }
}
```

## Timezones

- `Asia/Seoul` - Korea
- `Asia/Tokyo` - Japan
- `America/New_York` - US Eastern
- `America/Los_Angeles` - US Pacific
- `Europe/London` - UK

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Date Formats

Choose from these formats in settings:
- `EEEE, MMMM dd, yyyy` - Wednesday, January 01, 2026
- `MMMM dd, yyyy` - January 01, 2026
- `yyyy-MM-dd` - 2026-01-01
- `MM/dd/yyyy` - 01/01/2026
- `dd/MM/yyyy` - 01/01/2026
- `dd MMMM yyyy` - 01 January 2026
- `EEE, MMM dd, yyyy` - Wed, Jan 01, 2026

## Weather Coordinates

Find coordinates: https://www.latlong.net/

## Google Calendar

1. Google Calendar → Settings and sharing
2. Integrate calendar → Secret address
3. Copy iCal format URL

## RSS Feeds

**International**
- BBC: `https://feeds.bbci.co.uk/news/rss.xml`
- CNN: `http://rss.cnn.com/rss/edition.rss`
- Reuters: `https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best`

**Regional**
- Google News (Korea): `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`
- Google News (US): `https://news.google.com/rss?hl=en&gl=US&ceid=US:en`

## Refresh Intervals (minutes)

- Weather: 30-60 recommended
- Calendar: 15-30 recommended
- RSS: 15-30 recommended

## Display Limits

- Calendar: 1-10 (default 5)
- RSS: 1-10 (default 7)

## Storage Location

- Browser localStorage
- Reset: Settings page → Reset button
