# RPI Kiosk

Kiosk display application for Raspberry Pi. Built with Next.js and TypeScript.

## Features

- 🕐 Clock (with timezone support)
- 🌤️ Weather (temperature, humidity, wind speed)
- 📅 Calendar (Google Calendar integration)
- 📰 News (RSS feeds)
- ⚙️ Web-based settings page

## Requirements

- Raspberry Pi 3 or higher
- Raspberry Pi OS
- Node.js 22 LTS

## Installation

```bash
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk
./scripts/install.sh
```

The installation script automatically handles:
- System package installation (chromium, unclutter, etc.)
- Node.js 22 installation
- npm dependency installation and build
- systemd service registration and startup

## Update

```bash
./scripts/update.sh
```

Automatically fetches the latest code, builds, and restarts the service:
- git pull (latest code)
- npm install (update dependencies)
- npm run build (rebuild)
- systemctl restart (restart service)

## Uninstall

```bash
./scripts/uninstall.sh
```

Only removes the systemd service. App files and system packages are retained.

## Configuration

### Method 1: Web UI (Recommended)

Click the `Settings` button in the browser to make changes.

### Method 2: Configuration File (config.json)

Manage settings with shell script:

```bash
# Create configuration file
./scripts/config.sh init

# Set values
./scripts/config.sh set timezone "America/New_York"
./scripts/config.sh set weatherLocation.lat 40.7128
./scripts/config.sh set weatherLocation.lon -74.0060
./scripts/config.sh set displayLimits.rssItems 10

# Get value
./scripts/config.sh get timezone

# View all settings
./scripts/config.sh list
```

**Priority**: Browser settings > config.json > defaults

### Configuration Options

**Time**
- Timezone (e.g., Asia/Seoul)
- Date format

**Weather**
- City name, latitude/longitude
- Refresh interval (minutes)

**Calendar**
- Google Calendar iCal URL
- Refresh interval (minutes)
- Number of events to display (1-10)

**RSS**
- Add/remove feed URLs
- Refresh interval (minutes)
- Number of news items to display (1-10)

### Getting Google Calendar URL

1. Google Calendar → Settings and sharing
2. Integrate calendar → Secret address
3. Copy iCal format URL

## Service Management

```bash
# Check status
sudo systemctl status rpi-kiosk

# Restart
sudo systemctl restart rpi-kiosk

# View logs
sudo journalctl -u rpi-kiosk -f

# Stop
sudo systemctl stop rpi-kiosk

# Start
sudo systemctl start rpi-kiosk
```

## Development

```bash
npm run dev
```

http://localhost:3000

## Technology Stack

- Node.js 22, Next.js 16, React 19, TypeScript 5
- Tailwind CSS, date-fns, ical.js, rss-parser
- Weather API: Open-Meteo (free)

## Project Structure

```
app/
├── api/              # API Routes
│   ├── calendar/
│   ├── rss/
│   └── weather/
├── settings/         # Settings page
└── page.tsx          # Main page

components/           # Widgets
├── Calendar/
├── Clock/
├── RSS/
└── Weather/

lib/
├── config.ts         # Configuration types and defaults
├── constants.ts      # System constants
├── storage.ts        # localStorage management
└── urlValidation.ts  # SSRF protection

scripts/
├── install.sh        # Installation and service registration
├── uninstall.sh      # Service removal
└── start-kiosk.sh    # Kiosk launcher
```

## Troubleshooting

**Weather not displaying**
- Check internet connection
- Enter correct latitude/longitude in settings

**Calendar not displaying**
- Verify iCal URL format
- Check calendar sharing settings

**RSS not displaying**
- Verify valid RSS URL
- Check browser console for errors

## License

MIT License
