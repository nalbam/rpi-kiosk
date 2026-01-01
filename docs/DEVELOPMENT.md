# Development Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Setup Development Environment

1. Clone the repository:
```bash
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Project Structure

```
rpi-kiosk/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── calendar/        # Calendar API endpoint
│   │   ├── rss/             # RSS feed API endpoint
│   │   └── weather/         # Weather API endpoint
│   ├── settings/            # Settings page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles
├── components/              # React Components
│   ├── Calendar/           # Calendar widget
│   ├── Clock/              # Clock widget
│   ├── RSS/                # RSS news widget
│   └── Weather/            # Weather widget
├── lib/                    # Utility Libraries
│   ├── config.ts          # Configuration types and defaults
│   ├── storage.ts         # LocalStorage management
│   └── urlValidation.ts   # SSRF protection utilities
├── scripts/               # Installation & Deployment Scripts
│   ├── install.sh        # Installation script for RPI
│   ├── start-kiosk.sh    # Kiosk mode startup script
│   └── rpi-kiosk.service # Systemd service file
├── types/                # TypeScript type declarations
│   └── ical.js.d.ts     # Type definitions for ical.js
├── public/               # Static assets
└── README.md            # Main documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing code structure
- Use functional components with hooks
- Use Tailwind CSS for styling
- Keep components small and focused

### Adding New Features

1. Create a new component in the `components/` directory
2. If the feature needs backend data, add an API route in `app/api/`
3. Update the configuration types in `lib/config.ts` if needed
4. Add the component to the main page (`app/page.tsx`)
5. Update the settings page if configuration is needed

### Testing

Before committing:
1. Run `npm run lint` to check for code issues
2. Run `npm run build` to ensure the project builds
3. Test your changes in the browser
4. Check both desktop and mobile layouts

### API Integration

All API routes follow this pattern:
- Located in `app/api/[feature]/route.ts`
- Export a `GET` function (or other HTTP methods)
- Return `NextResponse.json()` for responses
- Handle errors gracefully with try/catch
- Return appropriate HTTP status codes

Example:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

### Security: SSRF Protection

All API routes that fetch external URLs **MUST** use security utilities from `@/lib/urlValidation`:

#### Required Functions

**`validateCalendarUrl(url: string)`**
- Validates URLs to prevent Server-Side Request Forgery (SSRF) attacks
- Blocks non-HTTP(S) protocols
- Blocks localhost, loopback, and private IP ranges
- Blocks cloud metadata services (169.254.169.254, etc.)
- Blocks privileged and dangerous ports
- Returns: `{ valid: boolean, error?: string }`

**`fetchWithTimeout(url: string, timeoutMs?: number, maxSize?: number, redirectCount?: number)`**
- Fetches URLs with timeout and size limit protection
- Default timeout: 10 seconds
- Default max size: 10MB
- Follows up to 5 redirects
- Returns: Promise<Response>

#### Example Usage

```typescript
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userUrl = searchParams.get('url');

  if (!userUrl) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  // Step 1: Validate the URL
  const validation = validateCalendarUrl(userUrl);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  try {
    // Step 2: Fetch with timeout and size limits
    const response = await fetchWithTimeout(
      userUrl,
      10000,  // 10 second timeout
      5 * 1024 * 1024  // 5MB max size
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.text();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch external data' },
      { status: 500 }
    );
  }
}
```

#### Security Checklist for New API Routes

- [ ] Import `validateCalendarUrl` and `fetchWithTimeout`
- [ ] Validate ALL user-provided URLs before fetching
- [ ] Use `fetchWithTimeout()` instead of native `fetch()`
- [ ] Handle validation errors with 400 status
- [ ] Set appropriate timeout values
- [ ] Set appropriate size limits
- [ ] Test with malicious URLs (localhost, private IPs, etc.)

### Component Guidelines

Components should:
- Be self-contained
- Handle their own loading and error states
- Use the `'use client'` directive if they use hooks
- Fetch their own data using the API routes
- Respect the refresh intervals from configuration

Example component structure:
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
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const config = getConfig();
    const interval = setInterval(fetchData, config.refreshIntervals.myFeature * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return <div>{/* Your UI */}</div>;
}
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The application will be available at http://localhost:3000

## Deployment on Raspberry Pi

See the main README.md for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -am 'Add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Create a Pull Request

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can specify a different port:
```bash
PORT=3001 npm run dev
```

### Dependencies issues
Try removing node_modules and reinstalling:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors
Make sure you're using Node.js 18 or higher:
```bash
node --version
```

## License

MIT License - see LICENSE file for details
