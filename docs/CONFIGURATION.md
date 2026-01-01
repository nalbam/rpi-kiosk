# Configuration

## 기본 설정

```json
{
  "timezone": "Asia/Seoul",
  "weatherLocation": {
    "lat": 37.5665,
    "lon": 126.9780,
    "city": "Seoul"
  },
  "calendarUrl": "",
  "rssFeeds": [
    "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
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

## 타임존

- `Asia/Seoul` - 한국
- `Asia/Tokyo` - 일본
- `America/New_York` - 미국 동부
- `America/Los_Angeles` - 미국 서부
- `Europe/London` - 영국

전체 목록: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## 날씨 좌표

좌표 찾기: https://www.latlong.net/

## Google Calendar

1. Google Calendar → 설정 및 공유
2. 캘린더 통합 → 비공개 주소
3. iCal 형식 URL 복사

## RSS 피드

**한국**
- Google News: `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`

**해외**
- BBC: `https://feeds.bbci.co.uk/news/rss.xml`
- CNN: `http://rss.cnn.com/rss/edition.rss`
- Reuters: `https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best`

## 새로고침 간격 (분)

- Weather: 30-60 권장
- Calendar: 15-30 권장
- RSS: 15-30 권장

## 표시 개수

- Calendar: 1-10 (기본 5)
- RSS: 1-10 (기본 7)

## 저장 위치

- Browser localStorage
- 초기화: 설정 페이지 → 초기화 버튼
