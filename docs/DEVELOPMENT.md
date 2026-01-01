# Development Guide

## Requirements

- Node.js 22 LTS
- npm

## Development Environment Setup

```bash
git clone https://github.com/nalbam/rpi-hub.git
cd rpi-hub
npm install
npm run dev
```

http://localhost:3000

## Project Structure

```
app/
├── api/              # API Routes
│   ├── calendar/
│   ├── config/       # Configuration file (config.json) management
│   ├── rss/
│   └── weather/
├── settings/
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── Calendar/
├── Clock/
├── RSS/
└── Weather/

lib/
├── config.ts         # Configuration types and defaults
├── constants.ts      # System constants (API limits, validation ranges)
├── storage.ts        # Configuration management and browser detection
└── urlValidation.ts  # SSRF protection

scripts/
├── config.sh         # Configuration file (config.json) CLI management
├── install.sh        # Automated installation for Raspberry Pi
├── start-kiosk.sh    # Launch kiosk mode
├── uninstall.sh      # Service removal
└── update.sh         # Update code and rebuild (no restart)
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - ESLint

## Development Guide

### Code Style

- Use TypeScript
- Functional components + hooks
- Tailwind CSS
- Small, focused components

### Adding New Features

1. Create component in `components/`
2. Add API route in `app/api/` if needed
3. Update configuration types in `lib/config.ts`
4. Add component to `app/page.tsx`
5. Update settings page

### API Route Pattern

```typescript
import { NextResponse } from 'next/server';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';
import { API, PROCESSING_LIMITS } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  // SSRF validation required
  const validation = validateCalendarUrl(url);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    // Apply timeout and size limits
    const response = await fetchWithTimeout(url, API.TIMEOUT_MS, API.MAX_RSS_SIZE);
    const data = await response.text();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
```

### Security Checklist

All API routes fetching external URLs must:
- [ ] Validate URL with `validateCalendarUrl()`
- [ ] Use `fetchWithTimeout()`
- [ ] Use constants from `constants.ts`
- [ ] Return 400 on validation failure
- [ ] Set appropriate timeout and size limits

### Component Pattern

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getConfig } from '@/lib/storage';

export default function MyWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/my-endpoint');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const config = getConfig();
    const interval = setInterval(
      fetchData,
      config.refreshIntervals.myFeature * 60 * 1000
    );
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* UI */}</div>;
}
```

## Constants Management

### constants.ts (System Constraints)

```typescript
export const API = {
  TIMEOUT_MS: 10000,
  MAX_RSS_SIZE: 5 * 1024 * 1024,
} as const;

export const PROCESSING_LIMITS = {
  MAX_RSS_ITEMS_PER_FEED: 10,
  MAX_RSS_ITEMS_TOTAL: 20,
} as const;
```

### config.ts (User Settings)

```typescript
export interface KioskConfig {
  timezone: string;
  dateFormat: string;
  refreshIntervals: { weather: number; calendar: number; rss: number };
  displayLimits: { calendarEvents: number; rssItems: number };
  // ...
}
```

## Build and Deploy

```bash
npm run build
npm start
```

For Raspberry Pi deployment, see `./scripts/install.sh`

## Node.js Version

`.nvmrc` file included:

```bash
nvm use
```

## Troubleshooting

**Port already in use**
```bash
PORT=3001 npm run dev
```

**Dependency issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
node --version  # Check for v22.x.x
```
