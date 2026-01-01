# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPI Kiosk is a Raspberry Pi kiosk mode display application built with Next.js 14 (App Router) and TypeScript. It displays clock, weather, calendar, and RSS news feeds in a clean, modern dashboard.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Deployment Scripts
- `./scripts/install.sh` - Automated installation for Raspberry Pi
- `./scripts/start-kiosk.sh` - Launch kiosk mode
- Systemd service: `scripts/rpi-kiosk.service`

## Architecture

### Client-Server Pattern
- **Client Components** (`components/*/`): React components that fetch data from API routes and manage UI state
- **API Routes** (`app/api/*/route.ts`): Server-side endpoints that fetch external data (weather, calendar, RSS) and apply security validations
- **Configuration**: Stored in browser localStorage, managed via `lib/storage.ts`, with defaults in `lib/config.ts`

### Data Flow
1. Client components read configuration from localStorage (`getConfig()`)
2. Components call Next.js API routes with configuration parameters
3. API routes validate URLs (SSRF protection), fetch external data, and return processed results
4. Components refresh data based on configurable intervals (default: weather 30min, calendar/RSS 15min)

### Key Modules

#### Configuration (`lib/config.ts`, `lib/storage.ts`)
- `KioskConfig` interface defines all user settings (timezone, weather location, calendar URL, RSS feeds, refresh intervals)
- `getConfig()` - Reads from localStorage with fallback to `defaultConfig`
- `saveConfig()` - Persists partial updates to localStorage
- Configuration is client-side only (no server state)

#### Security (`lib/urlValidation.ts`)
CRITICAL: All external URLs (calendar, RSS) MUST pass through `validateCalendarUrl()` to prevent SSRF attacks.

Blocked patterns:
- Non-HTTP(S) protocols
- Localhost, loopback addresses (127.0.0.0/8, ::1)
- Private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7, fe80::/10)
- Cloud metadata services (169.254.169.254, fd00:ec2::254)
- Privileged ports except 80/443
- Dangerous service ports (SSH, databases, etc.)

`fetchWithTimeout()` enforces:
- Configurable timeout (default 10s)
- Maximum response size (default 10MB)
- Abort signal for cancellation

#### API Routes Pattern
All API routes (`app/api/*/route.ts`) follow this structure:
1. Extract query parameters from `searchParams`
2. Validate required parameters (return 400 if missing)
3. **For external URLs**: Validate with `validateCalendarUrl()` (return 400 if invalid)
4. Fetch data with `fetchWithTimeout()` for timeout/size protection
5. Process and transform data
6. Return JSON response with proper error handling (500 on failure)

#### Component Pattern
All widget components (`components/*/`) follow this pattern:
- Client components (`'use client'`)
- Manage local state (data, loading, error)
- Read config via `getConfig()` on mount and for refresh intervals
- Fetch from `/api/*` routes
- Use `useEffect` with `setInterval` for auto-refresh (cleanup on unmount)
- Render loading state, error state, and data state

### File Organization
```
app/
├── api/              # Server-side API routes
│   ├── calendar/     # Google Calendar iCal fetching
│   ├── rss/          # RSS feed aggregation
│   └── weather/      # Open-Meteo API integration
├── settings/         # Settings page (client component)
├── layout.tsx        # Root layout with metadata
└── page.tsx          # Main dashboard (client component)

components/           # Reusable widgets
├── Calendar/         # Calendar events display
├── Clock/            # Time display with timezone support
├── RSS/              # RSS news feed aggregator
└── Weather/          # Weather widget with icons

lib/                  # Shared utilities
├── config.ts         # Configuration types and defaults
├── storage.ts        # localStorage management
└── urlValidation.ts  # SSRF protection utilities
```

## Technology Stack
- **Runtime**: Node.js 22 LTS
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 3.4.19
- **Date Handling**: date-fns 4.1.0, date-fns-tz 3.2.0
- **Calendar Parsing**: ical.js 1.5.0
- **RSS Parsing**: rss-parser 3.13.0
- **Weather API**: Open-Meteo (free, no API key)

## Important Patterns

### Adding New External Data Sources
When adding API routes that fetch external URLs:
1. Import `validateCalendarUrl` and `fetchWithTimeout` from `@/lib/urlValidation`
2. Validate ALL user-provided URLs before fetching
3. Use `fetchWithTimeout()` with appropriate timeout and size limits
4. Handle validation errors with 400 status and descriptive messages
5. Follow existing error handling patterns in `app/api/calendar/route.ts` and `app/api/rss/route.ts`

### Adding New Configuration Options
1. Update `KioskConfig` interface in `lib/config.ts`
2. Add defaults to `defaultConfig`
3. Update settings page (`app/settings/`) to allow user configuration
4. Components automatically merge new fields via spread operator in `getConfig()`

### Widget Development
New widgets should:
- Be placed in `components/{WidgetName}/{WidgetName}.tsx`
- Use the client component pattern with loading/error states
- Read configuration from `getConfig()`
- Implement auto-refresh with cleanup
- Match the design system (bg-gray-900, border-gray-800, rounded-lg)
- Be added to the grid in `app/page.tsx`

## Security Considerations
- **SSRF Protection**: Never fetch external URLs without validation
- **Input Validation**: All API routes validate parameters before processing
- **Response Size Limits**: Prevent memory exhaustion from large responses
- **Timeout Protection**: Prevent hanging requests
- **No Sensitive Data**: Application uses client-side config only (no secrets, no database)
